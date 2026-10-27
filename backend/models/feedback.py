from datetime import datetime
from backend.extensions import db

class StaffFeedback(db.Model):
    __tablename__ = 'staff_feedback'

    id = db.Column(db.Integer, primary_key=True)
    organization_id = db.Column(db.Integer, db.ForeignKey('organizations.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    staff_name = db.Column(db.String(100), nullable=False)
    staff_role = db.Column(db.String(50), default='Steward')  # Head Chef, Steward, Floor Captain, Diner Rep
    meal_period = db.Column(db.String(20), default='Lunch')    # Breakfast, Lunch, Snacks, Dinner
    dish_name = db.Column(db.String(120), nullable=False)
    feedback_type = db.Column(db.String(60), nullable=False)  # Portion Too Large, Taste / Spiciness, Temperature, Leftover Cause, Diner Request
    severity = db.Column(db.String(20), default='Medium')     # Low, Medium, High
    comments = db.Column(db.Text, nullable=False)
    chef_action_notes = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(30), default='Pending')      # Pending, Reviewed, Action Implemented

    def to_dict(self):
        return {
            'id': self.id,
            'organization_id': self.organization_id,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M'),
            'staff_name': self.staff_name,
            'staff_role': self.staff_role,
            'meal_period': self.meal_period,
            'dish_name': self.dish_name,
            'feedback_type': self.feedback_type,
            'severity': self.severity,
            'comments': self.comments,
            'chef_action_notes': self.chef_action_notes,
            'status': self.status
        }
