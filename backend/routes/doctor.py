from datetime import datetime, date
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.extensions import db
from backend.models.user import User
from backend.models.doctor import Doctor
from backend.models.patient import Patient
from backend.models.appointment import Appointment
from backend.models.queue import Queue, QueueItem, QueueEvent, EmergencyCase
from backend.models.prescription import Prescription, PrescriptionItem
from backend.models.medical_record import MedicalRecord
from backend.utils.auth import role_required
from backend.services.queue_service import recalculate_queue_positions_and_eta, add_emergency_case_to_queue, broadcast_queue_update
from backend.services.notification_service import send_notification

doctor_bp = Blueprint('doctor', __name__, url_prefix='/api/doctors')

def check_doctor_patient_relationship(doctor_id, patient_id):
    """Verify if doctor has an active or historical appointment/queue record with patient."""
    has_appt = Appointment.query.filter_by(doctor_id=doctor_id, patient_id=patient_id).first()
    if has_appt:
        return True
    has_queue = QueueItem.query.filter_by(doctor_id=doctor_id, patient_id=patient_id).first()
    if has_queue:
        return True
    return False

# 1. DOCTOR PROFILE
@doctor_bp.route('/profile', methods=['GET'])
@role_required('DOCTOR')
def get_doctor_profile():
    user_id = int(get_jwt_identity())
    doctor = Doctor.query.filter_by(user_id=user_id).first()
    if not doctor:
        return jsonify({'success': False, 'message': 'Doctor profile not found.'}), 404

    return jsonify({'success': True, 'doctor': doctor.to_dict()}), 200

@doctor_bp.route('/profile', methods=['PUT'])
@role_required('DOCTOR')
def update_doctor_profile():
    user_id = int(get_jwt_identity())
    doctor = Doctor.query.filter_by(user_id=user_id).first()
    if not doctor:
        return jsonify({'success': False, 'message': 'Doctor profile not found.'}), 404

    data = request.get_json() or {}
    if 'qualification' in data:
        doctor.qualification = data['qualification']
    if 'specialization' in data:
        doctor.specialization = data['specialization']
    if 'avg_consultation_time_mins' in data:
        doctor.avg_consultation_time_mins = max(1, int(data['avg_consultation_time_mins']))
    if 'experience_years' in data:
        doctor.experience_years = int(data['experience_years'])
    if 'is_available' in data:
        doctor.is_available = bool(data['is_available'])

    if 'name' in data and doctor.user:
        doctor.user.name = data['name']
    if 'phone' in data and doctor.user:
        doctor.user.phone = data['phone']

    db.session.commit()
    return jsonify({'success': True, 'message': 'Doctor profile updated.', 'doctor': doctor.to_dict()}), 200

# 2. DOCTOR DASHBOARD
@doctor_bp.route('/dashboard', methods=['GET'])
@role_required('DOCTOR')
def get_doctor_dashboard():
    user_id = int(get_jwt_identity())
    doctor = Doctor.query.filter_by(user_id=user_id).first()
    if not doctor:
        return jsonify({'success': False, 'message': 'Doctor profile not found.'}), 404

    today = date.today()
    queue = Queue.query.filter_by(doctor_id=doctor.id, date=today).first()
    
    # Today's appointments count
    today_appts_count = Appointment.query.filter_by(doctor_id=doctor.id).filter(
        db.func.date(Appointment.appointment_date) == today
    ).count()

    waiting_items = []
    current_patient = None
    next_patient = None
    completed_today_count = 0

    if queue:
        all_waiting = QueueItem.query.filter(
            QueueItem.queue_id == queue.id,
            QueueItem.status.in_(['WAITING', 'EMERGENCY'])
        ).order_by(QueueItem.is_emergency.desc(), QueueItem.position.asc()).all()
        
        waiting_items = [i.to_dict() for i in all_waiting]
        if all_waiting:
            next_patient = all_waiting[0].to_dict()

        in_prog = QueueItem.query.filter_by(queue_id=queue.id, status='IN_PROGRESS').first()
        if in_prog:
            current_patient = in_prog.to_dict()

        completed_today_count = QueueItem.query.filter_by(queue_id=queue.id, status='COMPLETED').count()

    return jsonify({
        'success': True,
        'doctor': doctor.to_dict(),
        'today_appointments_count': today_appts_count,
        'waiting_patients_count': len(waiting_items),
        'current_token': queue.current_token if queue else 'None',
        'current_patient': current_patient,
        'next_patient': next_patient,
        'completed_consultations_count': completed_today_count,
        'current_queue': queue.to_dict() if queue else None,
        'waiting_queue': waiting_items,
        'avg_waiting_time_mins': doctor.avg_consultation_time_mins
    }), 200

