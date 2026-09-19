from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.extensions import db
from backend.models.user import User
from backend.models.pharmacy import Pharmacy, Medicine
from backend.models.prescription import Prescription

pharmacy_bp = Blueprint('pharmacy', __name__, url_prefix='/api/pharmacy')

@pharmacy_bp.route('/prescriptions', methods=['GET'])
@jwt_required()
def get_pharmacy_prescriptions():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if user.role not in ['PHARMACY', 'HOSPITAL_ADMIN']:
        return jsonify({'success': False, 'message': 'Access restricted to Pharmacy.'}), 403

    prescriptions = Prescription.query.order_by(Prescription.created_at.desc()).all()
    return jsonify({'success': True, 'prescriptions': [p.to_dict() for p in prescriptions]}), 200

@pharmacy_bp.route('/medicines', methods=['GET'])
def get_medicines():
    pharmacy_id = request.args.get('pharmacy_id', type=int)
    search_q = request.args.get('q', '').lower()

    query = Medicine.query
    if pharmacy_id:
        query = query.filter_by(pharmacy_id=pharmacy_id)
    if search_q:
        query = query.filter(Medicine.name.ilike(f'%{search_q}%'))

    medicines = query.all()
    return jsonify({'success': True, 'medicines': [m.to_dict() for m in medicines]}), 200

@pharmacy_bp.route('/medicines/<int:medicine_id>/availability', methods=['PUT'])
@jwt_required()
def toggle_medicine_availability(medicine_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if user.role not in ['PHARMACY', 'HOSPITAL_ADMIN']:
        return jsonify({'success': False, 'message': 'Unauthorized.'}), 403

    med = Medicine.query.get(medicine_id)
    if not med:
        return jsonify({'success': False, 'message': 'Medicine not found.'}), 404

    data = request.get_json() or {}
    if 'is_available' in data:
        med.is_available = data['is_available']
    if 'stock_quantity' in data:
        med.stock_quantity = data['stock_quantity']

    db.session.commit()
    return jsonify({'success': True, 'medicine': med.to_dict()}), 200
