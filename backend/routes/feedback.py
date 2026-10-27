from datetime import datetime
from flask import Blueprint, request, jsonify
from backend.extensions import db
from backend.utils.auth import org_required
from backend.models.feedback import StaffFeedback

feedback_bp = Blueprint('feedback', __name__, url_prefix='/api/feedback')

@feedback_bp.route('', methods=['GET'])
@org_required
def list_feedback(current_user):
    meal_period = request.args.get('meal_period', '').strip()
    status = request.args.get('status', '').strip()
    feedback_type = request.args.get('feedback_type', '').strip()

    query = StaffFeedback.query.filter_by(organization_id=current_user.organization_id)
    if meal_period:
        query = query.filter(StaffFeedback.meal_period == meal_period)
    if status:
        query = query.filter(StaffFeedback.status == status)
    if feedback_type:
        query = query.filter(StaffFeedback.feedback_type == feedback_type)

    feedbacks = query.order_by(StaffFeedback.created_at.desc()).all()

    # Pre-seed some default feedback items if empty
    if not feedbacks:
        default_items = [
            StaffFeedback(
                organization_id=current_user.organization_id,
                staff_name='Ramesh Kumar',
                staff_role='Steward',
                meal_period='Lunch',
                dish_name='Steamed Basmati Rice',
                feedback_type='Portion Too Large',
                severity='High',
                comments='Students left around 20% of rice on plates today. Ladle portion is 220g which is too big for lunch.',
                chef_action_notes='Calibrated standard service ladle to 180g starting tomorrow lunch.',
                status='Action Implemented'
            ),
            StaffFeedback(
                organization_id=current_user.organization_id,
                staff_name='Anjali Sharma',
                staff_role='Floor Captain',
                meal_period='Lunch',
                dish_name='Vegetable Sambar Dal',
                feedback_type='Taste / Spiciness',
                severity='Medium',
                comments='Several faculty members mentioned sambar was slightly oversalted, leading to uneaten bowl portions.',
                chef_action_notes='Reviewed seasoning batch sheet with line cooks.',
                status='Reviewed'
            ),
            StaffFeedback(
                organization_id=current_user.organization_id,
                staff_name='Karthik V.',
                staff_role='Head Chef',
                meal_period='Breakfast',
                dish_name='Mixed Fruit Salad',
                feedback_type='Temperature',
                severity='Low',
                comments='Chilled counter display holding temperature was 8°C. Adjusted compressor to 3°C to maintain crispness.',
                chef_action_notes='Temperature log logged at 3.5°C.',
                status='Action Implemented'
            ),
            StaffFeedback(
                organization_id=current_user.organization_id,
                staff_name='Pooja Nair',
                staff_role='Diner Rep',
                meal_period='Dinner',
                dish_name='Paneer Butter Masala',
                feedback_type='Overprep / Leftover',
                severity='Medium',
                comments='Evening attendance was 15% lower than Friday forecast. Around 12kg remained unserved.',
                chef_action_notes='Rapidly blast-chilled and redistributed for early breakfast rolls.',
                status='Action Implemented'
            )
        ]
        db.session.add_all(default_items)
        db.session.commit()
        feedbacks = StaffFeedback.query.filter_by(organization_id=current_user.organization_id).order_by(StaffFeedback.created_at.desc()).all()

    return jsonify({
        'success': True,
        'count': len(feedbacks),
        'data': [f.to_dict() for f in feedbacks]
    }), 200

@feedback_bp.route('', methods=['POST'])
@org_required
def create_feedback(current_user):
    data = request.get_json() or {}
    staff_name = data.get('staff_name', '').strip()
    dish_name = data.get('dish_name', '').strip()
    comments = data.get('comments', '').strip()

    if not staff_name or not dish_name or not comments:
        return jsonify({'success': False, 'message': 'Staff name, dish name, and comments are required.'}), 400

    feedback = StaffFeedback(
        organization_id=current_user.organization_id,
        staff_name=staff_name,
        staff_role=data.get('staff_role', 'Steward'),
        meal_period=data.get('meal_period', 'Lunch'),
        dish_name=dish_name,
        feedback_type=data.get('feedback_type', 'Portion Too Large'),
        severity=data.get('severity', 'Medium'),
        comments=comments,
        status='Pending'
    )
    db.session.add(feedback)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Floor feedback submitted successfully.',
        'data': feedback.to_dict()
    }), 201

@feedback_bp.route('/<int:feedback_id>/status', methods=['PATCH'])
@org_required
def update_feedback_status(current_user, feedback_id):
    feedback = StaffFeedback.query.filter_by(
        id=feedback_id,
        organization_id=current_user.organization_id
    ).first()
    if not feedback:
        return jsonify({'success': False, 'message': 'Feedback not found.'}), 404

    data = request.get_json() or {}
    status = data.get('status', '').strip()
    chef_action_notes = data.get('chef_action_notes', '').strip()

    if status:
        feedback.status = status
    if chef_action_notes:
        feedback.chef_action_notes = chef_action_notes

    db.session.commit()
    return jsonify({
        'success': True,
        'message': 'Feedback updated.',
        'data': feedback.to_dict()
    }), 200