# 3. TODAY'S APPOINTMENTS
@doctor_bp.route('/appointments', methods=['GET'])
@role_required('DOCTOR')
def get_doctor_appointments():
    user_id = int(get_jwt_identity())
    doctor = Doctor.query.filter_by(user_id=user_id).first()
    if not doctor:
        return jsonify({'success': False, 'message': 'Doctor not found.'}), 404

    status_filter = request.args.get('status')
    date_filter_str = request.args.get('date')

    query = Appointment.query.filter_by(doctor_id=doctor.id)

    if status_filter:
        query = query.filter_by(status=status_filter)
    if date_filter_str:
        try:
            target_date = datetime.strptime(date_filter_str, '%Y-%m-%d').date()
            query = query.filter(db.func.date(Appointment.appointment_date) == target_date)
        except ValueError:
            pass

    appts = query.order_by(Appointment.appointment_date.asc()).all()
    return jsonify({'success': True, 'count': len(appts), 'appointments': [a.to_dict() for a in appts]}), 200

# 4. DOCTOR QUEUE
@doctor_bp.route('/queue', methods=['GET'])
@role_required('DOCTOR')
def get_doctor_queue():
    user_id = int(get_jwt_identity())
    doctor = Doctor.query.filter_by(user_id=user_id).first()
    if not doctor:
        return jsonify({'success': False, 'message': 'Doctor not found.'}), 404

    today = date.today()
    queue = Queue.query.filter_by(doctor_id=doctor.id, date=today).first()
    if not queue:
        return jsonify({'success': True, 'queue': None, 'items': []}), 200

    items = QueueItem.query.filter(
        QueueItem.queue_id == queue.id,
        QueueItem.status.in_(['WAITING', 'EMERGENCY', 'IN_PROGRESS'])
    ).order_by(QueueItem.position).all()

    return jsonify({
        'success': True,
        'queue': queue.to_dict(),
        'items': [i.to_dict() for i in items]
    }), 200

# 5. CALL NEXT PATIENT
@doctor_bp.route('/queue/next', methods=['POST'])
@role_required('DOCTOR')
def call_next_patient():
    user_id = int(get_jwt_identity())
    doctor = Doctor.query.filter_by(user_id=user_id).first()
    if not doctor:
        return jsonify({'success': False, 'message': 'Doctor not found.'}), 404

    today = date.today()
    queue = Queue.query.filter_by(doctor_id=doctor.id, date=today).first()
    if not queue:
        return jsonify({'success': False, 'message': 'No active queue found for today.'}), 404

    # 1. Complete existing IN_PROGRESS item if present
    in_progress = QueueItem.query.filter_by(queue_id=queue.id, status='IN_PROGRESS').first()
    if in_progress:
        in_progress.status = 'COMPLETED'
        in_progress.completed_at = datetime.utcnow()

    # 2. Get next candidate (EMERGENCY first, then lowest position WAITING)
    next_item = QueueItem.query.filter(
        QueueItem.queue_id == queue.id,
        QueueItem.status.in_(['EMERGENCY', 'WAITING'])
    ).order_by(QueueItem.is_emergency.desc(), QueueItem.position.asc()).first()

    if not next_item:
        queue.current_token = 'None'
        db.session.commit()
        broadcast_queue_update(queue.id)
        return jsonify({'success': True, 'message': 'No more waiting patients in queue.', 'current_token': 'None'}), 200

    next_item.status = 'IN_PROGRESS'
    next_item.started_at = datetime.utcnow()
    queue.current_token = next_item.token_code

    # Log event
    event = QueueEvent(
        queue_id=queue.id,
        token_code=next_item.token_code,
        event_type='TOKEN_CALLED',
        description=f"Token {next_item.token_code} called by Dr. {doctor.user.name}"
    )
    db.session.add(event)
    db.session.commit()

    recalculate_queue_positions_and_eta(queue.id)

    send_notification(
        user_id=next_item.patient.user_id,
        title="Token Called!",
        message=f"Token {next_item.token_code} is currently being called. Please enter consultation room.",
        notification_type="TOKEN_CALLED"
    )

    return jsonify({
        'success': True,
        'message': f"Called token {next_item.token_code}",
        'called_patient': next_item.to_dict(),
        'queue': queue.to_dict()
    }), 200

