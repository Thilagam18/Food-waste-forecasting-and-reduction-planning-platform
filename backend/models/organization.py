from datetime import datetime
from backend.extensions import db

class Organization(db.Model):
    __tablename__ = 'organizations'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(150), nullable=False)
    org_type = db.Column(db.String(60), nullable=False, default='Restaurant')  # Restaurant, Hotel, College Canteen, Cafeteria, Catering Service, Other
    location = db.Column(db.String(200), nullable=True)
    contact_phone = db.Column(db.String(50), nullable=True)
    contact_email = db.Column(db.String(120), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    users = db.relationship('User', backref='organization', lazy=True, cascade='all, delete-orphan')
    food_items = db.relationship('FoodItem', backref='organization', lazy=True, cascade='all, delete-orphan')
    daily_records = db.relationship('DailyFoodRecord', backref='organization', lazy=True, cascade='all, delete-orphan')
    forecasts = db.relationship('ForecastResult', backref='organization', lazy=True, cascade='all, delete-orphan')
    recommendations = db.relationship('Recommendation', backref='organization', lazy=True, cascade='all, delete-orphan')
    alerts = db.relationship('Alert', backref='organization', lazy=True, cascade='all, delete-orphan')
    interventions = db.relationship('InterventionOutcome', backref='organization', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'org_type': self.org_type,
            'location': self.location,
            'contact_phone': self.contact_phone,
            'contact_email': self.contact_email,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
