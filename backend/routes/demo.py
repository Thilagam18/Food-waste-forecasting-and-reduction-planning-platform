from flask import Blueprint, jsonify
from backend.utils.auth import org_required
from backend.services.demo_data import load_demo_dataset, clear_demo_dataset

demo_bp = Blueprint('demo', __name__, url_prefix='/api/demo')

@demo_bp.route('/load', methods=['POST'])
@org_required
def load_demo(current_user):
    result = load_demo_dataset(current_user.organization_id)
    return jsonify(result), 200

@demo_bp.route('/clear', methods=['POST'])
@org_required
def clear_demo(current_user):
    result = clear_demo_dataset(current_user.organization_id)
    return jsonify(result), 200
