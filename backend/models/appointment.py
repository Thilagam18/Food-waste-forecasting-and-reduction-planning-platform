from datetime import datetime
from backend.extensions import db

class Appointment(db.Model):
    __tablename__ = 'appointments'

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id', ondelete='CASCADE'), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctors.id', ondelete='CASCADE'), nullable=False)
    hospital_id = db.Column(db.Integer, db.ForeignKey('hospitals.id', ondelete='CASCADE'), nullable=False)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id', ondelete='CASCADE'), nullable=False)
    appointment_date = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    status = db.Column(db.String(20), default='SCHEDULED') # SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    department = db.relationship('Department')
    hospital = db.relationship('Hospital')

    def to_dict(self):
        doctor_info = self.doctor.user.name if self.doctor and self.doctor.user else ''
        patient_info = self.patient.user.name if self.patient and self.patient.user else ''
        hospital_info = self.hospital.name if self.hospital else ''
        dept_info = self.department.name if self.department else ''

        return {
            'id': self.id,
            'patient_id': self.patient_id,
            'patient_name': patient_info,
            'doctor_id': self.doctor_id,
            'doctor_name': doctor_info,
            'hospital_id': self.hospital_id,
            'hospital_name': hospital_info,
            'department_id': self.department_id,
            'department_name': dept_info,
            'appointment_date': self.appointment_date.isoformat() if self.appointment_date else None,
            'status': self.status,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
