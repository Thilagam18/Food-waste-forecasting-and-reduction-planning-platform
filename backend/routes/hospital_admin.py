from datetime import datetime, date
from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
from backend.extensions import db
from backend.models.user import User
from backend.models.hospital import Hospital, Department, HospitalDepartment
from backend.models.doctor import Doctor
from backend.models.patient import Patient
from backend.models.appointment import Appointment
from backend.models.queue import Queue, QueueItem, QueueEvent
from backend.models.notification import Notification
from backend.utils.auth import role_required
from backend.services.queue_service import add_emergency_case_to_queue, recalculate_queue_positions_and_eta

hospital_admin_bp = Blueprint('hospital_admin', __name__, url_prefix='/api/hospital-admin')

def get_admin_hospital(user_id):
    """Retrieve hospital associated with the authenticated admin user."""
    hospital = Hospital.query.filter_by(admin_user_id=user_id).first()
    if not hospital:
        # Fallback association to primary hospital if unassigned
        hospital = Hospital.query.get(1)
        if hospital and not hospital.admin_user_id:
            hospital.admin_user_id = user_id
            db.session.commit()
    return hospital

# 1. PROFILE
@hospital_admin_bp.route('/profile', methods=['GET'])
@role_required('HOSPITAL_ADMIN')
def get_admin_profile():
    user_id = int(get_jwt_identity())
    hospital = get_admin_hospital(user_id)
    if not hospital:
        return jsonify({'success': False, 'message': 'Hospital profile not found for this administrator.'}), 404

    return jsonify({'success': True, 'hospital': hospital.to_dict()}), 200

@hospital_admin_bp.route('/profile', methods=['PUT'])
@role_required('HOSPITAL_ADMIN')
def update_admin_profile():
    user_id = int(get_jwt_identity())
    hospital = get_admin_hospital(user_id)
    if not hospital:
        return jsonify({'success': False, 'message': 'Hospital profile not found.'}), 404

    data = request.get_json() or {}
    if 'name' in data:
        hospital.name = data['name']
    if 'address' in data:
        hospital.address = data['address']
    if 'phone' in data:
        hospital.phone = data['phone']
    if 'email' in data:
        hospital.email = data['email']
    if 'latitude' in data:
        hospital.latitude = float(data['latitude'])
    if 'longitude' in data:
        hospital.longitude = float(data['longitude'])
    if 'operating_hours' in data:
        hospital.operating_hours = data['operating_hours']

    db.session.commit()
    return jsonify({'success': True, 'message': 'Hospital profile updated successfully.', 'hospital': hospital.to_dict()}), 200

# 2. DASHBOARD
@hospital_admin_bp.route('/dashboard', methods=['GET'])
@role_required('HOSPITAL_ADMIN')
def get_admin_dashboard():
    user_id = int(get_jwt_identity())
    hospital = get_admin_hospital(user_id)
    if not hospital:
        return jsonify({'success': False, 'message': 'Hospital not found.'}), 404

    today = date.today()
    total_doctors = Doctor.query.filter_by(hospital_id=hospital.id).count()
    total_departments = HospitalDepartment.query.filter_by(hospital_id=hospital.id).count()

    today_appts = Appointment.query.filter_by(hospital_id=hospital.id).filter(
        db.func.date(Appointment.appointment_date) == today
    ).count()

    active_queues = Queue.query.filter_by(hospital_id=hospital.id, date=today).all()
    queue_ids = [q.id for q in active_queues]

    waiting_count = 0
    in_progress_count = 0
    completed_count = 0
    emergency_today_count = 0

    if queue_ids:
        waiting_count = QueueItem.query.filter(
            QueueItem.queue_id.in_(queue_ids),
            QueueItem.status.in_(['WAITING', 'EMERGENCY'])
        ).count()

        in_progress_count = QueueItem.query.filter(
            QueueItem.queue_id.in_(queue_ids),
            QueueItem.status == 'IN_PROGRESS'
        ).count()

        completed_count = QueueItem.query.filter(
            QueueItem.queue_id.in_(queue_ids),
            QueueItem.status == 'COMPLETED'
        ).count()

        emergency_today_count = QueueItem.query.filter(
            QueueItem.queue_id.in_(queue_ids),
            QueueItem.is_emergency == True
        ).count()

    avg_doctors_wait = 15
    doctors = Doctor.query.filter_by(hospital_id=hospital.id).all()
    if doctors:
        avg_doctors_wait = int(sum(d.avg_consultation_time_mins for d in doctors) / len(doctors))

    return jsonify({
        'success': True,
        'hospital': hospital.to_dict(),
        'total_doctors': total_doctors,
        'total_departments': total_departments,
        'today_appointments_count': today_appts,
        'waiting_patients_count': waiting_count,
        'active_consultations_count': in_progress_count,
        'completed_consultations_count': completed_count,
        'emergency_cases_today': emergency_today_count,
        'active_queues': [q.to_dict() for q in active_queues],
        'avg_waiting_time_mins': max(10, waiting_count * avg_doctors_wait)
    }), 200

