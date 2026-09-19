from datetime import datetime, date
from backend.extensions import db

class Queue(db.Model):
    __tablename__ = 'queues'

    id = db.Column(db.Integer, primary_key=True)
    hospital_id = db.Column(db.Integer, db.ForeignKey('hospitals.id', ondelete='CASCADE'), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctors.id', ondelete='CASCADE'), nullable=False)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id', ondelete='CASCADE'), nullable=False)
    current_token = db.Column(db.String(20), default='None')
    total_tokens_today = db.Column(db.Integer, default=0)
    active_tokens = db.Column(db.Integer, default=0)
    status = db.Column(db.String(20), default='ACTIVE')  # ACTIVE, PAUSED, CLOSED
    date = db.Column(db.Date, default=date.today, nullable=False)

    department = db.relationship('Department')
    queue_items = db.relationship('QueueItem', backref='queue', cascade="all, delete-orphan", order_by="QueueItem.position")
    events = db.relationship('QueueEvent', backref='queue', cascade="all, delete-orphan", order_by="desc(QueueEvent.created_at)")

    def to_dict(self):
        doctor_info = self.doctor.to_dict() if self.doctor else {}
        hospital_info = self.hospital.name if self.hospital else ''
        dept_info = self.department.to_dict() if self.department else {}

        waiting_count = QueueItem.query.filter_by(queue_id=self.id, status='WAITING').count()
        emergency_count = QueueItem.query.filter_by(queue_id=self.id, status='EMERGENCY').count()

        return {
            'id': self.id,
            'hospital_id': self.hospital_id,
            'hospital_name': hospital_info,
            'doctor_id': self.doctor_id,
            'doctor_name': doctor_info.get('name', ''),
            'department_id': self.department_id,
            'department': dept_info,
            'current_token': self.current_token,
            'total_tokens_today': self.total_tokens_today,
            'active_tokens': self.active_tokens,
            'waiting_patients_count': waiting_count + emergency_count,
            'status': self.status,
            'date': self.date.isoformat() if self.date else None
        }

class QueueItem(db.Model):
    __tablename__ = 'queue_items'

    id = db.Column(db.Integer, primary_key=True)
    queue_id = db.Column(db.Integer, db.ForeignKey('queues.id', ondelete='CASCADE'), nullable=False)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id', ondelete='CASCADE'), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctors.id', ondelete='CASCADE'), nullable=False)
    token_number = db.Column(db.Integer, nullable=False)
    token_code = db.Column(db.String(20), nullable=False)
    status = db.Column(db.String(20), default='WAITING')  # WAITING, IN_PROGRESS, COMPLETED, CANCELLED, EMERGENCY
    position = db.Column(db.Integer, nullable=False)
    estimated_wait_mins = db.Column(db.Integer, nullable=False)
    is_emergency = db.Column(db.Boolean, default=False)
    booked_at = db.Column(db.DateTime, default=datetime.utcnow)
    started_at = db.Column(db.DateTime, nullable=True)
    completed_at = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        patient_info = self.patient.to_dict() if self.patient else {}
        return {
            'id': self.id,
            'queue_id': self.queue_id,
            'patient_id': self.patient_id,
            'patient_name': patient_info.get('name', ''),
            'doctor_id': self.doctor_id,
            'token_number': self.token_number,
            'token_code': self.token_code,
            'status': self.status,
            'position': self.position,
            'estimated_wait_mins': self.estimated_wait_mins,
            'is_emergency': self.is_emergency,
            'booked_at': self.booked_at.isoformat() if self.booked_at else None,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }

class QueueEvent(db.Model):
    __tablename__ = 'queue_events'

    id = db.Column(db.Integer, primary_key=True)
    queue_id = db.Column(db.Integer, db.ForeignKey('queues.id', ondelete='CASCADE'), nullable=False)
    token_code = db.Column(db.String(20), nullable=False)
    event_type = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'queue_id': self.queue_id,
            'token_code': self.token_code,
            'event_type': self.event_type,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class EmergencyCase(db.Model):
    __tablename__ = 'emergency_cases'

    id = db.Column(db.Integer, primary_key=True)
    queue_id = db.Column(db.Integer, db.ForeignKey('queues.id', ondelete='CASCADE'), nullable=False)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id', ondelete='CASCADE'), nullable=False)
    token_code = db.Column(db.String(20), nullable=False)
    severity_description = db.Column(db.Text, nullable=False)
    added_by_user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'queue_id': self.queue_id,
            'patient_id': self.patient_id,
            'token_code': self.token_code,
            'severity_description': self.severity_description,
            'added_by_user_id': self.added_by_user_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
