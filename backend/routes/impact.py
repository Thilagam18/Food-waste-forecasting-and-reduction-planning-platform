from flask import Blueprint, jsonify
from backend.utils.auth import org_required
from backend.services.analytics import AnalyticsService, CO2E_PER_KG_WASTE, LITERS_WATER_PER_KG_WASTE, KG_PER_MEAL
from backend.models.intervention_outcome import InterventionOutcome

impact_bp = Blueprint('impact', __name__, url_prefix='/api/impact')

@impact_bp.route('/summary', methods=['GET'])
@org_required
def get_impact_summary(current_user):
    analytics = AnalyticsService(current_user.organization_id)
    summary = analytics.get_dashboard_summary(days=30)
    
    # Interventions list
    interventions = InterventionOutcome.query.filter_by(
        organization_id=current_user.organization_id
    ).order_by(InterventionOutcome.recorded_date.desc()).all()

    return jsonify({
        'success': True,
        'metrics': summary['metrics'],
        'methodology': {
            'co2e_factor': {
                'value': f'{CO2E_PER_KG_WASTE} kg CO2e / kg waste',
                'description': 'Greenhouse gas emissions equivalent avoided per kilogram of edible food waste prevented.',
                'source': 'United States EPA WARM Model v15 / FAO Food Wastage Footprint Study'
            },
            'water_factor': {
                'value': f'{int(LITERS_WATER_PER_KG_WASTE)} Liters / kg waste',
                'description': 'Embedded virtual freshwater consumption (irrigation + processing) conserved per kilogram of food saved.',
                'source': 'Water Footprint Network & World Resources Institute (WRI)'
            },
            'meal_factor': {
                'value': f'{KG_PER_MEAL} kg / meal',
                'description': 'Portion weight equivalence benchmark for calculating nutritious meals rescued from surplus.',
                'source': 'USDA Economic Research Service & Feeding America Standard'
            }
        },
        'interventions': [i.to_dict() for i in interventions]
    }), 200