# 6. START CONSULTATION
@doctor_bp.route('/consultations/start', methods=['POST'])
@role_required('DOCTOR')
def start_consultation():
    user_id = int(get_jwt_identity())
    doctor = Doctor.query.filter_by(user_id=user_id).first()
    if not doctor:
        return jsonify({'success': False, 'message': 'Doctor not found.'}), 404

    data = request.get_json() or {}
    queue_item_id = data.get('queue_item_id')

    if not queue_item_id:
        return jsonify({'success': False, 'message': 'queue_item_id is required.'}), 400

    item = QueueItem.query.get(queue_item_id)
    if not item:
        return jsonify({'success': False, 'message': 'Queue item not found.'}), 404

    # Ownership Guard
    if item.doctor_id != doctor.id:
        return jsonify({'success': False, 'message': 'Access denied. Patient is not assigned to your queue.'}), 403

    item.status = 'IN_PROGRESS'
    item.started_at = datetime.utcnow()
    item.queue.current_token = item.token_code
    db.session.commit()

    recalculate_queue_positions_and_eta(item.queue_id)

    return jsonify({
        'success': True,
        'message': f'Consultation started for token {item.token_code}.',
        'consultation': item.to_dict()
    }), 200

# 7. COMPLETE CONSULTATION
@doctor_bp.route('/consultations/<int:queue_item_id>/complete', methods=['POST'])
@role_required('DOCTOR')
def complete_consultation(queue_item_id):
    user_id = int(get_jwt_identity())
    doctor = Doctor.query.filter_by(user_id=user_id).first()
    if not doctor:
        return jsonify({'success': False, 'message': 'Doctor not found.'}), 404

    item = QueueItem.query.get(queue_item_id)
    if not item:
        return jsonify({'success': False, 'message': 'Queue item not found.'}), 404

    if item.doctor_id != doctor.id:
        return jsonify({'success': False, 'message': 'Access denied. You are not assigned to this patient.'}), 403

    data = request.get_json() or {}
    diagnosis = data.get('diagnosis', 'Routine Consultation Completed')
    clinical_notes = data.get('clinical_notes', '')

    item.status = 'COMPLETED'
    item.completed_at = datetime.utcnow()

    # Save doctor's clinical assessment as MedicalRecord (No AI auto-diagnosis)
    record = MedicalRecord(
        patient_id=item.patient_id,
        doctor_id=doctor.id,
        title=f"Clinical Consultation: {diagnosis}",
        record_type="CONSULTATION_SUMMARY",
        notes=clinical_notes or f"Diagnosis: {diagnosis}"
    )
    db.session.add(record)
    db.session.commit()

    recalculate_queue_positions_and_eta(item.queue_id)

    return jsonify({
        'success': True,
        'message': 'Consultation completed successfully.',
        'queue_item': item.to_dict(),
        'medical_record': record.to_dict()
    }), 200

