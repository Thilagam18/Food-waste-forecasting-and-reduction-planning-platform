import io
import csv
from datetime import datetime, date, timedelta
from flask import Blueprint, request, jsonify, Response
from backend.utils.auth import org_required
from backend.models.daily_food_record import DailyFoodRecord
from backend.models.food_item import FoodItem

reports_bp = Blueprint('reports', __name__, url_prefix='/api/reports')

@reports_bp.route('/summary', methods=['GET'])
@org_required
def get_reports_summary(current_user):
    start_date_str = request.args.get('start_date', '').strip()
    end_date_str = request.args.get('end_date', '').strip()
    category = request.args.get('category', '').strip()
    meal_period = request.args.get('meal_period', '').strip()

    today = date.today()
    if start_date_str:
        try:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        except ValueError:
            start_date = today - timedelta(days=30)
    else:
        start_date = today - timedelta(days=30)

    if end_date_str:
        try:
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
        except ValueError:
            end_date = today
    else:
        end_date = today

    query = DailyFoodRecord.query.join(FoodItem).filter(
        DailyFoodRecord.organization_id == current_user.organization_id,
        DailyFoodRecord.record_date >= start_date,
        DailyFoodRecord.record_date <= end_date
    )

    if category:
        query = query.filter(FoodItem.category == category)
    if meal_period:
        query = query.filter(DailyFoodRecord.meal_period == meal_period)

    records = query.order_by(DailyFoodRecord.record_date.desc()).all()

    total_prep = sum(r.quantity_prepared for r in records)
    total_consumed = sum(r.quantity_consumed for r in records)
    total_waste = sum(r.discarded_quantity for r in records)
    total_surplus = sum(r.surplus_quantity for r in records)
    total_cost = sum(r.waste_cost for r in records)
    waste_pct = round((total_waste / total_prep * 100), 1) if total_prep > 0 else 0.0

    # Group by category
    cat_summary = {}
    for r in records:
        c = r.food_item.category if r.food_item else 'General'
        if c not in cat_summary:
            cat_summary[c] = {'category': c, 'prepared': 0.0, 'consumed': 0.0, 'waste': 0.0, 'cost': 0.0}
        cat_summary[c]['prepared'] += r.quantity_prepared
        cat_summary[c]['consumed'] += r.quantity_consumed
        cat_summary[c]['waste'] += r.discarded_quantity
        cat_summary[c]['cost'] += r.waste_cost

    for c in cat_summary.values():
        c['prepared'] = round(c['prepared'], 1)
        c['consumed'] = round(c['consumed'], 1)
        c['waste'] = round(c['waste'], 1)
        c['cost'] = round(c['cost'], 2)
        c['waste_pct'] = round((c['waste'] / c['prepared'] * 100), 1) if c['prepared'] > 0 else 0.0

    # Group by meal period
    meal_summary = {}
    for r in records:
        m = r.meal_period
        if m not in meal_summary:
            meal_summary[m] = {'meal_period': m, 'prepared': 0.0, 'consumed': 0.0, 'waste': 0.0, 'cost': 0.0}
        meal_summary[m]['prepared'] += r.quantity_prepared
        meal_summary[m]['consumed'] += r.quantity_consumed
        meal_summary[m]['waste'] += r.discarded_quantity
        meal_summary[m]['cost'] += r.waste_cost

    for m in meal_summary.values():
        m['prepared'] = round(m['prepared'], 1)
        m['consumed'] = round(m['consumed'], 1)
        m['waste'] = round(m['waste'], 1)
        m['cost'] = round(m['cost'], 2)
        m['waste_pct'] = round((m['waste'] / m['prepared'] * 100), 1) if m['prepared'] > 0 else 0.0

    return jsonify({
        'success': True,
        'filter': {
            'start_date': str(start_date),
            'end_date': str(end_date),
            'category': category or 'All',
            'meal_period': meal_period or 'All'
        },
        'totals': {
            'records_count': len(records),
            'total_prepared_kg': round(total_prep, 1),
            'total_consumed_kg': round(total_consumed, 1),
            'total_waste_kg': round(total_waste, 1),
            'total_surplus_kg': round(total_surplus, 1),
            'total_cost': round(total_cost, 2),
            'waste_percentage': waste_pct
        },
        'category_breakdown': list(cat_summary.values()),
        'meal_period_breakdown': list(meal_summary.values()),
        'records': [r.to_dict() for r in records[:100]]  # First 100 preview
    }), 200

@reports_bp.route('/export-csv', methods=['GET'])
@org_required
def export_csv(current_user):
    start_date_str = request.args.get('start_date', '').strip()
    end_date_str = request.args.get('end_date', '').strip()

    query = DailyFoodRecord.query.join(FoodItem).filter(
        DailyFoodRecord.organization_id == current_user.organization_id
    )

    if start_date_str:
        try:
            query = query.filter(DailyFoodRecord.record_date >= datetime.strptime(start_date_str, '%Y-%m-%d').date())
        except ValueError:
            pass

    if end_date_str:
        try:
            query = query.filter(DailyFoodRecord.record_date <= datetime.strptime(end_date_str, '%Y-%m-%d').date())
        except ValueError:
            pass

    records = query.order_by(DailyFoodRecord.record_date.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)

    # Headers
    writer.writerow([
        'Record ID', 'Date', 'Food Item', 'Category', 'Meal Period',
        'Quantity Prepared', 'Quantity Consumed', 'Surplus Quantity',
        'Discarded Waste', 'Unit', 'Unit Cost', 'Waste Cost ($)',
        'Waste Reason', 'Notes'
    ])

    for r in records:
        writer.writerow([
            r.id,
            r.record_date.isoformat(),
            r.food_item.name if r.food_item else 'Unknown',
            r.food_item.category if r.food_item else '',
            r.meal_period,
            r.quantity_prepared,
            r.quantity_consumed,
            r.surplus_quantity,
            r.discarded_quantity,
            r.food_item.unit if r.food_item else 'kg',
            r.unit_cost,
            r.waste_cost,
            r.waste_reason,
            r.notes or ''
        ])

    csv_data = output.getvalue()
    output.close()

    filename = f"food_waste_report_{current_user.organization.name.lower().replace(' ', '_')}_{date.today().isoformat()}.csv"

    return Response(
        csv_data,
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
