from flask import Blueprint, request, jsonify
from backend.extensions import db
from backend.utils.auth import org_required
from backend.models.food_item import FoodItem

food_items_bp = Blueprint('food_items', __name__, url_prefix='/api/food-items')

@food_items_bp.route('', methods=['GET'])
@org_required
def list_food_items(current_user):
    category = request.args.get('category', '').strip()
    search = request.args.get('search', '').strip().lower()
    is_active = request.args.get('is_active', type=str)

    query = FoodItem.query.filter_by(organization_id=current_user.organization_id)

    if category:
        query = query.filter(FoodItem.category == category)
    if search:
        query = query.filter(FoodItem.name.ilike(f'%{search}%'))
    if is_active is not None and is_active != '':
        active_bool = is_active.lower() in ['true', '1']
        query = query.filter(FoodItem.is_active == active_bool)

    items = query.order_by(FoodItem.name.asc()).all()
    return jsonify({
        'success': True,
        'count': len(items),
        'data': [item.to_dict() for item in items]
    }), 200

@food_items_bp.route('', methods=['POST'])
@org_required
def create_food_item(current_user):
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    category = data.get('category', 'Cooked Meals').strip()
    unit = data.get('unit', 'kg').strip()
    default_unit_cost = data.get('default_unit_cost', 0.0)
    shelf_life_days = data.get('shelf_life_days', 2)
    storage_condition = data.get('storage_condition', 'Refrigerated').strip()

    if not name:
        return jsonify({'success': False, 'message': 'Food item name is required.'}), 400

    try:
        unit_cost = float(default_unit_cost)
        shelf_life = int(shelf_life_days)
        if unit_cost < 0 or shelf_life < 0:
            return jsonify({'success': False, 'message': 'Cost and shelf life cannot be negative.'}), 400
    except (ValueError, TypeError):
        return jsonify({'success': False, 'message': 'Invalid numeric values for cost or shelf life.'}), 400

    # Prevent duplicate name in same organization
    duplicate = FoodItem.query.filter_by(
        organization_id=current_user.organization_id,
        name=name
    ).first()
    if duplicate:
        return jsonify({'success': False, 'message': f'Food item "{name}" already exists in your inventory.'}), 409

    item = FoodItem(
        organization_id=current_user.organization_id,
        name=name,
        category=category,
        unit=unit,
        default_unit_cost=unit_cost,
        shelf_life_days=shelf_life,
        storage_condition=storage_condition,
        is_active=True
    )
    db.session.add(item)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': f'Food item "{name}" created successfully.',
        'data': item.to_dict()
    }), 201

@food_items_bp.route('/<int:item_id>', methods=['PUT'])
@org_required
def update_food_item(current_user, item_id):
    item = FoodItem.query.filter_by(
        id=item_id,
        organization_id=current_user.organization_id
    ).first()
    if not item:
        return jsonify({'success': False, 'message': 'Food item not found.'}), 404

    data = request.get_json() or {}
    if 'name' in data and data['name'].strip():
        item.name = data['name'].strip()
    if 'category' in data:
        item.category = data['category'].strip()
    if 'unit' in data:
        item.unit = data['unit'].strip()
    if 'default_unit_cost' in data:
        try:
            val = float(data['default_unit_cost'])
            if val >= 0:
                item.default_unit_cost = val
        except (ValueError, TypeError):
            pass
    if 'shelf_life_days' in data:
        try:
            val = int(data['shelf_life_days'])
            if val >= 0:
                item.shelf_life_days = val
        except (ValueError, TypeError):
            pass
    if 'storage_condition' in data:
        item.storage_condition = data['storage_condition'].strip()
    if 'is_active' in data:
        item.is_active = bool(data['is_active'])

    db.session.commit()
    return jsonify({
        'success': True,
        'message': f'Food item "{item.name}" updated successfully.',
        'data': item.to_dict()
    }), 200

@food_items_bp.route('/<int:item_id>', methods=['DELETE'])
@org_required
def delete_food_item(current_user, item_id):
    item = FoodItem.query.filter_by(
        id=item_id,
        organization_id=current_user.organization_id
    ).first()
    if not item:
        return jsonify({'success': False, 'message': 'Food item not found.'}), 404

    db.session.delete(item)
    db.session.commit()
    return jsonify({'success': True, 'message': f'Food item "{item.name}" deleted successfully.'}), 200
