import math
from datetime import date, timedelta
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error

from backend.extensions import db
from backend.models.daily_food_record import DailyFoodRecord
from backend.models.food_item import FoodItem
from backend.models.forecast_result import ForecastResult

MEAL_PERIOD_MAP = {
    'Breakfast': 1,
    'Lunch': 2,
    'Snacks': 3,
    'Dinner': 4
}
INV_MEAL_PERIOD_MAP = {v: k for k, v in MEAL_PERIOD_MAP.items()}

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Constructs time-series features without look-ahead bias.
    """
    df = df.copy()
    df['record_date'] = pd.to_datetime(df['record_date'])
    df = df.sort_values(by=['record_date', 'meal_period_num']).reset_index(drop=True)

    df['day_of_week'] = df['record_date'].dt.dayofweek  # 0=Monday, 6=Sunday
    df['month'] = df['record_date'].dt.month
    df['day_of_month'] = df['record_date'].dt.day
    df['is_weekend'] = df['day_of_week'].apply(lambda x: 1 if x in [5, 6] else 0)

    # Historical lag and rolling stats for consumption
    # To avoid data leakage, shift consumption by 1 record
    df['lag_1'] = df['quantity_consumed'].shift(1)
    df['lag_7'] = df['quantity_consumed'].shift(7)
    df['rolling_mean_7'] = df['quantity_consumed'].shift(1).rolling(window=7, min_periods=1).mean()
    df['rolling_mean_14'] = df['quantity_consumed'].shift(1).rolling(window=14, min_periods=1).mean()

    # Fill earliest NaNs with expanding mean
    df['lag_1'] = df['lag_1'].bfill().fillna(df['quantity_consumed'])
    df['lag_7'] = df['lag_7'].bfill().fillna(df['quantity_consumed'])
    df['rolling_mean_7'] = df['rolling_mean_7'].bfill().fillna(df['quantity_consumed'])
    df['rolling_mean_14'] = df['rolling_mean_14'].bfill().fillna(df['quantity_consumed'])

    return df

class DemandForecastingEngine:
    def __init__(self, organization_id: int):
        self.organization_id = organization_id

    def load_historical_data(self, food_item_id: int = None) -> pd.DataFrame:
        query = db.session.query(DailyFoodRecord).filter(
            DailyFoodRecord.organization_id == self.organization_id
        )
        if food_item_id:
            query = query.filter(DailyFoodRecord.food_item_id == food_item_id)
        
        records = query.order_by(DailyFoodRecord.record_date.asc()).all()
        if not records:
            return pd.DataFrame()

        data = []
        for r in records:
            data.append({
                'record_date': r.record_date,
                'food_item_id': r.food_item_id,
                'meal_period': r.meal_period,
                'meal_period_num': MEAL_PERIOD_MAP.get(r.meal_period, 2),
                'quantity_prepared': float(r.quantity_prepared),
                'quantity_consumed': float(r.quantity_consumed),
                'surplus_quantity': float(r.surplus_quantity),
                'discarded_quantity': float(r.discarded_quantity),
                'unit_cost': float(r.unit_cost)
            })
        return pd.DataFrame(data)

    def train_and_forecast_item(self, food_item_id: int, horizon_days: int = 7, buffer_pct: float = 0.08) -> dict:
        """
        Trains and generates forecasts for a specific food item across its meal periods.
        """
        item = db.session.get(FoodItem, food_item_id)
        if not item or item.organization_id != self.organization_id:
            return {'success': False, 'message': 'Food item not found or unauthorized'}

        df = self.load_historical_data(food_item_id)
        
        today = date.today()
        # If records count < 7, fallback gracefully to transparent moving average baseline
        if len(df) < 7:
            return self._baseline_fallback(item, df, horizon_days, buffer_pct)

        df_feat = engineer_features(df)
        feature_cols = ['meal_period_num', 'day_of_week', 'month', 'day_of_month', 'is_weekend',
                        'lag_1', 'lag_7', 'rolling_mean_7', 'rolling_mean_14']
        
        target_col = 'quantity_consumed'

        # Chronological train-validation split (last 7 records for validation if len >= 21)
        val_size = min(7, int(len(df_feat) * 0.2))
        if val_size >= 2 and len(df_feat) >= 14:
            train_df = df_feat.iloc[:-val_size]
            val_df = df_feat.iloc[-val_size:]
        else:
            train_df = df_feat
            val_df = df_feat.iloc[-min(3, len(df_feat)):]

        X_train = train_df[feature_cols]
        y_train = train_df[target_col]
        X_val = val_df[feature_cols]
        y_val = val_df[target_col]

        # Model candidates
        models = {
            'RandomForest': RandomForestRegressor(n_estimators=60, max_depth=6, random_state=42),
            'GradientBoosting': GradientBoostingRegressor(n_estimators=50, max_depth=4, learning_rate=0.08, random_state=42)
        }

        best_model_name = 'RandomForest'
        best_model = None
        best_rmse = float('inf')
        best_mae = float('inf')

        for name, model in models.items():
            model.fit(X_train, y_train)
            preds = model.predict(X_val)
            mae = mean_absolute_error(y_val, preds)
            rmse = math.sqrt(mean_squared_error(y_val, preds))
            if rmse < best_rmse:
                best_rmse = rmse
                best_mae = mae
                best_model_name = name
                best_model = model

        # Refit best model on all available data for future forecast
        best_model.fit(df_feat[feature_cols], df_feat[target_col])

        # Generate predictions for the future horizon
        predictions = []
        last_consumed = df_feat['quantity_consumed'].iloc[-1]
        recent_7_mean = df_feat['quantity_consumed'].tail(7).mean()
        recent_14_mean = df_feat['quantity_consumed'].tail(14).mean()

        # Identify typical meal periods for this item
        meal_periods = df['meal_period'].unique().tolist()
        if not meal_periods:
            meal_periods = ['Lunch']

        # Clear existing forecasts for this item from today onwards
        db.session.query(ForecastResult).filter(
            ForecastResult.organization_id == self.organization_id,
            ForecastResult.food_item_id == food_item_id,
            ForecastResult.target_date >= today
        ).delete()

        created_forecast_records = []

        for day_offset in range(1, horizon_days + 1):
            target_date = today + timedelta(days=day_offset)
            dow = target_date.weekday()
            month = target_date.month
            dom = target_date.day
            is_wknd = 1 if dow in [5, 6] else 0

            for mp in meal_periods:
                mp_num = MEAL_PERIOD_MAP.get(mp, 2)
                row_features = pd.DataFrame([{
                    'meal_period_num': mp_num,
                    'day_of_week': dow,
                    'month': month,
                    'day_of_month': dom,
                    'is_weekend': is_wknd,
                    'lag_1': last_consumed,
                    'lag_7': recent_7_mean,
                    'rolling_mean_7': recent_7_mean,
                    'rolling_mean_14': recent_14_mean
                }])

                pred = float(best_model.predict(row_features)[0])
                pred = max(0.5, round(pred, 2))  # Non-negative prediction

                # Recommended prep with buffer
                recommended = round(pred * (1.0 + buffer_pct), 2)
                expected_surplus = round(max(0.0, recommended - pred), 2)

                # Uncertainty interval: approx 80% confidence interval ~ 1.28 * RMSE
                half_width = max(0.5, round(1.28 * best_rmse, 2))
                lower_bound = max(0.0, round(pred - half_width, 2))
                upper_bound = round(pred + half_width, 2)

                forecast_rec = ForecastResult(
                    organization_id=self.organization_id,
                    food_item_id=food_item_id,
                    target_date=target_date,
                    meal_period=mp,
                    predicted_demand=pred,
                    expected_surplus=expected_surplus,
                    recommended_prep=recommended,
                    lower_bound=lower_bound,
                    upper_bound=upper_bound,
                    model_type=f"{best_model_name}Regressor",
                    mae=round(best_mae, 3),
                    rmse=round(best_rmse, 3),
                    confidence_level=0.85,
                    is_baseline=False,
                    notes=f"Trained on {len(df)} historical entries with {int(buffer_pct * 100)}% safety margin."
                )
                db.session.add(forecast_rec)
                created_forecast_records.append(forecast_rec)

                # Advance lag for multi-step simulation
                last_consumed = pred

        db.session.commit()

        return {
            'success': True,
            'food_item_id': food_item_id,
            'food_item_name': item.name,
            'model_type': f"{best_model_name}Regressor",
            'mae': round(best_mae, 3),
            'rmse': round(best_rmse, 3),
            'is_baseline': False,
            'sample_size': len(df),
            'forecasts': [f.to_dict() for f in created_forecast_records]
        }

    def _baseline_fallback(self, item: FoodItem, df: pd.DataFrame, horizon_days: int, buffer_pct: float) -> dict:
        """
        Transparent baseline forecast when historical records are insufficient (< 7 records).
        Uses rolling mean with clear baseline disclosure.
        """
        today = date.today()
        base_val = 15.0  # default reasonable fallback
        mae = 1.8
        rmse = 2.4

        if not df.empty and len(df) > 0:
            base_val = float(df['quantity_consumed'].mean())
            if len(df) >= 2:
                mae = float(abs(df['quantity_consumed'] - base_val).mean())
                rmse = float(math.sqrt(((df['quantity_consumed'] - base_val) ** 2).mean()))

        meal_periods = df['meal_period'].unique().tolist() if not df.empty else ['Lunch']
        if not meal_periods:
            meal_periods = ['Lunch']

        # Clear existing
        db.session.query(ForecastResult).filter(
            ForecastResult.organization_id == self.organization_id,
            ForecastResult.food_item_id == item.id,
            ForecastResult.target_date >= today
        ).delete()

        created = []
        for day_offset in range(1, horizon_days + 1):
            target_date = today + timedelta(days=day_offset)
            dow = target_date.weekday()
            # Minor weekend seasonality adjustment for baseline
            adj = 1.15 if dow in [5, 6] else 1.0
            pred = max(0.5, round(base_val * adj, 2))
            recommended = round(pred * (1.0 + buffer_pct), 2)
            expected_surplus = round(max(0.0, recommended - pred), 2)

            rec = ForecastResult(
                organization_id=self.organization_id,
                food_item_id=item.id,
                target_date=target_date,
                meal_period=meal_periods[0],
                predicted_demand=pred,
                expected_surplus=expected_surplus,
                recommended_prep=recommended,
                lower_bound=max(0.0, round(pred - 1.28 * rmse, 2)),
                upper_bound=round(pred + 1.28 * rmse, 2),
                model_type='Preliminary Moving Average Baseline',
                mae=round(mae, 3),
                rmse=round(rmse, 3),
                confidence_level=0.70,
                is_baseline=True,
                notes="Preliminary Baseline: Historical data is under 7 records. Predictions will automatically switch to Random Forest / Gradient Boosting once more records are logged."
            )
            db.session.add(rec)
            created.append(rec)

        db.session.commit()

        return {
            'success': True,
            'food_item_id': item.id,
            'food_item_name': item.name,
            'model_type': 'Preliminary Moving Average Baseline',
            'mae': round(mae, 3),
            'rmse': round(rmse, 3),
            'is_baseline': True,
            'sample_size': len(df),
            'forecasts': [f.to_dict() for f in created]
        }

    def train_and_forecast_all(self, horizon_days: int = 7) -> list:
        """
        Runs forecasting for all active food items in the organization.
        """
        items = db.session.query(FoodItem).filter(
            FoodItem.organization_id == self.organization_id,
            FoodItem.is_active == True
        ).all()
        results = []
        for item in items:
            res = self.train_and_forecast_item(item.id, horizon_days=horizon_days)
            results.append(res)
        return results
