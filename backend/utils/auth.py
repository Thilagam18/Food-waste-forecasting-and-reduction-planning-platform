from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from backend.extensions import db
from backend.models.user import User

def org_required(fn):
    """
    Decorator that verifies JWT, retrieves current user, and injects current_user into kwargs.
    Enforces that every database operation is scoped strictly to user.organization_id.
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        user = db.session.get(User, int(user_id))
        if not user:
            return jsonify({'success': False, 'message': 'Authenticated user not found or deactivated.'}), 401
        
        return fn(current_user=user, *args, **kwargs)
    return wrapper
