from datetime import datetime
from backend.extensions import db

class Hospital(db.Model):
    __tablename__ = 'hospitals'

    id = db.Column(db.Integer, primary_key=True)
    admin_user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    name = db.Column(db.String(150), nullable=False)
    address = db.Column(db.Text, nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    operating_hours = db.Column(db.String(100), default='24/7')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    admin_user = db.relationship('User', foreign_keys=[admin_user_id])
    hospital_departments = db.relationship('HospitalDepartment', backref='hospital', cascade="all, delete-orphan")
    doctors = db.relationship('Doctor', backref='hospital', cascade="all, delete-orphan")
    pharmacies = db.relationship('Pharmacy', backref='hospital')
    queues = db.relationship('Queue', backref='hospital', cascade="all, delete-orphan")

    def to_dict(self):
        depts = [hd.department.to_dict() for hd in self.hospital_departments if hd.department]
        return {
            'id': self.id,
            'admin_user_id': self.admin_user_id,
            'name': self.name,
            'address': self.address,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'phone': self.phone,
            'email': self.email,
            'operating_hours': self.operating_hours,
            'departments': depts,
            'doctors_count': len(self.doctors)
        }

class Department(db.Model):
    __tablename__ = 'departments'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text)
    icon_name = db.Column(db.String(50), default='activity')
    is_active = db.Column(db.Boolean, default=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'icon_name': self.icon_name,
            'is_active': self.is_active
        }

class HospitalDepartment(db.Model):
    __tablename__ = 'hospital_departments'

    id = db.Column(db.Integer, primary_key=True)
    hospital_id = db.Column(db.Integer, db.ForeignKey('hospitals.id', ondelete='CASCADE'), nullable=False)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id', ondelete='CASCADE'), nullable=False)

    department = db.relationship('Department')