# 3. DEPARTMENT MANAGEMENT
@hospital_admin_bp.route('/departments', methods=['GET'])
@role_required('HOSPITAL_ADMIN')
def get_departments():
    user_id = int(get_jwt_identity())
    hospital = get_admin_hospital(user_id)
    if not hospital:
        return jsonify({'success': False, 'message': 'Hospital not found.'}), 404

    # Hospital specific departments
    hospital_depts = HospitalDepartment.query.filter_by(hospital_id=hospital.id).all()
    depts = [hd.department.to_dict() for hd in hospital_depts if hd.department]

    return jsonify({'success': True, 'count': len(depts), 'departments': depts}), 200

@hospital_admin_bp.route('/departments', methods=['POST'])
@role_required('HOSPITAL_ADMIN')
def create_department():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    description = data.get('description', '')
    icon_name = data.get('icon_name', 'activity')

    if not name:
        return jsonify({'success': False, 'message': 'Department name is required.'}), 400

    dept = Department.query.filter_by(name=name).first()
    if not dept:
        dept = Department(name=name, description=description, icon_name=icon_name, is_active=True)
        db.session.add(dept)
        db.session.commit()

    # Assign to admin's hospital if not assigned
    user_id = int(get_jwt_identity())
    hospital = get_admin_hospital(user_id)
    if hospital:
        existing_hd = HospitalDepartment.query.filter_by(hospital_id=hospital.id, department_id=dept.id).first()
        if not existing_hd:
            hd = HospitalDepartment(hospital_id=hospital.id, department_id=dept.id)
            db.session.add(hd)
            db.session.commit()

    return jsonify({'success': True, 'message': 'Department created successfully.', 'department': dept.to_dict()}), 201

@hospital_admin_bp.route('/departments/<int:department_id>', methods=['PUT'])
@role_required('HOSPITAL_ADMIN')
def update_department(department_id):
    dept = Department.query.get(department_id)
    if not dept:
        return jsonify({'success': False, 'message': 'Department not found.'}), 404

    data = request.get_json() or {}
    if 'name' in data:
        dept.name = data['name']
    if 'description' in data:
        dept.description = data['description']
    if 'icon_name' in data:
        dept.icon_name = data['icon_name']
    if 'is_active' in data:
        dept.is_active = bool(data['is_active'])

    db.session.commit()
    return jsonify({'success': True, 'message': 'Department updated.', 'department': dept.to_dict()}), 200

@hospital_admin_bp.route('/departments/<int:department_id>', methods=['DELETE'])
@role_required('HOSPITAL_ADMIN')
def delete_department(department_id):
    dept = Department.query.get(department_id)
    if not dept:
        return jsonify({'success': False, 'message': 'Department not found.'}), 404

    # Soft deletion/deactivation to preserve historical records
    dept.is_active = False
    db.session.commit()
    return jsonify({'success': True, 'message': f'Department {dept.name} deactivated.'}), 200

