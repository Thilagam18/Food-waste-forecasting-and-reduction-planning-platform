from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from backend.models.user import User

def role_required(*allowed_roles):
    """
    Reusable decorator for role-based authorization.
    Usage: @role_required('PATIENT') or @role_required('DOCTOR', 'HOSPITAL_ADMIN')
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            user_id = int(get_jwt_identity())
            user = User.query.get(user_id)
            if not user:
                return jsonify({'success': False, 'message': 'Authenticated user no longer exists.'}), 401

            if user.role not in allowed_roles:
                return jsonify({
                    'success': False,
                    'message': f'Forbidden: Role [{user.role}] is not authorized for this resource. Required role(s): {list(allowed_roles)}'
                }), 403

            return fn(*args, **kwargs)
        return wrapper
    return decorator
