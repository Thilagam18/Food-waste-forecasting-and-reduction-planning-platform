import random
from datetime import date, timedelta
from backend.extensions import db
from backend.models.food_item import FoodItem
from backend.models.daily_food_record import DailyFoodRecord
from backend.models.recommendation import Recommendation
from backend.models.alert import Alert
from backend.models.forecast_result import ForecastResult
from backend.models.intervention_outcome import InterventionOutcome
from backend.forecasting.engine import DemandForecastingEngine
from backend.recommendations.engine import RecommendationEngine

DEMO_FOOD_ITEMS = [
    {
        'name': 'Grilled Chicken Breast',
        'category': 'Meat & Poultry',
        'unit': 'kg',
        'default_unit_cost': 8.50,
        'shelf_life_days': 2,
        'storage_condition': 'Refrigerated',
        'typical_prep': 24.0,
        'meal_periods': ['Lunch', 'Dinner']
    },
    {
        'name': 'Steamed Basmati Rice',
        'category': 'Grains & Staples',
        'unit': 'kg',
        'default_unit_cost': 1.80,
        'shelf_life_days': 2,
        'storage_condition': 'Refrigerated',
        'typical_prep': 35.0,
        'meal_periods': ['Lunch', 'Dinner']
    },
    {
        'name': 'Garden Fresh Vegetable Salad',
        'category': 'Produce & Salads',
        'unit': 'kg',
        'default_unit_cost': 4.20,
        'shelf_life_days': 1,
        'storage_condition': 'Refrigerated',
        'typical_prep': 14.0,
        'meal_periods': ['Lunch', 'Dinner']
    },
    {
        'name': 'Artisan Sourdough Loaf',
        'category': 'Bakery & Bread',
        'unit': 'portions',
        'default_unit_cost': 2.50,
        'shelf_life_days': 1,
        'storage_condition': 'Ambient',
        'typical_prep': 30.0,
        'meal_periods': ['Breakfast', 'Lunch']
    },
    {
        'name': 'Vegetable Lasagna (Tray)',
        'category': 'Cooked Meals',
        'unit': 'portions',
        'default_unit_cost': 6.00,
        'shelf_life_days': 3,
        'storage_condition': 'Refrigerated',
        'typical_prep': 28.0,
        'meal_periods': ['Lunch', 'Dinner']
    },
    {
        'name': 'Scrambled Farm Eggs',
        'category': 'Dairy & Desserts',
        'unit': 'kg',
        'default_unit_cost': 3.90,
        'shelf_life_days': 1,
        'storage_condition': 'Refrigerated',
        'typical_prep': 18.0,
        'meal_periods': ['Breakfast']
    },
    {
        'name': 'Lentil Dal & Curries',
        'category': 'Cooked Meals',
        'unit': 'kg',
        'default_unit_cost': 2.80,
        'shelf_life_days': 2,
        'storage_condition': 'Refrigerated',
        'typical_prep': 20.0,
        'meal_periods': ['Lunch', 'Dinner']
    },
    {
        'name': 'Vanilla Greek Yogurt Parfait',
        'category': 'Dairy & Desserts',
        'unit': 'portions',
        'default_unit_cost': 3.20,
        'shelf_life_days': 2,
        'storage_condition': 'Refrigerated',
        'typical_prep': 25.0,
        'meal_periods': ['Breakfast', 'Snacks']
    }
]

