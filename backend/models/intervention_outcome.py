from datetime import datetime, date
from backend.extensions import db

class InterventionOutcome(db.Model):
    __tablename__ = 'intervention_outcomes'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    organization_id = db.Column(db.Integer, db.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False, index=True)
    recommendation_id = db.Column(db.Integer, db.ForeignKey('recommendations.id', ondelete='SET NULL'), nullable=True)
    
    action_taken = db.Column(db.Text, nullable=False)
    recorded_date = db.Column(db.Date, nullable=False, default=date.today)
    food_saved_kg = db.Column(db.Float, nullable=False, default=0.0)
    cost_saved = db.Column(db.Float, nullable=False, default=0.0)
    staff_notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'organization_id': self.organization_id,
            'recommendation_id': self.recommendation_id,
            'recommendation_title': self.recommendation.title if self.recommendation else None,
            'action_taken': self.action_taken,
            'recorded_date': self.recorded_date.isoformat() if isinstance(self.recorded_date, (date, datetime)) else str(self.recorded_date),
            'food_saved_kg': round(float(self.food_saved_kg), 2),
            'cost_saved': round(float(self.cost_saved), 2),
            'staff_notes': self.staff_notes,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
