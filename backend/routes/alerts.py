from flask import Blueprint, request, jsonify
from backend.extensions import db
from backend.utils.auth import org_required
from backend.models.alert import Alert

alerts_bp = Blueprint('alerts', __name__, url_prefix='/api/alerts')

@alerts_bp.route('', methods=['GET'])
@org_required
def list_alerts(current_user):
    is_resolved_param = request.args.get('is_resolved', type=str)

    query = Alert.query.filter_by(organization_id=current_user.organization_id)

    if is_resolved_param is not None and is_resolved_param != '':
        resolved_bool = is_resolved_param.lower() in ['true', '1']
        query = query.filter_by(is_resolved=resolved_bool)

    alerts = query.order_by(Alert.is_resolved.asc(), Alert.created_at.desc()).all()
    return jsonify({
        'success': True,
        'count': len(alerts),
        'active_count': len([a for a in alerts if not a.is_resolved]),
        'data': [a.to_dict() for a in alerts]
    }), 200

@alerts_bp.route('/<int:alert_id>/resolve', methods=['PATCH'])
@org_required
def resolve_alert(current_user, alert_id):
    alert = Alert.query.filter_by(
        id=alert_id,
        organization_id=current_user.organization_id
    ).first()
    if not alert:
        return jsonify({'success': False, 'message': 'Alert not found.'}), 404

    alert.is_resolved = True
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Alert marked as resolved.',
        'data': alert.to_dict()
    }), 200
