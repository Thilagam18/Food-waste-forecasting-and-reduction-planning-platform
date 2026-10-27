from datetime import datetime, date
from flask import Blueprint, request, jsonify
from backend.extensions import db
from backend.utils.auth import org_required
from backend.models.daily_food_record import DailyFoodRecord
from backend.models.food_item import FoodItem

food_logs_bp = Blueprint('food_logs', __name__, url_prefix='/api/food-logs')

@food_logs_bp.route('', methods=['GET'])
@org_required
def list_food_logs(current_user):
    page = request.args.get('page', default=1, type=int)
    per_page = request.args.get('per_page', default=20, type=int)
    start_date_str = request.args.get('start_date', '').strip()
    end_date_str = request.args.get('end_date', '').strip()
    meal_period = request.args.get('meal_period', '').strip()
    category = request.args.get('category', '').strip()
    waste_reason = request.args.get('waste_reason', '').strip()
    food_item_id = request.args.get('food_item_id', type=int)
    search = request.args.get('search', '').strip().lower()

    query = DailyFoodRecord.query.join(FoodItem).filter(
        DailyFoodRecord.organization_id == current_user.organization_id
    )

    if start_date_str:
        try:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
            query = query.filter(DailyFoodRecord.record_date >= start_date)
        except ValueError:
            pass

    if end_date_str:
        try:
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
            query = query.filter(DailyFoodRecord.record_date <= end_date)
        except ValueError:
            pass

    if meal_period:
        query = query.filter(DailyFoodRecord.meal_period == meal_period)
    if category:
        query = query.filter(FoodItem.category == category)
    if waste_reason:
        query = query.filter(DailyFoodRecord.waste_reason == waste_reason)
    if food_item_id:
        query = query.filter(DailyFoodRecord.food_item_id == food_item_id)
    if search:
        query = query.filter(FoodItem.name.ilike(f'%{search}%'))

    query = query.order_by(DailyFoodRecord.record_date.desc(), DailyFoodRecord.id.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'success': True,
        'total': pagination.total,
        'page': pagination.page,
        'per_page': pagination.per_page,
        'pages': pagination.pages,
        'data': [r.to_dict() for r in pagination.items]
    }), 200

