from backend.extensions import db

class Patient(db.Model):
    __tablename__ = 'patients'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False)
    age = db.Column(db.Integer)
    gender = db.Column(db.String(10))
    blood_group = db.Column(db.String(10))
    emergency_contact = db.Column(db.String(20))
    address = db.Column(db.Text)

    appointments = db.relationship('Appointment', backref='patient', cascade="all, delete-orphan")
    queue_items = db.relationship('QueueItem', backref='patient', cascade="all, delete-orphan")
    prescriptions = db.relationship('Prescription', backref='patient', cascade="all, delete-orphan")
    medical_records = db.relationship('MedicalRecord', backref='patient', cascade="all, delete-orphan")

    def to_dict(self):
        user_info = self.user.to_dict() if self.user else {}
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': user_info.get('name', ''),
            'email': user_info.get('email', ''),
            'phone': user_info.get('phone', ''),
            'age': self.age,
            'gender': self.gender,
            'blood_group': self.blood_group,
            'emergency_contact': self.emergency_contact,
            'address': self.address
        }
