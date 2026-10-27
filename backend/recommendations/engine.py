from datetime import date, timedelta
from sqlalchemy import func
from backend.extensions import db
from backend.models.daily_food_record import DailyFoodRecord
from backend.models.food_item import FoodItem
from backend.models.recommendation import Recommendation

class RecommendationEngine:
    def __init__(self, organization_id: int):
        self.organization_id = organization_id

    def generate_recommendations(self) -> list:
        """
        Analyzes historical logs and forecasts to generate distinct, actionable recommendations.
        """
        today = date.today()
        two_weeks_ago = today - timedelta(days=14)

        # Retrieve records over the last 14 days
        records = db.session.query(DailyFoodRecord).filter(
            DailyFoodRecord.organization_id == self.organization_id,
            DailyFoodRecord.record_date >= two_weeks_ago
        ).all()

        if not records:
            return []

        # Existing pending or in-progress recommendations to avoid duplicates
        existing_recs = db.session.query(Recommendation).filter(
            Recommendation.organization_id == self.organization_id,
            Recommendation.status.in_(['Pending', 'In Progress'])
        ).all()
        existing_titles = {r.title for r in existing_recs}

        new_recommendations = []

        # Group records by food item
        item_groups = {}
        for r in records:
            item_groups.setdefault(r.food_item_id, []).append(r)

        for food_item_id, item_records in item_groups.items():
            item = db.session.get(FoodItem, food_item_id)
            if not item:
                continue

            total_prepared = sum(r.quantity_prepared for r in item_records)
            total_consumed = sum(r.quantity_consumed for r in item_records)
            total_surplus = sum(r.surplus_quantity for r in item_records)
            total_discarded = sum(r.discarded_quantity for r in item_records)
            rec_count = len(item_records)

            avg_unit_cost = sum(r.unit_cost for r in item_records) / rec_count if rec_count > 0 else item.default_unit_cost

            # 1. Repeated Overproduction Check
            # Surplus > 18% of prepared over at least 5 logs
            if total_prepared > 0 and (total_surplus / total_prepared) >= 0.18 and rec_count >= 4:
                overprod_kg_daily = (total_surplus / rec_count)
                potential_savings = round(overprod_kg_daily * avg_unit_cost * 7, 2)  # Weekly potential
                potential_kg = round(overprod_kg_daily * 0.75 * 7, 2)  # 75% reduction in overproduction
                title = f"Curtail Overproduction: {item.name}"

                if title not in existing_titles:
                    rec = Recommendation(
                        organization_id=self.organization_id,
                        food_item_id=item.id,
                        title=title,
                        category='Preparation',
                        recommendation_text=(
                            f"Reduce daily batch preparation of '{item.name}' by {round(overprod_kg_daily * 0.75, 1)} {item.unit}. "
                            f"Shift from single large morning/afternoon batches to staggered smaller batches."
                        ),
                        reason=(
                            f"Over the last 14 days, '{item.name}' averaged a {round((total_surplus / total_prepared) * 100, 1)}% surplus rate, "
                            f"generating {round(total_surplus, 1)} {item.unit} total surplus."
                        ),
                        supporting_data=f"Total Prepared: {round(total_prepared, 1)} {item.unit} | Total Consumed: {round(total_consumed, 1)} {item.unit} | Overproduction Surplus: {round(total_surplus, 1)} {item.unit}.",
                        potential_savings_cost=potential_savings,
                        potential_waste_reduction_kg=potential_kg,
                        priority='High' if potential_savings > 200 else 'Medium',
                        status='Pending',
                        date_generated=today
                    )
                    db.session.add(rec)
                    new_recommendations.append(rec)
                    existing_titles.add(title)

            # 2. Spoilage / Expiry Root-Cause Check
            spoilage_records = [r for r in item_records if r.waste_reason in ['Spoilage', 'Expiry']]
            spoilage_kg = sum(r.discarded_quantity for r in spoilage_records)
            if spoilage_kg >= 5.0 or (total_prepared > 0 and (spoilage_kg / total_prepared) >= 0.10):
                title = f"Audit Storage & Expiry: {item.name}"
                if title not in existing_titles:
                    rec = Recommendation(
                        organization_id=self.organization_id,
                        food_item_id=item.id,
                        title=title,
                        category='Storage',
                        recommendation_text=(
                            f"Conduct cold-chain temperature verification and transition to strict FIFO (First-In, First-Out) stock rotation for '{item.name}'. "
                            f"Consider lowering purchase batch quantities or ordering more frequently."
                        ),
                        reason=(
                            f"Frequent discards attributed to spoilage or shelf-life expiry ({round(spoilage_kg, 1)} {item.unit} discarded). "
                            f"Current shelf life setting is {item.shelf_life_days} days under {item.storage_condition} storage."
                        ),
                        supporting_data=f"Spoilage Discards: {round(spoilage_kg, 1)} {item.unit} across {len(spoilage_records)} recorded incidents.",
                        potential_savings_cost=round(spoilage_kg * avg_unit_cost, 2),
                        potential_waste_reduction_kg=round(spoilage_kg * 0.8, 2),
                        priority='High',
                        status='Pending',
                        date_generated=today
                    )
                    db.session.add(rec)
                    new_recommendations.append(rec)
                    existing_titles.add(title)

            # 3. Plate Waste & Portion Sizing Check
            plate_waste_records = [r for r in item_records if r.waste_reason == 'Plate Waste']
            plate_waste_kg = sum(r.discarded_quantity for r in plate_waste_records)
            if plate_waste_kg >= 6.0 and len(plate_waste_records) >= 3:
                title = f"Portion Sizing Calibration: {item.name}"
                if title not in existing_titles:
                    rec = Recommendation(
                        organization_id=self.organization_id,
                        food_item_id=item.id,
                        title=title,
                        category='Portioning',
                        recommendation_text=(
                            f"Evaluate decreasing standard portion serving size for '{item.name}' by 10-15% while offering free refills upon request. "
                            f"Plate-waste metrics indicate customer over-serving rather than kitchen over-prep."
                        ),
                        reason=(
                            f"{round(plate_waste_kg, 1)} {item.unit} was discarded post-service as unconsumed customer plate waste over {len(plate_waste_records)} events."
                        ),
                        supporting_data=f"Plate Waste Total: {round(plate_waste_kg, 1)} {item.unit} | Avg Daily Plate Waste: {round(plate_waste_kg / len(plate_waste_records), 2)} {item.unit}.",
                        potential_savings_cost=round(plate_waste_kg * avg_unit_cost * 0.7, 2),
                        potential_waste_reduction_kg=round(plate_waste_kg * 0.7, 2),
                        priority='Medium',
                        status='Pending',
                        date_generated=today
                    )
                    db.session.add(rec)
                    new_recommendations.append(rec)
                    existing_titles.add(title)

            # 4. Underproduction / Stockout Risk
            zero_surplus_records = [r for r in item_records if r.quantity_prepared > 0 and r.surplus_quantity == 0 and r.quantity_consumed >= r.quantity_prepared]
            if len(zero_surplus_records) >= 4 and len(zero_surplus_records) / rec_count >= 0.6:
                title = f"Demand Capacity Warning: {item.name}"
                if title not in existing_titles:
                    rec = Recommendation(
                        organization_id=self.organization_id,
                        food_item_id=item.id,
                        title=title,
                        category='Preparation',
                        recommendation_text=(
                            f"Increase preparation volume for '{item.name}' by 5-10%. Demand consistently exhausts supply before service conclusion, indicating stockout and unmet diner demand."
                        ),
                        reason=f"Recorded 100% consumption with zero surplus in {len(zero_surplus_records)} out of {rec_count} meal periods.",
                        supporting_data=f"Full depletion observed on {len(zero_surplus_records)} service dates.",
                        potential_savings_cost=0.0,
                        potential_waste_reduction_kg=0.0,
                        priority='Low',
                        status='Pending',
                        date_generated=today
                    )
                    db.session.add(rec)
                    new_recommendations.append(rec)
                    existing_titles.add(title)

        # 5. Food Rescue & Safe Surplus Redistribution Opportunity (Today's safe surplus)
        today_records = [r for r in records if r.record_date == today and r.surplus_quantity > 1.5]
        for tr in today_records:
            item = db.session.get(FoodItem, tr.food_item_id)
            if not item:
                continue
            # Only suitable categories: Bakery, Cooked Meals (if hot-held/chilled properly)
            if item.category in ['Bakery & Bread', 'Cooked Meals', 'Grains & Staples']:
                title = f"Safe Surplus Redistribution: {item.name} ({tr.meal_period})"
                if title not in existing_titles:
                    rec = Recommendation(
                        organization_id=self.organization_id,
                        food_item_id=item.id,
                        title=title,
                        category='Donation',
                        recommendation_text=(
                            f"Coordinate surplus food redistribution for {round(tr.surplus_quantity, 1)} {item.unit} of '{item.name}' from {tr.meal_period}. "
                            f"IMPORTANT FOOD SAFETY REQUIREMENT: Kitchen staff must verify food temperature (>=60°C hot holding or <=4°C chilled), "
                            f"confirm maximum 2-hour holding window, inspect visual/sensory hygiene, and log container timestamp before dispatch to donation partners."
                        ),
                        reason=(
                            f"Safe, unserved surplus of {round(tr.surplus_quantity, 1)} {item.unit} logged today. "
                            f"Eligible for immediate redistribution to local community food rescue partners under food safety guidelines."
                        ),
                        supporting_data=f"Today's surplus: {round(tr.surplus_quantity, 1)} {item.unit} | Meal Period: {tr.meal_period}.",
                        potential_savings_cost=round(tr.surplus_quantity * tr.unit_cost, 2),
                        potential_waste_reduction_kg=round(tr.surplus_quantity, 2),
                        priority='High',
                        status='Pending',
                        date_generated=today
                    )
                    db.session.add(rec)
                    new_recommendations.append(rec)
                    existing_titles.add(title)

        db.session.commit()
        return new_recommendations
