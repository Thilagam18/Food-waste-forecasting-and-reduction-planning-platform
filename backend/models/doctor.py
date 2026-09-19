from backend.extensions import db

class Doctor(db.Model):
    __tablename__ = 'doctors'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False)
    hospital_id = db.Column(db.Integer, db.ForeignKey('hospitals.id', ondelete='CASCADE'), nullable=False)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id', ondelete='CASCADE'), nullable=False)
    qualification = db.Column(db.String(100), nullable=False)
    specialization = db.Column(db.String(100))
    experience_years = db.Column(db.Integer, default=5)
    avg_consultation_time_mins = db.Column(db.Integer, default=12)
    is_available = db.Column(db.Boolean, default=True)

    department = db.relationship('Department')
    queues = db.relationship('Queue', backref='doctor', cascade="all, delete-orphan")
    appointments = db.relationship('Appointment', backref='doctor', cascade="all, delete-orphan")
    prescriptions = db.relationship('Prescription', backref='doctor')

    def to_dict(self):
        user_info = self.user.to_dict() if self.user else {}
        hospital_info = self.hospital.name if self.hospital else ''
        dept_info = self.department.to_dict() if self.department else {}
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': user_info.get('name', ''),
            'email': user_info.get('email', ''),
            'phone': user_info.get('phone', ''),
            'hospital_id': self.hospital_id,
            'hospital_name': hospital_info,
            'department_id': self.department_id,
            'department': dept_info,
            'qualification': self.qualification,
            'specialization': self.specialization,
            'experience_years': self.experience_years,
            'avg_consultation_time_mins': self.avg_consultation_time_mins,
            'is_available': self.is_available
        }