def load_demo_dataset(organization_id: int) -> dict:
    """
    Seeds 30 days of realistic, chronological historical data flagged with is_demo=True.
    """
    random.seed(42)  # Deterministic seed for reproducible testing
    today = date.today()

    # 1. Create or retrieve demo food items
    item_objects = []
    for item_spec in DEMO_FOOD_ITEMS:
        item = db.session.query(FoodItem).filter_by(
            organization_id=organization_id,
            name=item_spec['name']
        ).first()
        if not item:
            item = FoodItem(
                organization_id=organization_id,
                name=item_spec['name'],
                category=item_spec['category'],
                unit=item_spec['unit'],
                default_unit_cost=item_spec['default_unit_cost'],
                shelf_life_days=item_spec['shelf_life_days'],
                storage_condition=item_spec['storage_condition'],
                is_active=True
            )
            db.session.add(item)
            db.session.flush()
        item_objects.append((item, item_spec))

    # 2. Generate 30 days of daily food records
    created_records = 0
    start_date = today - timedelta(days=29)

    for day_idx in range(30):
        current_date = start_date + timedelta(days=day_idx)
        dow = current_date.weekday()
        weekend_mult = 1.25 if dow in [5, 6] else 1.0  # Weekend surge

        for item, spec in item_objects:
            for mp in spec['meal_periods']:
                # Base preparation with slight realistic variation
                base_prep = spec['typical_prep'] * weekend_mult
                noise = random.uniform(-0.15, 0.15)
                prep_qty = round(max(5.0, base_prep * (1.0 + noise)), 1)

                # Realistic consumption rate: usually 78% to 92% of prep
                # Simulate overproduction on specific items to trigger realistic recommendations
                if 'Basmati Rice' in item.name or 'Artisan Sourdough' in item.name:
                    consumption_ratio = random.uniform(0.72, 0.82)  # Recurring overproduction
                elif 'Chicken' in item.name:
                    consumption_ratio = random.uniform(0.85, 0.95)
                else:
                    consumption_ratio = random.uniform(0.80, 0.90)

                consumed_qty = round(prep_qty * consumption_ratio, 1)
                surplus_qty = round(max(0.0, prep_qty - consumed_qty), 1)

                # Discarded distribution: some surplus is composted/discarded, some stored
                # Spoilage occurs occasionally
                waste_reason = 'None'
                discarded_qty = 0.0

                if surplus_qty > 0:
                    if 'Salad' in item.name or 'Sourdough' in item.name:
                        # Short shelf life = high discard of surplus
                        discarded_qty = surplus_qty
                        waste_reason = 'Expiry' if random.random() > 0.5 else 'Overproduction'
                    elif 'Basmati Rice' in item.name:
                        discarded_qty = round(surplus_qty * 0.7, 1)
                        waste_reason = 'Overproduction'
                    else:
                        discarded_qty = round(surplus_qty * random.uniform(0.3, 0.7), 1)
                        waste_reason = random.choice(['Overproduction', 'Plate Waste', 'Low Demand'])

                # Enforce non-negative
                discarded_qty = max(0.0, min(discarded_qty, surplus_qty))

                # Check if record already exists for this date, item, and meal period
                existing_record = db.session.query(DailyFoodRecord).filter_by(
                    organization_id=organization_id,
                    food_item_id=item.id,
                    record_date=current_date,
                    meal_period=mp
                ).first()

                if not existing_record:
                    record = DailyFoodRecord(
                        organization_id=organization_id,
                        food_item_id=item.id,
                        record_date=current_date,
                        meal_period=mp,
                        quantity_prepared=prep_qty,
                        quantity_consumed=consumed_qty,
                        surplus_quantity=surplus_qty,
                        discarded_quantity=discarded_qty,
                        unit_cost=item.default_unit_cost,
                        waste_reason=waste_reason,
                        notes="[DEMO RECORD] Generated for system verification and training demonstration.",
                        is_demo=True
                    )
                    db.session.add(record)
                    created_records += 1

    # 3. Create Sample Intervention Outcomes to demonstrate impact tracking
    sample_interventions = [
        {
            'action_taken': 'Adjusted Sourdough batch bake size down by 6 portions for morning service',
            'days_ago': 12,
            'food_saved_kg': 18.0,
            'cost_saved': 45.0,
            'notes': 'Portion bake reduction successfully reduced end-of-day bread discards.'
        },
        {
            'action_taken': 'Established dynamic rice cook schedule: smaller half-batches cooked at 12:30 PM',
            'days_ago': 6,
            'food_saved_kg': 26.5,
            'cost_saved': 47.7,
            'notes': 'Kitchen team implemented secondary batch cooking instead of single 35kg morning batch.'
        },
        {
            'action_taken': 'Partnered with local shelter for safe cold-chain surplus donation verification',
            'days_ago': 2,
            'food_saved_kg': 15.0,
            'cost_saved': 90.0,
            'notes': 'Packaged safe unserved lasagna and chicken following temperature safety audit.'
        }
    ]

    for si in sample_interventions:
        rec_date = today - timedelta(days=si['days_ago'])
        exists = db.session.query(InterventionOutcome).filter_by(
            organization_id=organization_id,
            action_taken=si['action_taken']
        ).first()
        if not exists:
            intervention = InterventionOutcome(
                organization_id=organization_id,
                action_taken=si['action_taken'],
                recorded_date=rec_date,
                food_saved_kg=si['food_saved_kg'],
                cost_saved=si['cost_saved'],
                staff_notes=si['notes']
            )
            db.session.add(intervention)

    # 4. Create sample initial alerts
    if item_objects:
        salad_item = item_objects[2][0]
        alert_exists = db.session.query(Alert).filter_by(
            organization_id=organization_id,
            food_item_id=salad_item.id,
            is_resolved=False
        ).first()
        if not alert_exists:
            alert = Alert(
                organization_id=organization_id,
                food_item_id=salad_item.id,
                alert_type='Expiry Warning',
                severity='Warning',
                message=f"Fresh vegetable salad batches nearing 24h shelf-life limit under refrigeration.",
                suggested_action="Prioritize serving for active lunch rush or convert dressed greens before 4:00 PM."
            )
            db.session.add(alert)

    db.session.commit()

    # 5. Automatically trigger Forecasting Engine and Recommendations Engine
    forecasting_engine = DemandForecastingEngine(organization_id)
    forecasting_engine.train_and_forecast_all(horizon_days=7)

    recommendation_engine = RecommendationEngine(organization_id)
    recommendation_engine.generate_recommendations()

    return {
        'success': True,
        'message': f"Demonstration dataset loaded: {created_records} daily food records, ML forecasts, and recommendations generated.",
        'records_created': created_records,
        'is_demo': True
    }

def clear_demo_dataset(organization_id: int) -> dict:
    """
    Cleanly purges all demonstration records, returning the organization to pristine clean state.
    """
    deleted_records = db.session.query(DailyFoodRecord).filter_by(
        organization_id=organization_id,
        is_demo=True
    ).delete()

    # Clear forecasts and recommendations generated from demo data
    db.session.query(ForecastResult).filter_by(organization_id=organization_id).delete()
    db.session.query(Recommendation).filter_by(organization_id=organization_id).delete()
    db.session.query(Alert).filter_by(organization_id=organization_id).delete()
    db.session.query(InterventionOutcome).filter_by(organization_id=organization_id).delete()

    db.session.commit()

    return {
        'success': True,
        'message': f"Cleaned up {deleted_records} demonstration records. Platform returned to empty state.",
        'records_removed': deleted_records
    }
