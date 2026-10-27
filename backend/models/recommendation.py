from datetime import datetime, date
from backend.extensions import db

class Recommendation(db.Model):
    __tablename__ = 'recommendations'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    organization_id = db.Column(db.Integer, db.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False, index=True)
    food_item_id = db.Column(db.Integer, db.ForeignKey('food_items.id', ondelete='SET NULL'), nullable=True)
    
    title = db.Column(db.String(200), nullable=False)
    category = db.Column(db.String(60), nullable=False, default='Preparation')  
    # 'Preparation', 'Inventory', 'Donation', 'Portioning', 'Storage'
    
    recommendation_text = db.Column(db.Text, nullable=False)
    reason = db.Column(db.Text, nullable=False)
    supporting_data = db.Column(db.Text, nullable=True)
    
    potential_savings_cost = db.Column(db.Float, nullable=False, default=0.0)
    potential_waste_reduction_kg = db.Column(db.Float, nullable=False, default=0.0)
    
    priority = db.Column(db.String(20), nullable=False, default='Medium')  # 'High', 'Medium', 'Low'
    status = db.Column(db.String(30), nullable=False, default='Pending')    # 'Pending', 'In Progress', 'Completed', 'Dismissed'
    action_notes = db.Column(db.Text, nullable=True)
    
    date_generated = db.Column(db.Date, nullable=False, default=date.today)
    resolved_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    food_item = db.relationship('FoodItem', foreign_keys=[food_item_id], backref='recommendations')
    interventions = db.relationship('InterventionOutcome', backref='recommendation', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'organization_id': self.organization_id,
            'food_item_id': self.food_item_id,
            'food_item_name': self.food_item.name if self.food_item else None,
            'title': self.title,
            'category': self.category,
            'recommendation_text': self.recommendation_text,
            'reason': self.reason,
            'supporting_data': self.supporting_data,
            'potential_savings_cost': round(float(self.potential_savings_cost), 2),
            'potential_waste_reduction_kg': round(float(self.potential_waste_reduction_kg), 2),
            'priority': self.priority,
            'status': self.status,
            'action_notes': self.action_notes,
            'date_generated': self.date_generated.isoformat() if isinstance(self.date_generated, (date, datetime)) else str(self.date_generated),
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
