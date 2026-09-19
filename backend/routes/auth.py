import re
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from backend.extensions import db
from backend.models.user import User
from backend.models.patient import Patient
from backend.models.doctor import Doctor
from backend.models.pharmacy import Pharmacy
from backend.utils.auth import role_required

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

EMAIL_REGEX = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    name = data.get('name')
    email = data.get('email')
    phone = data.get('phone')
    password = data.get('password')
    role = data.get('role', 'PATIENT')  # PATIENT, DOCTOR, HOSPITAL_ADMIN, PHARMACY

    # Validation
    if not name or not email or not password or not phone:
        return jsonify({'success': False, 'message': 'Name, email, phone, and password are required.'}), 400

    if not re.match(EMAIL_REGEX, email):
        return jsonify({'success': False, 'message': 'Invalid email address format.'}), 400

    if len(password) < 6:
        return jsonify({'success': False, 'message': 'Password must be at least 6 characters long.'}), 400

    if role not in ['PATIENT', 'DOCTOR', 'HOSPITAL_ADMIN', 'PHARMACY']:
        return jsonify({'success': False, 'message': 'Invalid role. Must be PATIENT, DOCTOR, HOSPITAL_ADMIN, or PHARMACY.'}), 400

    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({'success': False, 'message': 'User with this email already exists.'}), 400

    user = User(
        name=name,
        email=email,
        phone=phone,
        role=role
    )
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    # Create associated role entity if PATIENT
    if role == 'PATIENT':
        patient = Patient(
            user_id=user.id,
            age=data.get('age', 30),
            gender=data.get('gender', 'Other'),
            blood_group=data.get('blood_group', 'O+'),
            emergency_contact=data.get('emergency_contact', phone),
            address=data.get('address', '')
        )
        db.session.add(patient)
        db.session.commit()

    access_token = create_access_token(identity=str(user.id))

    return jsonify({
        'success': True,
        'message': 'Registration successful.',
        'access_token': access_token,
        'user': user.to_dict()
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'success': False, 'message': 'Email and password are required.'}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({'success': False, 'message': 'Invalid email or password.'}), 401

    access_token = create_access_token(identity=str(user.id))
    user_data = user.to_dict()

    return jsonify({
        'success': True,
        'message': 'Login successful.',
        'access_token': access_token,
        'user': user_data
    }), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({'success': False, 'message': 'User not found.'}), 404

    profile = user.to_dict()
    if user.role == 'PATIENT' and user.patient:
        profile['patient_details'] = user.patient.to_dict()
    elif user.role == 'DOCTOR' and user.doctor:
        profile['doctor_details'] = user.doctor.to_dict()
    elif user.role == 'PHARMACY' and user.pharmacy:
        profile['pharmacy_details'] = user.pharmacy.to_dict()

    return jsonify({
        'success': True,
        'user': profile
    }), 200

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """
    Stateless JWT Logout.
    JWT access tokens are cryptographically signed and stored client-side (e.g. localStorage/cookies).
    Logging out client-side requires clearing the token from memory/storage.
    """
    return jsonify({
        'success': True,
        'message': 'Logout successful. Client must discard JWT access token.'
    }), 200

# Role Verification Test Endpoints for Automated Testing & Audit
@auth_bp.route('/test/patient', methods=['GET'])
@role_required('PATIENT')
def test_patient_access():
    return jsonify({'success': True, 'message': 'Welcome Patient'}), 200

@auth_bp.route('/test/doctor', methods=['GET'])
@role_required('DOCTOR')
def test_doctor_access():
    return jsonify({'success': True, 'message': 'Welcome Doctor'}), 200

@auth_bp.route('/test/admin', methods=['GET'])
@role_required('HOSPITAL_ADMIN')
def test_admin_access():
    return jsonify({'success': True, 'message': 'Welcome Hospital Admin'}), 200

@auth_bp.route('/test/pharmacy', methods=['GET'])
@role_required('PHARMACY')
def test_pharmacy_access():
    return jsonify({'success': True, 'message': 'Welcome Pharmacy'}), 200
