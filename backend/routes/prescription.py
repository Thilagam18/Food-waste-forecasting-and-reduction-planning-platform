from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.extensions import db
from backend.models.user import User
from backend.models.doctor import Doctor
from backend.models.patient import Patient
from backend.models.prescription import Prescription, PrescriptionItem
from backend.services.notification_service import send_notification

prescription_bp = Blueprint('prescription', __name__, url_prefix='/api/prescriptions')

@prescription_bp.route('', methods=['POST'])
@jwt_required()
def create_prescription():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if user.role not in ['DOCTOR', 'HOSPITAL_ADMIN']:
        return jsonify({'success': False, 'message': 'Only doctors can write prescriptions.'}), 403

    doctor = Doctor.query.filter_by(user_id=user_id).first()
    if not doctor:
        return jsonify({'success': False, 'message': 'Doctor profile not found.'}), 404

    data = request.get_json() or {}
    patient_id = data.get('patient_id')
    diagnosis = data.get('diagnosis')
    clinical_notes = data.get('clinical_notes', '')
    medicines = data.get('medicines', [])  # list of dicts: name, dosage, frequency, duration, instructions

    if not patient_id or not diagnosis:
        return jsonify({'success': False, 'message': 'patient_id and diagnosis are required.'}), 400

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
            dosage=med.get('dosage', '1 tab'),
            frequency=med.get('frequency', 'Twice daily'),
            duration=med.get('duration', '5 days'),
            instructions=med.get('instructions', 'After meals')
        )
        db.session.add(item)

    db.session.commit()

    send_notification(
        user_id=patient.user_id,
        title="New Prescription Issued",
        message=f"Dr. {user.name} issued a digital prescription for {diagnosis}.",
        notification_type="PRESCRIPTION"
    )

    return jsonify({
        'success': True,
        'message': 'Prescription issued successfully.',
        'prescription': prescription.to_dict()
    }), 201

@prescription_bp.route('/patient/<int:patient_id>', methods=['GET'])
@jwt_required()
def get_patient_prescriptions(patient_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    # Access control guard: Patient can only access their own, Doctors/Pharmacies can access relevant
    if user.role == 'PATIENT' and user.patient and user.patient.id != patient_id:
        return jsonify({'success': False, 'message': 'Access denied.'}), 403

    prescriptions = Prescription.query.filter_by(patient_id=patient_id).order_by(Prescription.created_at.desc()).all()
    return jsonify({'success': True, 'prescriptions': [p.to_dict() for p in prescriptions]}), 200

@prescription_bp.route('/<int:prescription_id>/status', methods=['PUT'])
@jwt_required()
def update_prescription_status(prescription_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if user.role not in ['PHARMACY', 'HOSPITAL_ADMIN', 'DOCTOR']:
        return jsonify({'success': False, 'message': 'Unauthorized to update prescription status.'}), 403

    prescription = Prescription.query.get(prescription_id)
    if not prescription:
        return jsonify({'success': False, 'message': 'Prescription not found.'}), 404

    data = request.get_json() or {}
    new_status = data.get('status')
    if new_status not in ['PRESCRIPTION_RECEIVED', 'PREPARING', 'READY', 'COMPLETED']:
        return jsonify({'success': False, 'message': 'Invalid status state.'}), 400

    prescription.status = new_status
    db.session.commit()

    send_notification(
        user_id=prescription.patient.user_id,
        title="Prescription Status Update",
        message=f"Your prescription status is now: {new_status}.",
        notification_type="PHARMACY_UPDATE"
    )

    return jsonify({'success': True, 'prescription': prescription.to_dict()}), 200
