from datetime import datetime
from backend.extensions import db

class Prescription(db.Model):
    __tablename__ = 'prescriptions'

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id', ondelete='CASCADE'), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctors.id', ondelete='CASCADE'), nullable=False)
    hospital_id = db.Column(db.Integer, db.ForeignKey('hospitals.id', ondelete='CASCADE'), nullable=False)
    appointment_id = db.Column(db.Integer, nullable=True)
    diagnosis = db.Column(db.Text, nullable=False)
    clinical_notes = db.Column(db.Text)
    status = db.Column(db.String(20), default='PRESCRIPTION_RECEIVED')  # PRESCRIPTION_RECEIVED, PREPARING, READY, COMPLETED
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    items = db.relationship('PrescriptionItem', backref='prescription', cascade="all, delete-orphan")

    def to_dict(self):
        patient_info = self.patient.to_dict() if self.patient else {}
        doctor_info = self.doctor.to_dict() if self.doctor else {}
        hospital_name = self.doctor.hospital.name if self.doctor and self.doctor.hospital else ''
        return {
            'id': self.id,
            'patient_id': self.patient_id,
            'patient_name': patient_info.get('name', ''),
            'doctor_id': self.doctor_id,
            'doctor_name': doctor_info.get('name', ''),
            'hospital_id': self.hospital_id,
            'hospital_name': hospital_name,
            'appointment_id': self.appointment_id,
            'diagnosis': self.diagnosis,
            'clinical_notes': self.clinical_notes,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'items': [item.to_dict() for item in self.items]
        }

class PrescriptionItem(db.Model):
    __tablename__ = 'prescription_items'

    id = db.Column(db.Integer, primary_key=True)
    prescription_id = db.Column(db.Integer, db.ForeignKey('prescriptions.id', ondelete='CASCADE'), nullable=False)
    medicine_name = db.Column(db.String(150), nullable=False)
    dosage = db.Column(db.String(50), nullable=False)
    frequency = db.Column(db.String(50), nullable=False)
    duration = db.Column(db.String(50), nullable=False)
    instructions = db.Column(db.Text)

    def to_dict(self):
        return {
            'id': self.id,
            'prescription_id': self.prescription_id,
            'medicine_name': self.medicine_name,
            'dosage': self.dosage,
            'frequency': self.frequency,
            'duration': self.duration,
            'instructions': self.instructions
        }
