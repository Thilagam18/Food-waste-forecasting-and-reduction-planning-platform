from flask import Blueprint, request, jsonify
from backend.utils.auth import org_required
from backend.services.analytics import AnalyticsService
from backend.models.alert import Alert
from backend.models.recommendation import Recommendation

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')

@dashboard_bp.route('/stats', methods=['GET'])
@org_required
def get_dashboard_stats(current_user):
    days = request.args.get('days', default=30, type=int)
    analytics = AnalyticsService(current_user.organization_id)
    summary = analytics.get_dashboard_summary(days=days)

    # Fetch count of active alerts and pending recommendations
    active_alerts_count = Alert.query.filter_by(
        organization_id=current_user.organization_id,
        is_resolved=False
    ).count()

    pending_recs_count = Recommendation.query.filter(
        Recommendation.organization_id == current_user.organization_id,
        Recommendation.status.in_(['Pending', 'In Progress'])
    ).count()

    summary['active_alerts_count'] = active_alerts_count
    summary['pending_recs_count'] = pending_recs_count
    summary['organization'] = current_user.organization.to_dict()

    return jsonify({'success': True, 'data': summary}), 200

@dashboard_bp.route('/charts', methods=['GET'])
@org_required
def get_dashboard_charts(current_user):
    days = request.args.get('days', default=30, type=int)
    analytics = AnalyticsService(current_user.organization_id)
    charts = analytics.get_chart_analytics(days=days)

    return jsonify({'success': True, 'data': charts}), 200