# 8. PATIENT INFORMATION FOR DOCTOR
@doctor_bp.route('/patients/<int:patient_id>', methods=['GET'])
@role_required('DOCTOR')
def get_patient_details_for_doctor(patient_id):
    user_id = int(get_jwt_identity())
    doctor = Doctor.query.filter_by(user_id=user_id).first()
    if not doctor:
        return jsonify({'success': False, 'message': 'Doctor not found.'}), 404

    # Relationship guard
    if not check_doctor_patient_relationship(doctor.id, patient_id):
        return jsonify({'success': False, 'message': 'Forbidden: You do not have an active or past consultation record with this patient.'}), 403

    patient = Patient.query.get(patient_id)
    if not patient:
        return jsonify({'success': False, 'message': 'Patient not found.'}), 404

    return jsonify({'success': True, 'patient': patient.to_dict()}), 200

# 9. PATIENT MEDICAL HISTORY FOR DOCTOR
@doctor_bp.route('/patients/<int:patient_id>/medical-records', methods=['GET'])
@role_required('DOCTOR')
def get_patient_medical_records_for_doctor(patient_id):
    user_id = int(get_jwt_identity())
    doctor = Doctor.query.filter_by(user_id=user_id).first()
    if not doctor:
        return jsonify({'success': False, 'message': 'Doctor not found.'}), 404

    # Relationship guard
    if not check_doctor_patient_relationship(doctor.id, patient_id):
        return jsonify({'success': False, 'message': 'Forbidden: You do not have an active or past consultation record with this patient.'}), 403

    records = MedicalRecord.query.filter_by(patient_id=patient_id).order_by(MedicalRecord.record_date.desc()).all()
    prescriptions = Prescription.query.filter_by(patient_id=patient_id).order_by(Prescription.created_at.desc()).all()

    return jsonify({
        'success': True,
        'medical_records': [r.to_dict() for r in records],
        'prescriptions': [p.to_dict() for p in prescriptions]
    }), 200

# 10. PRESCRIPTION CREATION BY DOCTOR
@doctor_bp.route('/prescriptions', methods=['POST'])
@role_required('DOCTOR')
def create_doctor_prescription():
    user_id = int(get_jwt_identity())
    doctor = Doctor.query.filter_by(user_id=user_id).first()
    if not doctor:
        return jsonify({'success': False, 'message': 'Doctor not found.'}), 404

    data = request.get_json() or {}
    patient_id = data.get('patient_id')
    diagnosis = data.get('diagnosis')
    clinical_notes = data.get('clinical_notes', '')
    medicines = data.get('medicines', [])

    if not patient_id or not diagnosis:
        return jsonify({'success': False, 'message': 'patient_id and diagnosis are required.'}), 400

    # Relationship guard
    if not check_doctor_patient_relationship(doctor.id, patient_id):
        return jsonify({'success': False, 'message': 'Forbidden: Cannot create prescription for an unrelated patient.'}), 403

    patient = Patient.query.get(patient_id)
    if not patient:
        return jsonify({'success': False, 'message': 'Patient not found.'}), 404

    prescription = Prescription(
        patient_id=patient_id,
        doctor_id=doctor.id,
        hospital_id=doctor.hospital_id,
        diagnosis=diagnosis,
        clinical_notes=clinical_notes,
        status='PRESCRIPTION_RECEIVED'
    )
    db.session.add(prescription)
    db.session.commit()

    for med in medicines:
        item = PrescriptionItem(
            prescription_id=prescription.id,
            medicine_name=med.get('name', 'General Medicine'),
            dosage=med.get('dosage', '1 Tab'),
            frequency=med.get('frequency', 'Twice daily'),
            duration=med.get('duration', '5 days'),
            instructions=med.get('instructions', 'After food')
        )
        db.session.add(item)

    db.session.commit()

    send_notification(
        user_id=patient.user_id,
        title="New Prescription Issued",
        message=f"Dr. {doctor.user.name} issued a digital prescription for {diagnosis}.",
        notification_type="PRESCRIPTION"
    )

    return jsonify({
        'success': True,
        'message': 'Digital prescription issued successfully.',
        'prescription': prescription.to_dict()
    }), 201

