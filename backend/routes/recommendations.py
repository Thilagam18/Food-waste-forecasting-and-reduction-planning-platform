from datetime import datetime, date
from flask import Blueprint, request, jsonify
from backend.extensions import db
from backend.utils.auth import org_required
from backend.models.recommendation import Recommendation
from backend.models.intervention_outcome import InterventionOutcome
from backend.recommendations.engine import RecommendationEngine

recommendations_bp = Blueprint('recommendations', __name__, url_prefix='/api/recommendations')

@recommendations_bp.route('', methods=['GET'])
@org_required
def list_recommendations(current_user):
    status = request.args.get('status', '').strip()
    priority = request.args.get('priority', '').strip()
    category = request.args.get('category', '').strip()

    query = Recommendation.query.filter_by(organization_id=current_user.organization_id)

    if status:
        query = query.filter(Recommendation.status == status)
    if priority:
        query = query.filter(Recommendation.priority == priority)
    if category:
        query = query.filter(Recommendation.category == category)

    recs = query.order_by(Recommendation.date_generated.desc(), Recommendation.id.desc()).all()

    # Calculate total potential savings
    potential_savings = sum(r.potential_savings_cost for r in recs if r.status in ['Pending', 'In Progress'])
    potential_reduction = sum(r.potential_waste_reduction_kg for r in recs if r.status in ['Pending', 'In Progress'])

    return jsonify({
        'success': True,
        'summary': {
            'total_pending_or_in_progress': len([r for r in recs if r.status in ['Pending', 'In Progress']]),
            'total_potential_savings': round(potential_savings, 2),
            'total_potential_reduction_kg': round(potential_reduction, 1)
        },
        'data': [r.to_dict() for r in recs]
    }), 200

@recommendations_bp.route('/refresh', methods=['POST'])
@org_required
def refresh_recommendations(current_user):
    engine = RecommendationEngine(current_user.organization_id)
    new_recs = engine.generate_recommendations()

    return jsonify({
        'success': True,
        'message': f'Analysis completed: {len(new_recs)} new recommendations identified.',
        'new_recommendations': [r.to_dict() for r in new_recs]
    }), 200

@recommendations_bp.route('/<int:rec_id>/status', methods=['PATCH'])
@org_required
def update_recommendation_status(current_user, rec_id):
    rec = Recommendation.query.filter_by(
        id=rec_id,
        organization_id=current_user.organization_id
    ).first()
    if not rec:
        return jsonify({'success': False, 'message': 'Recommendation not found.'}), 404

    data = request.get_json() or {}
    new_status = data.get('status', '').strip()
    action_notes = data.get('action_notes', '').strip()

    valid_statuses = ['Pending', 'In Progress', 'Completed', 'Dismissed']
    if new_status not in valid_statuses:
        return jsonify({'success': False, 'message': f'Status must be one of: {", ".join(valid_statuses)}'}), 400

    rec.status = new_status
    if action_notes:
        rec.action_notes = action_notes

    if new_status in ['Completed', 'Dismissed']:
        rec.resolved_at = datetime.utcnow()
    else:
        rec.resolved_at = None

    db.session.commit()
    return jsonify({
        'success': True,
        'message': f'Recommendation status updated to "{new_status}".',
        'data': rec.to_dict()
    }), 200

@recommendations_bp.route('/<int:rec_id>/intervene', methods=['POST'])
@org_required
def record_intervention(current_user, rec_id):
    rec = Recommendation.query.filter_by(
        id=rec_id,
        organization_id=current_user.organization_id
    ).first()
    if not rec:
        return jsonify({'success': False, 'message': 'Recommendation not found.'}), 404

    data = request.get_json() or {}
    action_taken = data.get('action_taken', '').strip()
    food_saved_kg = data.get('food_saved_kg', 0.0)
    cost_saved = data.get('cost_saved', 0.0)
    staff_notes = data.get('staff_notes', '').strip()

    if not action_taken:
        return jsonify({'success': False, 'message': 'Description of action taken is required.'}), 400

    try:
        saved_kg = max(0.0, float(food_saved_kg))
        saved_cost = max(0.0, float(cost_saved))
    except (ValueError, TypeError):
        saved_kg = 0.0
        saved_cost = 0.0

    intervention = InterventionOutcome(
        organization_id=current_user.organization_id,
        recommendation_id=rec.id,
        action_taken=action_taken,
        recorded_date=date.today(),
        food_saved_kg=saved_kg,
        cost_saved=saved_cost,
        staff_notes=staff_notes
    )
    # Automatically mark recommendation completed
    rec.status = 'Completed'
    rec.resolved_at = datetime.utcnow()
    if staff_notes:
        rec.action_notes = f"{rec.action_notes or ''}\nOutcome: {staff_notes}".strip()

    db.session.add(intervention)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Intervention recorded and recommendation marked as completed.',
        'data': intervention.to_dict()
    }), 201
