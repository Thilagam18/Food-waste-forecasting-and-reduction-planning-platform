from datetime import datetime, date
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.extensions import db
from backend.models.user import User
from backend.models.patient import Patient
from backend.models.doctor import Doctor
from backend.models.queue import Queue, QueueItem, QueueEvent
from backend.services.queue_service import recalculate_queue_positions_and_eta, add_emergency_case_to_queue, broadcast_queue_update
from backend.services.notification_service import send_notification

queue_bp = Blueprint('queue', __name__, url_prefix='/api')

@queue_bp.route('/tokens/book', methods=['POST'])
@jwt_required()
def book_token():
    user_id = get_jwt_identity()
    patient = Patient.query.filter_by(user_id=user_id).first()
    if not patient:
        return jsonify({'success': False, 'message': 'Only registered patients can book tokens.'}), 403

    data = request.get_json() or {}
    hospital_id = data.get('hospital_id')
    doctor_id = data.get('doctor_id')
    department_id = data.get('department_id')

    if not hospital_id or not doctor_id or not department_id:
        return jsonify({'success': False, 'message': 'hospital_id, doctor_id, and department_id are required.'}), 400

    doctor = Doctor.query.get(doctor_id)
    if not doctor or not doctor.is_available:
        return jsonify({'success': False, 'message': 'Doctor is currently unavailable for token booking.'}), 400

    # Get or create active Queue for today
    today = date.today()
    queue = Queue.query.filter_by(doctor_id=doctor_id, date=today).first()
    if not queue:
        queue = Queue(
            hospital_id=hospital_id,
            doctor_id=doctor_id,
            department_id=department_id,
            current_token='None',
            total_tokens_today=0,
            active_tokens=0,
            status='ACTIVE',
            date=today
        )
        db.session.add(queue)
        db.session.commit()

    # Check if patient already has an active token in this queue
    existing_item = QueueItem.query.filter(
        QueueItem.queue_id == queue.id,
        QueueItem.patient_id == patient.id,
        QueueItem.status.in_(['WAITING', 'IN_PROGRESS', 'EMERGENCY'])
    ).first()

    if existing_item:
        return jsonify({
            'success': False,
            'message': f'You already have active token {existing_item.token_code} in this queue.',
            'token': existing_item.to_dict()
        }), 400

    # Calculate token code (e.g. A-27)
    queue.total_tokens_today += 1
    token_num = queue.total_tokens_today
    prefix = doctor.department.name[0].upper() if doctor.department else 'A'
    token_code = f"{prefix}-{token_num:02d}"

    # Calculate position
    waiting_count = QueueItem.query.filter(
        QueueItem.queue_id == queue.id,
        QueueItem.status.in_(['WAITING', 'EMERGENCY'])
    ).count()

    position = waiting_count + 1
    avg_mins = doctor.avg_consultation_time_mins or 12
    est_wait = (position - 1) * avg_mins + (avg_mins if queue.current_token != 'None' else 0)

    queue_item = QueueItem(
        queue_id=queue.id,
        patient_id=patient.id,
        doctor_id=doctor_id,
        token_number=token_num,
        token_code=token_code,
        status='WAITING',
        position=position,
        estimated_wait_mins=est_wait,
        is_emergency=False
    )
    db.session.add(queue_item)

    # Add log event
    event = QueueEvent(
        queue_id=queue.id,
        token_code=token_code,
        event_type='TOKEN_BOOKED',
        description=f"Token {token_code} booked for patient {user_id}"
    )
    db.session.add(event)
    db.session.commit()

    recalculate_queue_positions_and_eta(queue.id)

    send_notification(
        user_id=user_id,
        title="Token Booked Successfully",
        message=f"Your token is {token_code}. Estimated wait: {est_wait} mins.",
        notification_type="TOKEN_BOOKED"
    )

    return jsonify({
        'success': True,
        'message': 'Token booked successfully.',
        'token': queue_item.to_dict(),
        'queue': queue.to_dict()
    }), 201

