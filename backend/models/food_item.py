from datetime import datetime
from backend.extensions import db

class FoodItem(db.Model):
    __tablename__ = 'food_items'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    organization_id = db.Column(db.Integer, db.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False, index=True)
    name = db.Column(db.String(120), nullable=False)
    category = db.Column(db.String(50), nullable=False, default='Cooked Meals')  
    # Categories: 'Cooked Meals', 'Bakery & Bread', 'Produce & Salads', 'Meat & Poultry', 'Dairy & Desserts', 'Grains & Staples', 'Beverages', 'Other'
    unit = db.Column(db.String(20), nullable=False, default='kg')  # 'kg', 'portions', 'liters'
    default_unit_cost = db.Column(db.Float, nullable=False, default=0.0)
    shelf_life_days = db.Column(db.Integer, nullable=False, default=2)
    storage_condition = db.Column(db.String(50), nullable=False, default='Refrigerated')  # 'Ambient', 'Refrigerated', 'Frozen'
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    records = db.relationship('DailyFoodRecord', backref='food_item', lazy=True, cascade='all, delete-orphan')
    forecasts = db.relationship('ForecastResult', backref='food_item', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'organization_id': self.organization_id,
            'name': self.name,
            'category': self.category,
            'unit': self.unit,
            'default_unit_cost': round(float(self.default_unit_cost), 2),
            'shelf_life_days': self.shelf_life_days,
            'storage_condition': self.storage_condition,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