# 4. HOSPITAL-DEPARTMENT ASSIGNMENT
@hospital_admin_bp.route('/departments/<int:department_id>/assign', methods=['POST'])
@role_required('HOSPITAL_ADMIN')
def assign_department_to_hospital(department_id):
    user_id = int(get_jwt_identity())
    hospital = get_admin_hospital(user_id)
    if not hospital:
        return jsonify({'success': False, 'message': 'Hospital not found.'}), 404

    dept = Department.query.get(department_id)
    if not dept:
        return jsonify({'success': False, 'message': 'Department does not exist.'}), 404

    existing = HospitalDepartment.query.filter_by(hospital_id=hospital.id, department_id=department_id).first()
    if existing:
        return jsonify({'success': True, 'message': 'Department is already assigned to this hospital.'}), 200

    hd = HospitalDepartment(hospital_id=hospital.id, department_id=department_id)
    db.session.add(hd)
    db.session.commit()

    return jsonify({'success': True, 'message': f'Department {dept.name} assigned to hospital {hospital.name}.'}), 201

@hospital_admin_bp.route('/departments/<int:department_id>/assign', methods=['DELETE'])
@role_required('HOSPITAL_ADMIN')
def remove_department_from_hospital(department_id):
    user_id = int(get_jwt_identity())
    hospital = get_admin_hospital(user_id)
    if not hospital:
        return jsonify({'success': False, 'message': 'Hospital not found.'}), 404

    hd = HospitalDepartment.query.filter_by(hospital_id=hospital.id, department_id=department_id).first()
    if not hd:
        return jsonify({'success': False, 'message': 'Department assignment not found for this hospital.'}), 404

    db.session.delete(hd)
    db.session.commit()

    return jsonify({'success': True, 'message': 'Department unassigned from hospital.'}), 200

# 5. DOCTOR MANAGEMENT
@hospital_admin_bp.route('/doctors', methods=['GET'])
@role_required('HOSPITAL_ADMIN')
def get_hospital_doctors():
    user_id = int(get_jwt_identity())
    hospital = get_admin_hospital(user_id)
    if not hospital:
        return jsonify({'success': False, 'message': 'Hospital not found.'}), 404

    doctors = Doctor.query.filter_by(hospital_id=hospital.id).all()
    return jsonify({'success': True, 'count': len(doctors), 'doctors': [d.to_dict() for d in doctors]}), 200

@hospital_admin_bp.route('/doctors', methods=['POST'])
@role_required('HOSPITAL_ADMIN')
def add_doctor_to_hospital():
    user_id = int(get_jwt_identity())
    hospital = get_admin_hospital(user_id)
    if not hospital:
        return jsonify({'success': False, 'message': 'Hospital not found.'}), 404

    data = request.get_json() or {}
    name = data.get('name')
    email = data.get('email')
    phone = data.get('phone', '+1 555-0000')
    password = data.get('password', 'doctor123')
    department_id = data.get('department_id', 1)
    qualification = data.get('qualification', 'MD')
    specialization = data.get('specialization', 'Specialist')
    avg_consult = data.get('avg_consultation_time_mins', 12)

    if not name or not email:
        return jsonify({'success': False, 'message': 'Name and email are required.'}), 400

    existing = User.query.filter_by(email=email).first()
    if existing:
        return jsonify({'success': False, 'message': 'User with this email already exists.'}), 400

    u_doc = User(name=name, email=email, phone=phone, role='DOCTOR')
    u_doc.set_password(password)
    db.session.add(u_doc)
    db.session.flush()

    doctor = Doctor(
        user_id=u_doc.id,
        hospital_id=hospital.id,
        department_id=department_id,
        qualification=qualification,
        specialization=specialization,
        experience_years=data.get('experience_years', 5),
        avg_consultation_time_mins=avg_consult,
        is_available=True
    )
    db.session.add(doctor)
    db.session.commit()

    return jsonify({'success': True, 'message': 'Doctor added to hospital.', 'doctor': doctor.to_dict()}), 201