@queue_bp.route('/tokens/<int:token_id>', methods=['GET'])
@jwt_required()
def get_token_details(token_id):
    item = QueueItem.query.get(token_id)
    if not item:
        return jsonify({'success': False, 'message': 'Token not found.'}), 404

    token_info = item.to_dict()
    queue = item.queue
    token_info['current_serving_token'] = queue.current_token

    # Count patients before this token
    patients_before = max(0, item.position - 1)
    token_info['patients_before_you'] = patients_before

    return jsonify({'success': True, 'token': token_info}), 200

@queue_bp.route('/tokens/<int:token_id>/cancel', methods=['POST'])
@jwt_required()
def cancel_token(token_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    item = QueueItem.query.get(token_id)
    if not item:
        return jsonify({'success': False, 'message': 'Token not found.'}), 404

    item.status = 'CANCELLED'
    db.session.commit()

    recalculate_queue_positions_and_eta(item.queue_id)

    return jsonify({'success': True, 'message': 'Token cancelled successfully.'}), 200

@queue_bp.route('/queue/<int:queue_id>/status', methods=['GET'])
def get_queue_status(queue_id):
    queue = Queue.query.get(queue_id)
    if not queue:
        return jsonify({'success': False, 'message': 'Queue not found.'}), 404

    items = QueueItem.query.filter(
        QueueItem.queue_id == queue_id,
        QueueItem.status.in_(['WAITING', 'EMERGENCY', 'IN_PROGRESS'])
    ).order_by(QueueItem.position).all()

    return jsonify({
        'success': True,
        'queue': queue.to_dict(),
        'waiting_items': [i.to_dict() for i in items]
    }), 200

@queue_bp.route('/queue/<int:queue_id>/next', methods=['POST'])
@jwt_required()
def call_next_token(queue_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if user.role not in ['DOCTOR', 'HOSPITAL_ADMIN']:
        return jsonify({'success': False, 'message': 'Unauthorized queue action.'}), 403

    queue = Queue.query.get(queue_id)
    if not queue:
        return jsonify({'success': False, 'message': 'Queue not found.'}), 404

    # If there is a current token in progress, complete it
    in_progress = QueueItem.query.filter_by(queue_id=queue_id, status='IN_PROGRESS').first()
    if in_progress:
        in_progress.status = 'COMPLETED'
        in_progress.completed_at = datetime.utcnow()

    # Get next token (EMERGENCY first, then highest position WAITING)
    next_item = QueueItem.query.filter(
        QueueItem.queue_id == queue_id,
        QueueItem.status.in_(['EMERGENCY', 'WAITING'])
    ).order_by(
        QueueItem.is_emergency.desc(),
        QueueItem.position.asc()
    ).first()

    if not next_item:
        queue.current_token = 'None'
        db.session.commit()
        broadcast_queue_update(queue_id)
        return jsonify({'success': True, 'message': 'No more patients waiting in queue.', 'current_token': 'None'}), 200

    next_item.status = 'IN_PROGRESS'
    next_item.started_at = datetime.utcnow()
    queue.current_token = next_item.token_code
    db.session.commit()

    recalculate_queue_positions_and_eta(queue_id)

    # Send push notification to called patient
    send_notification(
        user_id=next_item.patient.user_id,
        title="Token Called!",
        message=f"Token {next_item.token_code} is currently being called. Please enter consultation room.",
        notification_type="TOKEN_CALLED"
    )

    return jsonify({
        'success': True,
        'message': f"Called token {next_item.token_code}",
        'current_patient': next_item.to_dict(),
        'queue': queue.to_dict()
    }), 200

@queue_bp.route('/queue/<int:queue_id>/emergency', methods=['POST'])
@jwt_required()
def trigger_emergency_interruption(queue_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if user.role not in ['DOCTOR', 'HOSPITAL_ADMIN']:
        return jsonify({'success': False, 'message': 'Unauthorized emergency action.'}), 403

    data = request.get_json() or {}
    patient_id = data.get('patient_id')
    reason = data.get('reason', 'Critical emergency case requiring immediate consultation.')

    if not patient_id:
        return jsonify({'success': False, 'message': 'patient_id is required.'}), 400

    item, err = add_emergency_case_to_queue(queue_id, patient_id, reason, user_id)
    if err:
        return jsonify({'success': False, 'message': err}), 400

    return jsonify({
        'success': True,
        'message': f'Emergency consultation created. Token {item.token_code} assigned priority #1.',
        'token': item.to_dict()
    }), 200
