from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.extensions import db
from backend.models.user import User
from backend.models.patient import Patient
from backend.models.medical_record import MedicalRecord

medical_records_bp = Blueprint('medical_records', __name__, url_prefix='/api/patients')

@medical_records_bp.route('/<int:patient_id>/records', methods=['GET'])
@jwt_required()
def get_patient_records(patient_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    # Privacy Guard: Patient can only view their own medical records
    if user.role == 'PATIENT':
        if not user.patient or user.patient.id != patient_id:
            return jsonify({'success': False, 'message': 'Access denied to private patient records.'}), 403

    records = MedicalRecord.query.filter_by(patient_id=patient_id).order_by(MedicalRecord.record_date.desc()).all()
    return jsonify({'success': True, 'records': [r.to_dict() for r in records]}), 200

@medical_records_bp.route('/<int:patient_id>/records', methods=['POST'])
@jwt_required()
def add_patient_record(patient_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    data = request.get_json() or {}

    title = data.get('title', 'Consultation Record')
    record_type = data.get('record_type', 'CONSULTATION_SUMMARY')
    notes = data.get('notes', '')

    if not notes:
        return jsonify({'success': False, 'message': 'Notes content required.'}), 400

    doctor_id = user.doctor.id if user.role == 'DOCTOR' and user.doctor else None

    record = MedicalRecord(
        patient_id=patient_id,
        doctor_id=doctor_id,
        title=title,
        record_type=record_type,
        notes=notes
    )
    db.session.add(record)
    db.session.commit()

    return jsonify({'success': True, 'message': 'Medical record created.', 'record': record.to_dict()}), 201
