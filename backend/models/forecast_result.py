from datetime import datetime, date
from backend.extensions import db

class ForecastResult(db.Model):
    __tablename__ = 'forecast_results'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    organization_id = db.Column(db.Integer, db.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False, index=True)
    food_item_id = db.Column(db.Integer, db.ForeignKey('food_items.id', ondelete='CASCADE'), nullable=False, index=True)
    target_date = db.Column(db.Date, nullable=False, index=True)
    meal_period = db.Column(db.String(30), nullable=False, default='Lunch')
    
    predicted_demand = db.Column(db.Float, nullable=False)
    expected_surplus = db.Column(db.Float, nullable=False, default=0.0)
    recommended_prep = db.Column(db.Float, nullable=False)
    lower_bound = db.Column(db.Float, nullable=True)
    upper_bound = db.Column(db.Float, nullable=True)
    
    model_type = db.Column(db.String(60), nullable=False, default='RandomForestRegressor')
    mae = db.Column(db.Float, nullable=True)
    rmse = db.Column(db.Float, nullable=True)
    confidence_level = db.Column(db.Float, nullable=False, default=0.90)
    is_baseline = db.Column(db.Boolean, nullable=False, default=False)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'organization_id': self.organization_id,
            'food_item_id': self.food_item_id,
            'food_item_name': self.food_item.name if self.food_item else 'Unknown',
            'category': self.food_item.category if self.food_item else 'General',
            'unit': self.food_item.unit if self.food_item else 'kg',
            'target_date': self.target_date.isoformat() if isinstance(self.target_date, (date, datetime)) else str(self.target_date),
            'meal_period': self.meal_period,
            'predicted_demand': round(float(self.predicted_demand), 2),
            'expected_surplus': round(float(self.expected_surplus), 2),
            'recommended_prep': round(float(self.recommended_prep), 2),
            'lower_bound': round(float(self.lower_bound), 2) if self.lower_bound is not None else None,
            'upper_bound': round(float(self.upper_bound), 2) if self.upper_bound is not None else None,
            'model_type': self.model_type,
            'mae': round(float(self.mae), 3) if self.mae is not None else None,
            'rmse': round(float(self.rmse), 3) if self.rmse is not None else None,
            'confidence_level': round(float(self.confidence_level), 2),
            'is_baseline': self.is_baseline,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
