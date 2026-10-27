from datetime import datetime, date
from backend.extensions import db

class DailyFoodRecord(db.Model):
    __tablename__ = 'daily_food_records'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    organization_id = db.Column(db.Integer, db.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False, index=True)
    food_item_id = db.Column(db.Integer, db.ForeignKey('food_items.id', ondelete='CASCADE'), nullable=False, index=True)
    record_date = db.Column(db.Date, nullable=False, index=True)
    meal_period = db.Column(db.String(30), nullable=False, default='Lunch')  # Breakfast, Lunch, Snacks, Dinner
    
    quantity_prepared = db.Column(db.Float, nullable=False, default=0.0)
    quantity_consumed = db.Column(db.Float, nullable=False, default=0.0)
    surplus_quantity = db.Column(db.Float, nullable=False, default=0.0)
    discarded_quantity = db.Column(db.Float, nullable=False, default=0.0)
    
    unit_cost = db.Column(db.Float, nullable=False, default=0.0)
    waste_reason = db.Column(db.String(60), nullable=False, default='None')  
    # 'None', 'Overproduction', 'Low Demand', 'Spoilage', 'Expiry', 'Preparation Error', 'Plate Waste', 'Other'
    
    notes = db.Column(db.Text, nullable=True)
    is_demo = db.Column(db.Boolean, nullable=False, default=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    @property
    def waste_cost(self):
        return round(self.discarded_quantity * self.unit_cost, 2)

    @property
    def surplus_cost(self):
        return round(self.surplus_quantity * self.unit_cost, 2)

    @property
    def waste_percentage(self):
        if self.quantity_prepared > 0:
            return round((self.discarded_quantity / self.quantity_prepared) * 100, 1)
        return 0.0

    def to_dict(self):
        return {
            'id': self.id,
            'organization_id': self.organization_id,
            'food_item_id': self.food_item_id,
            'food_item_name': self.food_item.name if self.food_item else 'Unknown',
            'category': self.food_item.category if self.food_item else 'General',
            'unit': self.food_item.unit if self.food_item else 'kg',
            'record_date': self.record_date.isoformat() if isinstance(self.record_date, (date, datetime)) else str(self.record_date),
            'meal_period': self.meal_period,
            'quantity_prepared': round(float(self.quantity_prepared), 2),
            'quantity_consumed': round(float(self.quantity_consumed), 2),
            'surplus_quantity': round(float(self.surplus_quantity), 2),
            'discarded_quantity': round(float(self.discarded_quantity), 2),
            'unit_cost': round(float(self.unit_cost), 2),
            'waste_cost': self.waste_cost,
            'surplus_cost': self.surplus_cost,
            'waste_percentage': self.waste_percentage,
            'waste_reason': self.waste_reason,
            'notes': self.notes,
            'is_demo': self.is_demo,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
