from datetime import datetime
from backend.extensions import db

class MedicalRecord(db.Model):
    __tablename__ = 'medical_records'

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id', ondelete='CASCADE'), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctors.id', ondelete='SET NULL'), nullable=True)
    title = db.Column(db.String(150), nullable=False)
    record_type = db.Column(db.String(50), default='CONSULTATION_SUMMARY')
    notes = db.Column(db.Text, nullable=False)
    record_date = db.Column(db.DateTime, default=datetime.utcnow)

    doctor = db.relationship('Doctor')

    def to_dict(self):
        doctor_name = self.doctor.user.name if self.doctor and self.doctor.user else 'System'
        return {
            'id': self.id,
            'patient_id': self.patient_id,
            'doctor_id': self.doctor_id,
            'doctor_name': doctor_name,
            'title': self.title,
            'record_type': self.record_type,
            'notes': self.notes,
            'record_date': self.record_date.isoformat() if self.record_date else None
        }
