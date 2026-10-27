from datetime import date, timedelta
from sqlalchemy import func
from backend.extensions import db
from backend.models.daily_food_record import DailyFoodRecord
from backend.models.food_item import FoodItem
from backend.models.forecast_result import ForecastResult
from backend.models.intervention_outcome import InterventionOutcome

# Environmental Impact conversion factors (Transparent scientific methodology):
# 1. GHG Emissions: 2.5 kg CO2e per 1 kg food waste (FAO Food Wastage Footprint / US EPA WARM model)
# 2. Virtual Water Footprint: 1,000 Liters per 1 kg food waste (Water Footprint Network / WRI)
# 3. Meal Equivalent: 0.45 kg of food equals 1 standard nutritious meal (USDA / Feeding America benchmark)
CO2E_PER_KG_WASTE = 2.5
LITERS_WATER_PER_KG_WASTE = 1000.0
KG_PER_MEAL = 0.45

class AnalyticsService:
    def __init__(self, organization_id: int):
        self.organization_id = organization_id

    def get_dashboard_summary(self, days: int = 30) -> dict:
        """
        Calculates all core dashboard KPIs with real database records and period-over-period comparisons.
        """
        today = date.today()
        start_date = today - timedelta(days=days)
        prev_start_date = start_date - timedelta(days=days)

        # Current period records
        current_records = db.session.query(DailyFoodRecord).filter(
            DailyFoodRecord.organization_id == self.organization_id,
            DailyFoodRecord.record_date >= start_date,
            DailyFoodRecord.record_date <= today
        ).all()

        # Previous period records for comparison
        prev_records = db.session.query(DailyFoodRecord).filter(
            DailyFoodRecord.organization_id == self.organization_id,
            DailyFoodRecord.record_date >= prev_start_date,
            DailyFoodRecord.record_date < start_date
        ).all()

        # Aggregations for current period
        total_prep = sum(r.quantity_prepared for r in current_records)
        total_consumed = sum(r.quantity_consumed for r in current_records)
        total_waste = sum(r.discarded_quantity for r in current_records)
        total_surplus = sum(r.surplus_quantity for r in current_records)
        total_waste_cost = sum(r.waste_cost for r in current_records)
        total_surplus_cost = sum(r.surplus_cost for r in current_records)

        waste_pct = round((total_waste / total_prep * 100), 1) if total_prep > 0 else 0.0

        # Aggregations for previous period
        prev_prep = sum(r.quantity_prepared for r in prev_records)
        prev_waste = sum(r.discarded_quantity for r in prev_records)
        prev_waste_pct = round((prev_waste / prev_prep * 100), 1) if prev_prep > 0 else 0.0

        # Waste reduction % comparison: (prev_rate - current_rate)
        if prev_waste_pct > 0:
            reduction_vs_prev = round(((prev_waste_pct - waste_pct) / prev_waste_pct) * 100, 1)
        else:
            reduction_vs_prev = 0.0

        # Forecasted demand for next 7 days
        next_7_days = today + timedelta(days=7)
        forecast_recs = db.session.query(ForecastResult).filter(
            ForecastResult.organization_id == self.organization_id,
            ForecastResult.target_date > today,
            ForecastResult.target_date <= next_7_days
        ).all()
        forecasted_demand = sum(f.predicted_demand for f in forecast_recs)

        # Environmental impacts avoided
        recorded_interventions = db.session.query(InterventionOutcome).filter(
            InterventionOutcome.organization_id == self.organization_id
        ).all()
        food_saved_interventions = sum(i.food_saved_kg for i in recorded_interventions)
        cost_saved_interventions = sum(i.cost_saved for i in recorded_interventions)

        co2_avoided = round(food_saved_interventions * CO2E_PER_KG_WASTE, 1)
        water_saved_l = round(food_saved_interventions * LITERS_WATER_PER_KG_WASTE, 0)
        meals_equivalent = round(food_saved_interventions / KG_PER_MEAL, 0) if KG_PER_MEAL > 0 else 0

        has_demo_data = any(r.is_demo for r in current_records)

        return {
            'period_days': days,
            'record_count': len(current_records),
            'has_data': len(current_records) > 0,
            'has_demo_data': has_demo_data,
            'metrics': {
                'total_prepared_kg': round(total_prep, 1),
                'total_consumed_kg': round(total_consumed, 1),
                'total_waste_kg': round(total_waste, 1),
                'current_surplus_kg': round(total_surplus, 1),
                'waste_percentage': waste_pct,
                'forecasted_demand_kg': round(forecasted_demand, 1),
                'total_waste_cost': round(total_waste_cost, 2),
                'total_surplus_cost': round(total_surplus_cost, 2),
                'reduction_vs_previous_period': reduction_vs_prev,
                'food_saved_interventions_kg': round(food_saved_interventions, 1),
                'cost_saved_interventions': round(cost_saved_interventions, 2),
                'co2_avoided_kg': co2_avoided,
                'water_saved_liters': water_saved_l,
                'meals_equivalent_saved': int(meals_equivalent)
            }
        }

    def get_chart_analytics(self, days: int = 30) -> dict:
        """
        Builds structured data sets formatted specifically for Recharts visualizations.
        """
        today = date.today()
        start_date = today - timedelta(days=days)

        records = db.session.query(DailyFoodRecord).filter(
            DailyFoodRecord.organization_id == self.organization_id,
            DailyFoodRecord.record_date >= start_date,
            DailyFoodRecord.record_date <= today
        ).order_by(DailyFoodRecord.record_date.asc()).all()

        # 1. Daily Trend: Date, Prepared, Consumed, Waste, Surplus
        daily_map = {}
        for r in records:
            d_str = r.record_date.strftime('%Y-%m-%d')
            if d_str not in daily_map:
                daily_map[d_str] = {
                    'date': d_str,
                    'prepared': 0.0,
                    'consumed': 0.0,
                    'waste': 0.0,
                    'surplus': 0.0,
                    'cost': 0.0
                }
            daily_map[d_str]['prepared'] += r.quantity_prepared
            daily_map[d_str]['consumed'] += r.quantity_consumed
            daily_map[d_str]['waste'] += r.discarded_quantity
            daily_map[d_str]['surplus'] += r.surplus_quantity
            daily_map[d_str]['cost'] += r.waste_cost

        daily_trends = [
            {
                'date': k,
                'prepared': round(v['prepared'], 1),
                'consumed': round(v['consumed'], 1),
                'waste': round(v['waste'], 1),
                'surplus': round(v['surplus'], 1),
                'cost': round(v['cost'], 2)
            }
            for k, v in sorted(daily_map.items())
        ]

        # 2. Waste by Category
        cat_map = {}
        for r in records:
            cat = r.food_item.category if r.food_item else 'General'
            if cat not in cat_map:
                cat_map[cat] = {'category': cat, 'waste_kg': 0.0, 'cost': 0.0}
            cat_map[cat]['waste_kg'] += r.discarded_quantity
            cat_map[cat]['cost'] += r.waste_cost

        category_breakdown = [
            {'category': k, 'waste_kg': round(v['waste_kg'], 1), 'cost': round(v['cost'], 2)}
            for k, v in cat_map.items()
        ]

        # 3. Waste by Reason
        reason_map = {}
        for r in records:
            reason = r.waste_reason if r.waste_reason and r.waste_reason != 'None' else 'Overproduction'
            if reason not in reason_map:
                reason_map[reason] = {'reason': reason, 'waste_kg': 0.0, 'count': 0}
            reason_map[reason]['waste_kg'] += r.discarded_quantity
            reason_map[reason]['count'] += 1

        waste_reasons = [
            {'reason': k, 'waste_kg': round(v['waste_kg'], 1), 'count': v['count']}
            for k, v in reason_map.items()
        ]

        # 4. Top Wasted Items
        item_map = {}
        for r in records:
            name = r.food_item.name if r.food_item else 'Item'
            unit = r.food_item.unit if r.food_item else 'kg'
            if name not in item_map:
                item_map[name] = {'name': name, 'waste_kg': 0.0, 'cost': 0.0, 'unit': unit}
            item_map[name]['waste_kg'] += r.discarded_quantity
            item_map[name]['cost'] += r.waste_cost

        top_wasted_items = sorted(item_map.values(), key=lambda x: x['waste_kg'], reverse=True)[:5]
        for it in top_wasted_items:
            it['waste_kg'] = round(it['waste_kg'], 1)
            it['cost'] = round(it['cost'], 2)

        # 5. Forecast vs Actual Comparison (Last 7 days where forecasts existed)
        past_7_days = today - timedelta(days=7)
        past_forecasts = db.session.query(ForecastResult).filter(
            ForecastResult.organization_id == self.organization_id,
            ForecastResult.target_date >= past_7_days,
            ForecastResult.target_date <= today
        ).all()

        f_map = {}
        for f in past_forecasts:
            d_str = f.target_date.strftime('%Y-%m-%d')
            f_map.setdefault(d_str, {'forecasted': 0.0, 'actual': 0.0})
            f_map[d_str]['forecasted'] += f.predicted_demand

        for d_str in f_map:
            if d_str in daily_map:
                f_map[d_str]['actual'] = daily_map[d_str]['consumed']

        forecast_vs_actual = [
            {
                'date': k,
                'forecasted': round(v['forecasted'], 1),
                'actual': round(v['actual'], 1)
            }
            for k, v in sorted(f_map.items())
        ]

        return {
            'daily_trends': daily_trends,
            'category_breakdown': category_breakdown,
            'waste_reasons': waste_reasons,
            'top_wasted_items': top_wasted_items,
            'forecast_vs_actual': forecast_vs_actual
        }