@hospital_admin_bp.route('/doctors/<int:doctor_id>', methods=['PUT'])
@role_required('HOSPITAL_ADMIN')
def update_hospital_doctor(doctor_id):
    user_id = int(get_jwt_identity())
    hospital = get_admin_hospital(user_id)
    if not hospital:
        return jsonify({'success': False, 'message': 'Hospital not found.'}), 404

    doctor = Doctor.query.get(doctor_id)
    if not doctor:
        return jsonify({'success': False, 'message': 'Doctor not found.'}), 404

    # Hospital Ownership Protection
    if doctor.hospital_id != hospital.id:
        return jsonify({'success': False, 'message': 'Forbidden: Doctor belongs to another hospital.'}), 403

    data = request.get_json() or {}
    if 'department_id' in data:
        doctor.department_id = data['department_id']
    if 'qualification' in data:
        doctor.qualification = data['qualification']
    if 'specialization' in data:
        doctor.specialization = data['specialization']
    if 'avg_consultation_time_mins' in data:
        doctor.avg_consultation_time_mins = max(1, int(data['avg_consultation_time_mins']))
    if 'is_available' in data:
        doctor.is_available = bool(data['is_available'])

    if 'name' in data and doctor.user:
        doctor.user.name = data['name']

    db.session.commit()
    return jsonify({'success': True, 'message': 'Doctor information updated.', 'doctor': doctor.to_dict()}), 200

@hospital_admin_bp.route('/doctors/<int:doctor_id>/status', methods=['PATCH'])
@role_required('HOSPITAL_ADMIN')
def toggle_doctor_status(doctor_id):
    user_id = int(get_jwt_identity())
    hospital = get_admin_hospital(user_id)
    if not hospital:
        return jsonify({'success': False, 'message': 'Hospital not found.'}), 404

    doctor = Doctor.query.get(doctor_id)
    if not doctor or doctor.hospital_id != hospital.id:
        return jsonify({'success': False, 'message': 'Doctor not found or belongs to another hospital.'}), 403

    data = request.get_json() or {}
    if 'is_available' in data:
        doctor.is_available = bool(data['is_available'])
    else:
        doctor.is_available = not doctor.is_available

    db.session.commit()
    return jsonify({'success': True, 'message': f'Doctor status updated to {doctor.is_available}.', 'doctor': doctor.to_dict()}), 200

# 7. TODAY'S APPOINTMENTS
@hospital_admin_bp.route('/appointments', methods=['GET'])
@role_required('HOSPITAL_ADMIN')
def get_hospital_appointments():
    user_id = int(get_jwt_identity())
    hospital = get_admin_hospital(user_id)
    if not hospital:
        return jsonify({'success': False, 'message': 'Hospital not found.'}), 404

    doctor_id = request.args.get('doctor', type=int)
    department_id = request.args.get('department', type=int)
    status_filter = request.args.get('status')
    date_filter = request.args.get('date')

    query = Appointment.query.filter_by(hospital_id=hospital.id)
    if doctor_id:
        query = query.filter_by(doctor_id=doctor_id)
    if department_id:
        query = query.filter_by(department_id=department_id)
    if status_filter:
        query = query.filter_by(status=status_filter)
    if date_filter:
        try:
            target_date = datetime.strptime(date_filter, '%Y-%m-%d').date()
            query = query.filter(db.func.date(Appointment.appointment_date) == target_date)
        except ValueError:
            pass

    appts = query.order_by(Appointment.appointment_date.desc()).all()
    return jsonify({'success': True, 'count': len(appts), 'appointments': [a.to_dict() for a in appts]}), 200

