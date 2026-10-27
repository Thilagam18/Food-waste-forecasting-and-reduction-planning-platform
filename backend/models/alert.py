from datetime import datetime
from backend.extensions import db

class Alert(db.Model):
    __tablename__ = 'alerts'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    organization_id = db.Column(db.Integer, db.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False, index=True)
    food_item_id = db.Column(db.Integer, db.ForeignKey('food_items.id', ondelete='SET NULL'), nullable=True)
    
    alert_type = db.Column(db.String(60), nullable=False)  
    # 'Expiry Warning', 'High Surplus Risk', 'Repeated Overproduction', 'Spoilage Spike', 'Stockout Risk'
    severity = db.Column(db.String(20), nullable=False, default='Warning')  # 'Critical', 'Warning', 'Info'
    message = db.Column(db.Text, nullable=False)
    suggested_action = db.Column(db.Text, nullable=True)
    is_resolved = db.Column(db.Boolean, nullable=False, default=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    food_item = db.relationship('FoodItem', foreign_keys=[food_item_id], backref='alerts')

    def to_dict(self):
        return {
            'id': self.id,
            'organization_id': self.organization_id,
            'food_item_id': self.food_item_id,
            'food_item_name': self.food_item.name if self.food_item else None,
            'category': self.food_item.category if self.food_item else None,
            'alert_type': self.alert_type,
            'severity': self.severity,
            'message': self.message,
            'suggested_action': self.suggested_action,
            'is_resolved': self.is_resolved,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
