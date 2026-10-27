from datetime import date
from flask import Blueprint, request, jsonify
from backend.utils.auth import org_required
from backend.models.forecast_result import ForecastResult
from backend.models.food_item import FoodItem
from backend.forecasting.engine import DemandForecastingEngine

forecasting_bp = Blueprint('forecasting', __name__, url_prefix='/api/forecasting')

@forecasting_bp.route('/latest', methods=['GET'])
@org_required
def get_latest_forecasts(current_user):
    food_item_id = request.args.get('food_item_id', type=int)
    today = date.today()

    query = ForecastResult.query.filter(
        ForecastResult.organization_id == current_user.organization_id,
        ForecastResult.target_date >= today
    )

    if food_item_id:
        query = query.filter(ForecastResult.food_item_id == food_item_id)

    forecasts = query.order_by(ForecastResult.target_date.asc(), ForecastResult.food_item_id.asc()).all()

    # Summary metrics across the forecasts
    total_predicted = sum(f.predicted_demand for f in forecasts)
    total_recommended = sum(f.recommended_prep for f in forecasts)
    total_expected_surplus = sum(f.expected_surplus for f in forecasts)

    model_types = list({f.model_type for f in forecasts})
    is_baseline = any(f.is_baseline for f in forecasts)
    avg_mae = round(sum(f.mae for f in forecasts if f.mae) / len(forecasts), 3) if forecasts and any(f.mae for f in forecasts) else None
    avg_rmse = round(sum(f.rmse for f in forecasts if f.rmse) / len(forecasts), 3) if forecasts and any(f.rmse for f in forecasts) else None

    return jsonify({
        'success': True,
        'summary': {
            'total_predicted_demand': round(total_predicted, 1),
            'total_recommended_prep': round(total_recommended, 1),
            'total_expected_surplus': round(total_expected_surplus, 1),
            'model_types': model_types,
            'is_baseline': is_baseline,
            'avg_mae': avg_mae,
            'avg_rmse': avg_rmse,
            'forecast_count': len(forecasts)
        },
        'data': [f.to_dict() for f in forecasts]
    }), 200

@forecasting_bp.route('/generate', methods=['POST'])
@org_required
def generate_forecasts(current_user):
    data = request.get_json() or {}
    food_item_id = data.get('food_item_id')
    horizon_days = data.get('horizon_days', 7)
    buffer_pct = data.get('buffer_pct', 0.08)

    try:
        horizon_days = max(1, min(14, int(horizon_days)))
        buffer_pct = max(0.0, min(0.30, float(buffer_pct)))
    except (ValueError, TypeError):
        horizon_days = 7
        buffer_pct = 0.08

    engine = DemandForecastingEngine(current_user.organization_id)

    if food_item_id:
        result = engine.train_and_forecast_item(
            food_item_id=int(food_item_id),
            horizon_days=horizon_days,
            buffer_pct=buffer_pct
        )
        return jsonify(result), 200
    else:
        results = engine.train_and_forecast_all(horizon_days=horizon_days)
        return jsonify({
            'success': True,
            'message': f'Forecasts generated for {len(results)} food items.',
            'results': results
        }), 200