# 8. QUEUE MONITORING
@hospital_admin_bp.route('/queues', methods=['GET'])
@role_required('HOSPITAL_ADMIN')
def monitor_hospital_queues():
    user_id = int(get_jwt_identity())
    hospital = get_admin_hospital(user_id)
    if not hospital:
        return jsonify({'success': False, 'message': 'Hospital not found.'}), 404

    today = date.today()
    queues = Queue.query.filter_by(hospital_id=hospital.id, date=today).all()
    return jsonify({'success': True, 'count': len(queues), 'queues': [q.to_dict() for q in queues]}), 200

# 9. EMERGENCY QUEUE MANAGEMENT
@hospital_admin_bp.route('/queues/<int:queue_id>/emergency', methods=['POST'])
@role_required('HOSPITAL_ADMIN')
def trigger_admin_emergency(queue_id):
    user_id = int(get_jwt_identity())
    hospital = get_admin_hospital(user_id)
    if not hospital:
        return jsonify({'success': False, 'message': 'Hospital not found.'}), 404

    queue = Queue.query.get(queue_id)
    if not queue:
        return jsonify({'success': False, 'message': 'Queue not found.'}), 404

    # Hospital Ownership Check
    if queue.hospital_id != hospital.id:
        return jsonify({'success': False, 'message': 'Forbidden: Queue belongs to another hospital.'}), 403

    data = request.get_json() or {}
    patient_id = data.get('patient_id')
    reason = data.get('reason', 'Critical emergency case flagged by Hospital Administrator.')

    if not patient_id:
        return jsonify({'success': False, 'message': 'patient_id is required.'}), 400

    item, err = add_emergency_case_to_queue(queue_id, patient_id, reason, user_id)
    if err:
        return jsonify({'success': False, 'message': err}), 400

    return jsonify({
        'success': True,
        'message': f'Emergency case registered. Token {item.token_code} assigned priority position #1.',
        'token': item.to_dict()
    }), 200

# 10. QUEUE AUDIT EVENTS
@hospital_admin_bp.route('/queues/<int:queue_id>/events', methods=['GET'])
@role_required('HOSPITAL_ADMIN')
def get_queue_events(queue_id):
    user_id = int(get_jwt_identity())
    hospital = get_admin_hospital(user_id)
    if not hospital:
        return jsonify({'success': False, 'message': 'Hospital not found.'}), 404

    queue = Queue.query.get(queue_id)
    if not queue or queue.hospital_id != hospital.id:
        return jsonify({'success': False, 'message': 'Queue not found or belongs to another hospital.'}), 403

    events = QueueEvent.query.filter_by(queue_id=queue_id).order_by(QueueEvent.created_at.desc()).all()
    return jsonify({'success': True, 'count': len(events), 'events': [e.to_dict() for e in events]}), 200

# 11. PATIENT OPERATIONAL MONITORING
@hospital_admin_bp.route('/patients', methods=['GET'])
@role_required('HOSPITAL_ADMIN')
def get_operational_patients():
    user_id = int(get_jwt_identity())
    hospital = get_admin_hospital(user_id)
    if not hospital:
        return jsonify({'success': False, 'message': 'Hospital not found.'}), 404

    # Fetch active queue items in hospital (No medical record exposure)
    today = date.today()
    queues = Queue.query.filter_by(hospital_id=hospital.id, date=today).all()
    queue_ids = [q.id for q in queues]

    items = QueueItem.query.filter(QueueItem.queue_id.in_(queue_ids)).order_by(QueueItem.booked_at.desc()).all()
    results = []
    for item in items:
        results.append({
            'queue_item_id': item.id,
            'token_code': item.token_code,
            'patient_id': item.patient_id,
            'patient_name': item.patient_name,
            'doctor_name': item.queue.doctor.user.name if item.queue and item.queue.doctor else '',
            'department_name': item.queue.department.name if item.queue and item.queue.department else '',
            'status': item.status,
            'position': item.position,
            'estimated_wait_mins': item.estimated_wait_mins,
            'booked_at': item.booked_at.isoformat() if item.booked_at else None
        })

    return jsonify({'success': True, 'count': len(results), 'patients': results}), 200