@food_logs_bp.route('', methods=['POST'])
@org_required
def create_food_log(current_user):
    data = request.get_json() or {}
    
    food_item_id = data.get('food_item_id')
    record_date_str = data.get('record_date', '').strip()
    meal_period = data.get('meal_period', 'Lunch').strip()
    prep_val = data.get('quantity_prepared')
    consumed_val = data.get('quantity_consumed')
    discarded_val = data.get('discarded_quantity', 0.0)
    surplus_val = data.get('surplus_quantity')
    unit_cost_val = data.get('unit_cost')
    waste_reason = data.get('waste_reason', 'None').strip()
    notes = data.get('notes', '').strip()

    if not food_item_id:
        return jsonify({'success': False, 'message': 'Food item selection is required.'}), 400

    item = FoodItem.query.filter_by(
        id=food_item_id,
        organization_id=current_user.organization_id
    ).first()
    if not item:
        return jsonify({'success': False, 'message': 'Selected food item does not exist or unauthorized.'}), 404

    try:
        record_date = datetime.strptime(record_date_str, '%Y-%m-%d').date() if record_date_str else date.today()
    except ValueError:
        return jsonify({'success': False, 'message': 'Invalid date format. Use YYYY-MM-DD.'}), 400

    try:
        qty_prepared = float(prep_val)
        qty_consumed = float(consumed_val)
        qty_discarded = float(discarded_val) if discarded_val is not None else 0.0
    except (ValueError, TypeError):
        return jsonify({'success': False, 'message': 'Quantities must be valid numbers.'}), 400

    # Business Validations
    if qty_prepared < 0 or qty_consumed < 0 or qty_discarded < 0:
        return jsonify({'success': False, 'message': 'Quantities cannot be negative.'}), 400

    if qty_consumed > qty_prepared:
        return jsonify({'success': False, 'message': 'Consumed quantity cannot exceed prepared quantity.'}), 400

    # Calculate or validate surplus
    calculated_surplus = max(0.0, round(qty_prepared - qty_consumed, 2))
    if surplus_val is not None:
        try:
            qty_surplus = max(0.0, float(surplus_val))
        except (ValueError, TypeError):
            qty_surplus = calculated_surplus
    else:
        qty_surplus = calculated_surplus

    if qty_discarded > qty_prepared:
        return jsonify({'success': False, 'message': 'Discarded waste quantity cannot exceed prepared quantity.'}), 400

    # Cost calculation
    if unit_cost_val is not None and str(unit_cost_val).strip() != '':
        try:
            unit_cost = max(0.0, float(unit_cost_val))
        except (ValueError, TypeError):
            unit_cost = item.default_unit_cost
    else:
        unit_cost = item.default_unit_cost

    valid_reasons = ['None', 'Overproduction', 'Low Demand', 'Spoilage', 'Expiry', 'Preparation Error', 'Plate Waste', 'Other']
    if waste_reason not in valid_reasons:
        waste_reason = 'Overproduction' if qty_discarded > 0 else 'None'

    record = DailyFoodRecord(
        organization_id=current_user.organization_id,
        food_item_id=item.id,
        record_date=record_date,
        meal_period=meal_period,
        quantity_prepared=round(qty_prepared, 2),
        quantity_consumed=round(qty_consumed, 2),
        surplus_quantity=round(qty_surplus, 2),
        discarded_quantity=round(qty_discarded, 2),
        unit_cost=round(unit_cost, 2),
        waste_reason=waste_reason,
        notes=notes,
        is_demo=False
    )
    db.session.add(record)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': f'Record for "{item.name}" logged successfully.',
        'data': record.to_dict()
    }), 201

@food_logs_bp.route('/<int:record_id>', methods=['PUT'])
@org_required
def update_food_log(current_user, record_id):
    record = DailyFoodRecord.query.filter_by(
        id=record_id,
        organization_id=current_user.organization_id
    ).first()
    if not record:
        return jsonify({'success': False, 'message': 'Food record not found.'}), 404

    data = request.get_json() or {}
    
    if 'quantity_prepared' in data:
        try:
            val = float(data['quantity_prepared'])
            if val >= 0:
                record.quantity_prepared = round(val, 2)
        except (ValueError, TypeError):
            pass

    if 'quantity_consumed' in data:
        try:
            val = float(data['quantity_consumed'])
            if val >= 0 and val <= record.quantity_prepared:
                record.quantity_consumed = round(val, 2)
                record.surplus_quantity = round(max(0.0, record.quantity_prepared - val), 2)
        except (ValueError, TypeError):
            pass

    if 'discarded_quantity' in data:
        try:
            val = float(data['discarded_quantity'])
            if val >= 0:
                record.discarded_quantity = round(val, 2)
        except (ValueError, TypeError):
            pass

    if 'unit_cost' in data:
        try:
            val = float(data['unit_cost'])
            if val >= 0:
                record.unit_cost = round(val, 2)
        except (ValueError, TypeError):
            pass

    if 'meal_period' in data:
        record.meal_period = data['meal_period'].strip()
    if 'waste_reason' in data:
        record.waste_reason = data['waste_reason'].strip()
    if 'notes' in data:
        record.notes = data['notes'].strip()

    db.session.commit()
    return jsonify({
        'success': True,
        'message': 'Food record updated successfully.',
        'data': record.to_dict()
    }), 200

@food_logs_bp.route('/<int:record_id>', methods=['DELETE'])
@org_required
def delete_food_log(current_user, record_id):
    record = DailyFoodRecord.query.filter_by(
        id=record_id,
        organization_id=current_user.organization_id
    ).first()
    if not record:
        return jsonify({'success': False, 'message': 'Food record not found.'}), 404

    db.session.delete(record)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Food record deleted successfully.'}), 200