# 11. DOCTOR AVAILABILITY MANAGEMENT
@doctor_bp.route('/availability', methods=['GET'])
@role_required('DOCTOR')
def get_availability():
    user_id = int(get_jwt_identity())
    doctor = Doctor.query.filter_by(user_id=user_id).first()
    if not doctor:
        return jsonify({'success': False, 'message': 'Doctor not found.'}), 404

    return jsonify({
        'success': True,
        'is_available': doctor.is_available,
        'avg_consultation_time_mins': doctor.avg_consultation_time_mins
    }), 200

@doctor_bp.route('/availability', methods=['PUT'])
@role_required('DOCTOR')
def update_availability():
    user_id = int(get_jwt_identity())
    doctor = Doctor.query.filter_by(user_id=user_id).first()
    if not doctor:
        return jsonify({'success': False, 'message': 'Doctor not found.'}), 404

    data = request.get_json() or {}
    if 'is_available' in data:
        doctor.is_available = bool(data['is_available'])
    if 'avg_consultation_time_mins' in data:
        doctor.avg_consultation_time_mins = max(1, int(data['avg_consultation_time_mins']))

    db.session.commit()
    return jsonify({
        'success': True,
        'message': 'Availability status updated successfully.',
        'is_available': doctor.is_available,
        'avg_consultation_time_mins': doctor.avg_consultation_time_mins
    }), 200

# 12. EMERGENCY CASE INJECTION
@doctor_bp.route('/queue/emergency', methods=['POST'])
@role_required('DOCTOR')
def trigger_doctor_emergency():
    user_id = int(get_jwt_identity())
    doctor = Doctor.query.filter_by(user_id=user_id).first()
    if not doctor:
        return jsonify({'success': False, 'message': 'Doctor not found.'}), 404

    today = date.today()
    queue = Queue.query.filter_by(doctor_id=doctor.id, date=today).first()
    if not queue:
        return jsonify({'success': False, 'message': 'No active queue found for today.'}), 400

    data = request.get_json() or {}
    patient_id = data.get('patient_id')
    reason = data.get('reason', 'Critical emergency case requiring immediate consultation.')

    if not patient_id:
        return jsonify({'success': False, 'message': 'patient_id is required.'}), 400

    item, err = add_emergency_case_to_queue(queue.id, patient_id, reason, user_id)
    if err:
        return jsonify({'success': False, 'message': err}), 400

    return jsonify({
        'success': True,
        'message': f'Emergency consultation created. Token {item.token_code} assigned priority #1.',
        'token': item.to_dict()
    }), 200

# 13. QUEUE ITEM COMPLETION
@doctor_bp.route('/queue/<int:queue_item_id>/complete', methods=['POST'])
@role_required('DOCTOR')
def complete_queue_item(queue_item_id):
    user_id = int(get_jwt_identity())
    doctor = Doctor.query.filter_by(user_id=user_id).first()
    if not doctor:
        return jsonify({'success': False, 'message': 'Doctor not found.'}), 404

    item = QueueItem.query.get(queue_item_id)
    if not item:
        return jsonify({'success': False, 'message': 'Queue item not found.'}), 404

    if item.doctor_id != doctor.id:
        return jsonify({'success': False, 'message': 'Access denied. Patient is not assigned to your queue.'}), 403

    item.status = 'COMPLETED'
    item.completed_at = datetime.utcnow()

    event = QueueEvent(
        queue_id=item.queue_id,
        token_code=item.token_code,
        event_type='TOKEN_COMPLETED',
        description=f"Token {item.token_code} completed by Dr. {doctor.user.name}"
    )
    db.session.add(event)
    db.session.commit()

    recalculate_queue_positions_and_eta(item.queue_id)

    return jsonify({
        'success': True,
        'message': f'Token {item.token_code} marked completed.',
        'queue_item': item.to_dict()
    }), 200