# 12. HOSPITAL STATISTICS
@hospital_admin_bp.route('/statistics', methods=['GET'])
@role_required('HOSPITAL_ADMIN')
def get_hospital_statistics():
    user_id = int(get_jwt_identity())
    hospital = get_admin_hospital(user_id)
    if not hospital:
        return jsonify({'success': False, 'message': 'Hospital not found.'}), 404

    today = date.today()
    queues = Queue.query.filter_by(hospital_id=hospital.id, date=today).all()
    queue_ids = [q.id for q in queues]

    patients_today = 0
    completed_today = 0
    cancelled_today = 0
    emergencies_today = 0

    if queue_ids:
        patients_today = QueueItem.query.filter(QueueItem.queue_id.in_(queue_ids)).count()
        completed_today = QueueItem.query.filter(QueueItem.queue_id.in_(queue_ids), QueueItem.status == 'COMPLETED').count()
        cancelled_today = QueueItem.query.filter(QueueItem.queue_id.in_(queue_ids), QueueItem.status == 'CANCELLED').count()
        emergencies_today = QueueItem.query.filter(QueueItem.queue_id.in_(queue_ids), QueueItem.is_emergency == True).count()

    doctors = Doctor.query.filter_by(hospital_id=hospital.id).all()
    avg_consult_dur = int(sum(d.avg_consultation_time_mins for d in doctors) / len(doctors)) if doctors else 12

    # Department wise counts
    dept_counts = []
    h_depts = HospitalDepartment.query.filter_by(hospital_id=hospital.id).all()
    for hd in h_depts:
        if hd.department:
            c = Appointment.query.filter_by(hospital_id=hospital.id, department_id=hd.department_id).count()
            dept_counts.append({'department': hd.department.name, 'appointment_count': c})

    # Doctor wise queue counts
    doc_counts = []
    for doc in doctors:
        c = QueueItem.query.filter_by(doctor_id=doc.id, status='WAITING').count()
        doc_counts.append({'doctor_name': doc.user.name if doc.user else '', 'waiting_tokens': c})

    return jsonify({
        'success': True,
        'hospital_id': hospital.id,
        'hospital_name': hospital.name,
        'patients_today': patients_today,
        'appointments_today': Appointment.query.filter_by(hospital_id=hospital.id).filter(db.func.date(Appointment.appointment_date) == today).count(),
        'completed_consultations': completed_today,
        'cancelled_appointments': cancelled_today,
        'emergency_cases': emergencies_today,
        'avg_consultation_duration_mins': avg_consult_dur,
        'department_counts': dept_counts,
        'doctor_counts': doc_counts
    }), 200

# 13. ADMIN NOTIFICATIONS
@hospital_admin_bp.route('/notifications', methods=['GET'])
@role_required('HOSPITAL_ADMIN')
def get_admin_notifications():
    user_id = int(get_jwt_identity())
    notifs = Notification.query.filter_by(user_id=user_id).order_by(Notification.created_at.desc()).all()
    unread = Notification.query.filter_by(user_id=user_id, is_read=False).count()

    return jsonify({
        'success': True,
        'unread_count': unread,
        'notifications': [n.to_dict() for n in notifs]
    }), 200

@hospital_admin_bp.route('/notifications/<int:notification_id>/read', methods=['PUT'])
@role_required('HOSPITAL_ADMIN')
def mark_admin_notification_read(notification_id):
    user_id = int(get_jwt_identity())
    notif = Notification.query.filter_by(id=notification_id, user_id=user_id).first()
    if not notif:
        return jsonify({'success': False, 'message': 'Notification not found.'}), 404

    notif.is_read = True
    db.session.commit()
    return jsonify({'success': True, 'notification': notif.to_dict()}), 200
