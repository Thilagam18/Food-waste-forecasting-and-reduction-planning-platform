import math
from datetime import datetime, date
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.extensions import db
from backend.models.user import User
from backend.models.patient import Patient
from backend.models.doctor import Doctor
from backend.models.hospital import Hospital, Department
from backend.models.appointment import Appointment
from backend.models.queue import Queue, QueueItem, QueueEvent
from backend.models.prescription import Prescription
from backend.models.medical_record import MedicalRecord
from backend.models.notification import Notification
from backend.utils.auth import role_required
from backend.services.queue_service import recalculate_queue_positions_and_eta
from backend.services.notification_service import send_notification

patient_bp = Blueprint('patient', __name__, url_prefix='/api/patients')

def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculate geographical distance between two points in km."""
    R = 6371.0
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = math.sin(dLat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dLon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

# 1. PROFILE ENDPOINTS
@patient_bp.route('/profile', methods=['GET'])
@role_required('PATIENT')
def get_patient_profile():
    user_id = int(get_jwt_identity())
    patient = Patient.query.filter_by(user_id=user_id).first()
    if not patient:
        return jsonify({'success': False, 'message': 'Patient profile not found.'}), 404

    return jsonify({'success': True, 'patient': patient.to_dict()}), 200

@patient_bp.route('/profile', methods=['PUT'])
@role_required('PATIENT')
def update_patient_profile():
    user_id = int(get_jwt_identity())
    patient = Patient.query.filter_by(user_id=user_id).first()
    if not patient:
        return jsonify({'success': False, 'message': 'Patient profile not found.'}), 404

    data = request.get_json() or {}
    patient.age = data.get('age', patient.age)
    patient.gender = data.get('gender', patient.gender)
    patient.blood_group = data.get('blood_group', patient.blood_group)
    patient.emergency_contact = data.get('emergency_contact', patient.emergency_contact)
    patient.address = data.get('address', patient.address)

    if 'name' in data and patient.user:
        patient.user.name = data['name']
    if 'phone' in data and patient.user:
        patient.user.phone = data['phone']

    db.session.commit()
    return jsonify({'success': True, 'message': 'Profile updated successfully.', 'patient': patient.to_dict()}), 200

# 2. PATIENT DASHBOARD ENDPOINT
@patient_bp.route('/dashboard', methods=['GET'])
@role_required('PATIENT')
def get_patient_dashboard():
    user_id = int(get_jwt_identity())
    patient = Patient.query.filter_by(user_id=user_id).first()
    if not patient:
        return jsonify({'success': False, 'message': 'Patient profile not found.'}), 404

    # Fetch active token
    active_item = QueueItem.query.filter(
        QueueItem.patient_id == patient.id,
        QueueItem.status.in_(['WAITING', 'IN_PROGRESS', 'EMERGENCY'])
    ).first()

    token_data = None
    if active_item:
        token_data = active_item.to_dict()
        token_data['current_serving_token'] = active_item.queue.current_token if active_item.queue else 'None'
        token_data['patients_before_you'] = max(0, active_item.position - 1)

    # Upcoming appointment
    upcoming_appt = Appointment.query.filter_by(patient_id=patient.id, status='SCHEDULED').order_by(Appointment.appointment_date.asc()).first()

    # Recent notifications
    notifs = Notification.query.filter_by(user_id=user_id).order_by(Notification.created_at.desc()).limit(5).all()

    # Recent prescriptions
    prescriptions = Prescription.query.filter_by(patient_id=patient.id).order_by(Prescription.created_at.desc()).limit(5).all()

    # Recent medical records
    records = MedicalRecord.query.filter_by(patient_id=patient.id).order_by(MedicalRecord.record_date.desc()).limit(5).all()

    return jsonify({
        'success': True,
        'patient_name': patient.user.name if patient.user else 'Patient',
        'active_token': token_data,
        'upcoming_appointment': upcoming_appt.to_dict() if upcoming_appt else None,
        'recent_notifications': [n.to_dict() for n in notifs],
        'recent_prescriptions': [p.to_dict() for p in prescriptions],
        'recent_medical_records': [r.to_dict() for r in records]
    }), 200

# 3. HEALTH ISSUE SUBMISSION
@patient_bp.route('/health-issues', methods=['POST'])
@role_required('PATIENT')
def submit_health_issue():
    user_id = int(get_jwt_identity())
    patient = Patient.query.filter_by(user_id=user_id).first()
    if not patient:
        return jsonify({'success': False, 'message': 'Patient not found.'}), 404

    data = request.get_json() or {}
    description = data.get('description', '').strip()
    if not description:
        return jsonify({'success': False, 'message': 'Health concern description is required.'}), 400

    # Save as medical record entry for future AI integration
    record = MedicalRecord(
        patient_id=patient.id,
        doctor_id=None,
        title="Patient Health Concern Submission",
        record_type="SYMPTOM_SUBMISSION",
        notes=description
    )
    db.session.add(record)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Health issue submitted successfully.',
        'health_issue': {
            'id': record.id,
            'description': description,
            'submitted_at': record.record_date.isoformat()
        }
    }), 201

# 4. HOSPITAL SEARCH & DISCOVERY
@patient_bp.route('/hospitals', methods=['GET'])
@role_required('PATIENT')
def search_hospitals():
    search_q = request.args.get('search', '').lower()
    department_name = request.args.get('department')
    user_lat = request.args.get('latitude', type=float)
    user_lng = request.args.get('longitude', type=float)
    radius_km = request.args.get('radius', default=50.0, type=float)

    query = Hospital.query
    if search_q:
        query = query.filter(Hospital.name.ilike(f'%{search_q}%') | Hospital.address.ilike(f'%{search_q}%'))

    hospitals = query.all()
    results = []

    for h in hospitals:
        h_dict = h.to_dict()

        # Distance calculation
        dist = None
        if user_lat is not None and user_lng is not None:
            dist = haversine_distance(user_lat, user_lng, h.latitude, h.longitude)
            if dist > radius_km:
                continue
            h_dict['distance_km'] = round(dist, 1)

        # Department filtering
        if department_name:
            dept_names = [d['name'].lower() for d in h_dict.get('departments', [])]
            if department_name.lower() not in dept_names:
                continue

        results.append(h_dict)

    if user_lat is not None and user_lng is not None:
        results.sort(key=lambda x: x.get('distance_km', 0))

    return jsonify({'success': True, 'count': len(results), 'hospitals': results}), 200

# 5. HOSPITAL DETAILS
@patient_bp.route('/hospitals/<int:hospital_id>', methods=['GET'])
@role_required('PATIENT')
def get_hospital_details(hospital_id):
    hospital = Hospital.query.get(hospital_id)
    if not hospital:
        return jsonify({'success': False, 'message': 'Hospital not found.'}), 404

    h_dict = hospital.to_dict()
    doctors = Doctor.query.filter_by(hospital_id=hospital_id).all()
    h_dict['doctors'] = [d.to_dict() for d in doctors]

    active_queues = Queue.query.filter_by(hospital_id=hospital_id, status='ACTIVE').all()
    h_dict['active_queues'] = [q.to_dict() for q in active_queues]

    return jsonify({'success': True, 'hospital': h_dict}), 200

# 6. DOCTOR SEARCH
@patient_bp.route('/doctors', methods=['GET'])
@role_required('PATIENT')
def search_doctors():
    hospital_id = request.args.get('hospital', type=int)
    department_id = request.args.get('department', type=int)
    specialization = request.args.get('specialization')
    available_only = request.args.get('availability', type=bool)

    query = Doctor.query
    if hospital_id:
        query = query.filter_by(hospital_id=hospital_id)
    if department_id:
        query = query.filter_by(department_id=department_id)
    if specialization:
        query = query.filter(Doctor.specialization.ilike(f'%{specialization}%'))
    if available_only:
        query = query.filter_by(is_available=True)

    doctors = query.all()
    return jsonify({'success': True, 'count': len(doctors), 'doctors': [d.to_dict() for d in doctors]}), 200

# 7. APPOINTMENT MANAGEMENT
@patient_bp.route('/appointments', methods=['POST'])
@role_required('PATIENT')
def book_appointment():
    user_id = int(get_jwt_identity())
    patient = Patient.query.filter_by(user_id=user_id).first()
    if not patient:
        return jsonify({'success': False, 'message': 'Patient not found.'}), 404

    data = request.get_json() or {}
    hospital_id = data.get('hospital_id')
    doctor_id = data.get('doctor_id')
    department_id = data.get('department_id')
    appointment_date_str = data.get('appointment_date')
    notes = data.get('notes', '')

    if not hospital_id or not doctor_id or not department_id or not appointment_date_str:
        return jsonify({'success': False, 'message': 'hospital_id, doctor_id, department_id, and appointment_date are required.'}), 400

    doctor = Doctor.query.get(doctor_id)
    if not doctor or not doctor.is_available:
        return jsonify({'success': False, 'message': 'Selected doctor is currently unavailable.'}), 400

    if doctor.hospital_id != hospital_id or doctor.department_id != department_id:
        return jsonify({'success': False, 'message': 'Doctor does not belong to specified hospital/department.'}), 400

    try:
        appt_date = datetime.fromisoformat(appointment_date_str.replace('Z', '+00:00'))
    except Exception:
        return jsonify({'success': False, 'message': 'Invalid appointment_date format. Use ISO format (YYYY-MM-DDTHH:MM:SS).'}), 400

    appointment = Appointment(
        patient_id=patient.id,
        doctor_id=doctor_id,
        hospital_id=hospital_id,
        department_id=department_id,
        appointment_date=appt_date,
        status='SCHEDULED',
        notes=notes
    )
    db.session.add(appointment)
    db.session.commit()

    return jsonify({'success': True, 'message': 'Appointment booked successfully.', 'appointment': appointment.to_dict()}), 201

@patient_bp.route('/appointments', methods=['GET'])
@role_required('PATIENT')
def get_patient_appointments():
    user_id = int(get_jwt_identity())
    patient = Patient.query.filter_by(user_id=user_id).first()
    if not patient:
        return jsonify({'success': False, 'message': 'Patient not found.'}), 404

    appts = Appointment.query.filter_by(patient_id=patient.id).order_by(Appointment.appointment_date.desc()).all()
    return jsonify({'success': True, 'appointments': [a.to_dict() for a in appts]}), 200

@patient_bp.route('/appointments/<int:appointment_id>', methods=['GET'])
@role_required('PATIENT')
def get_appointment_by_id(appointment_id):
    user_id = int(get_jwt_identity())
    patient = Patient.query.filter_by(user_id=user_id).first()

    appt = Appointment.query.get(appointment_id)
    if not appt:
        return jsonify({'success': False, 'message': 'Appointment not found.'}), 404

    # IDOR Protection
    if appt.patient_id != patient.id:
        return jsonify({'success': False, 'message': 'Access denied to this appointment.'}), 403

    return jsonify({'success': True, 'appointment': appt.to_dict()}), 200

@patient_bp.route('/appointments/<int:appointment_id>', methods=['DELETE'])
@role_required('PATIENT')
def cancel_appointment(appointment_id):
    user_id = int(get_jwt_identity())
    patient = Patient.query.filter_by(user_id=user_id).first()

    appt = Appointment.query.get(appointment_id)
    if not appt:
        return jsonify({'success': False, 'message': 'Appointment not found.'}), 404

    # IDOR Protection
    if appt.patient_id != patient.id:
        return jsonify({'success': False, 'message': 'Access denied.'}), 403

    appt.status = 'CANCELLED'
    db.session.commit()
    return jsonify({'success': True, 'message': 'Appointment cancelled successfully.', 'appointment': appt.to_dict()}), 200

# 8. TOKEN BOOKING
@patient_bp.route('/tokens', methods=['POST'])
@role_required('PATIENT')
def book_token():
    user_id = int(get_jwt_identity())
    patient = Patient.query.filter_by(user_id=user_id).first()
    if not patient:
        return jsonify({'success': False, 'message': 'Patient not found.'}), 404

    data = request.get_json() or {}
    hospital_id = data.get('hospital_id')
    doctor_id = data.get('doctor_id')
    department_id = data.get('department_id')

    if not hospital_id or not doctor_id or not department_id:
        return jsonify({'success': False, 'message': 'hospital_id, doctor_id, and department_id are required.'}), 400

    doctor = Doctor.query.get(doctor_id)
    if not doctor:
        return jsonify({'success': False, 'message': 'Doctor does not exist.'}), 404

    if doctor.hospital_id != hospital_id or doctor.department_id != department_id:
        return jsonify({'success': False, 'message': 'Doctor does not belong to specified hospital/department.'}), 400

    if not doctor.is_available:
        return jsonify({'success': False, 'message': 'Doctor is currently unavailable for consultation.'}), 400

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

    # Prevent duplicate active token in same queue
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

    queue.total_tokens_today += 1
    token_num = queue.total_tokens_today
    prefix = doctor.department.name[0].upper() if doctor.department else 'A'
    token_code = f"{prefix}-{token_num:02d}"

    waiting_count = QueueItem.query.filter(
        QueueItem.queue_id == queue.id,
        QueueItem.status.in_(['WAITING', 'EMERGENCY'])
    ).count()

    position = waiting_count + 1
    avg_mins = doctor.avg_consultation_time_mins or 12
    est_wait = (position - 1) * avg_mins

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

    event = QueueEvent(
        queue_id=queue.id,
        token_code=token_code,
        event_type='TOKEN_BOOKED',
        description=f"Token {token_code} booked for patient #{patient.id}"
    )
    db.session.add(event)
    db.session.commit()

    recalculate_queue_positions_and_eta(queue.id)

    res_token = queue_item.to_dict()
    res_token['queue_position'] = queue_item.position
    res_token['patients_before'] = max(0, queue_item.position - 1)

    return jsonify({
        'success': True,
        'message': 'Token booked successfully.',
        'token': res_token
    }), 201

# 9. ACTIVE TOKEN
@patient_bp.route('/tokens/active', methods=['GET'])
@role_required('PATIENT')
def get_active_token():
    user_id = int(get_jwt_identity())
    patient = Patient.query.filter_by(user_id=user_id).first()
    if not patient:
        return jsonify({'success': False, 'message': 'Patient not found.'}), 404

    active_item = QueueItem.query.filter(
        QueueItem.patient_id == patient.id,
        QueueItem.status.in_(['WAITING', 'IN_PROGRESS', 'EMERGENCY'])
    ).first()

    if not active_item:
        return jsonify({'success': True, 'token': None}), 200

    token_info = active_item.to_dict()
    queue = active_item.queue
    token_info['hospital_name'] = queue.hospital.name if queue and queue.hospital else ''
    token_info['doctor_name'] = queue.doctor.user.name if queue and queue.doctor and queue.doctor.user else ''
    token_info['department_name'] = queue.department.name if queue and queue.department else ''
    token_info['current_token'] = queue.current_token if queue else 'None'
    token_info['patients_before'] = max(0, active_item.position - 1)

    return jsonify({'success': True, 'token': token_info}), 200

# 10. CANCEL TOKEN
@patient_bp.route('/tokens/<int:token_id>', methods=['DELETE'])
@role_required('PATIENT')
def cancel_patient_token(token_id):
    user_id = int(get_jwt_identity())
    patient = Patient.query.filter_by(user_id=user_id).first()

    item = QueueItem.query.get(token_id)
    if not item:
        return jsonify({'success': False, 'message': 'Token not found.'}), 404

    # IDOR Protection: Patient can only cancel their own token
    if item.patient_id != patient.id:
        return jsonify({'success': False, 'message': 'Access denied. You do not own this token.'}), 403

    item.status = 'CANCELLED'

    event = QueueEvent(
        queue_id=item.queue_id,
        token_code=item.token_code,
        event_type='TOKEN_CANCELLED',
        description=f"Token {item.token_code} cancelled by patient #{patient.id}"
    )
    db.session.add(event)
    db.session.commit()

    recalculate_queue_positions_and_eta(item.queue_id)

    return jsonify({'success': True, 'message': 'Token cancelled successfully.', 'token': item.to_dict()}), 200

# 11. MEDICAL RECORDS
@patient_bp.route('/medical-records', methods=['GET'])
@role_required('PATIENT')
def get_patient_medical_history():
    user_id = int(get_jwt_identity())
    patient = Patient.query.filter_by(user_id=user_id).first()
    if not patient:
        return jsonify({'success': False, 'message': 'Patient not found.'}), 404

    records = MedicalRecord.query.filter_by(patient_id=patient.id).order_by(MedicalRecord.record_date.desc()).all()
    prescriptions = Prescription.query.filter_by(patient_id=patient.id).order_by(Prescription.created_at.desc()).all()

    return jsonify({
        'success': True,
        'consultation_history': [r.to_dict() for r in records],
        'prescriptions': [p.to_dict() for p in prescriptions]
    }), 200

# 12. NOTIFICATIONS
@patient_bp.route('/notifications', methods=['GET'])
@role_required('PATIENT')
def get_patient_notifications():
    user_id = int(get_jwt_identity())
    notifs = Notification.query.filter_by(user_id=user_id).order_by(Notification.created_at.desc()).all()
    unread_count = Notification.query.filter_by(user_id=user_id, is_read=False).count()

    return jsonify({
        'success': True,
        'unread_count': unread_count,
        'notifications': [n.to_dict() for n in notifs]
    }), 200

@patient_bp.route('/notifications/<int:notification_id>/read', methods=['PUT'])
@role_required('PATIENT')
def mark_patient_notification_read(notification_id):
    user_id = int(get_jwt_identity())
    notif = Notification.query.filter_by(id=notification_id, user_id=user_id).first()
    if not notif:
        return jsonify({'success': False, 'message': 'Notification not found or access denied.'}), 404

    notif.is_read = True
    db.session.commit()
    return jsonify({'success': True, 'notification': notif.to_dict()}), 200
