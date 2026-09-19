import math
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.extensions import db
from backend.models.hospital import Hospital, Department, HospitalDepartment
from backend.models.doctor import Doctor
from backend.models.queue import Queue, QueueItem

hospital_bp = Blueprint('hospital', __name__, url_prefix='/api/hospitals')

def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculate geographical distance between two lat/lon points in km."""
    R = 6371.0 # Radius of the earth in km
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = math.sin(dLat / 2) * math.sin(dLat / 2) + \
        math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * \
        math.sin(dLon / 2) * math.sin(dLon / 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

@hospital_bp.route('', methods=['GET'])
def get_hospitals():
    user_lat = request.args.get('lat', type=float)
    user_lng = request.args.get('lng', type=float)
    department_name = request.args.get('department')
    search_query = request.args.get('q', '').lower()

    query = Hospital.query

    if search_query:
        query = query.filter(Hospital.name.ilike(f'%{search_query}%') | Hospital.address.ilike(f'%{search_query}%'))

    hospitals = query.all()
    results = []

    for h in hospitals:
        h_dict = h.to_dict()

        # Calculate distance if user lat/lng provided, default fallback if not
        if user_lat is not None and user_lng is not None:
            dist = haversine_distance(user_lat, user_lng, h.latitude, h.longitude)
        else:
            # Default reference point center distance estimation
            dist = haversine_distance(12.9716, 77.5946, h.latitude, h.longitude)
        
        h_dict['distance_km'] = round(dist, 1)

        # Count total active queue waiting patients across departments
        active_queues = Queue.query.filter_by(hospital_id=h.id, status='ACTIVE').all()
        total_waiting = sum(q.to_dict()['waiting_patients_count'] for q in active_queues)
        h_dict['total_queue_waiting'] = total_waiting
        h_dict['estimated_wait_mins'] = max(10, total_waiting * 10)

        # Filter by department if requested
        if department_name:
            dept_names = [d['name'].lower() for d in h_dict['departments']]
            if department_name.lower() not in dept_names:
                continue

        results.append(h_dict)

    # Sort by distance
    results.sort(key=lambda x: x['distance_km'])

    return jsonify({'success': True, 'hospitals': results}), 200

@hospital_bp.route('/<int:hospital_id>', methods=['GET'])
def get_hospital_details(hospital_id):
    hospital = Hospital.query.get(hospital_id)
    if not hospital:
        return jsonify({'success': False, 'message': 'Hospital not found.'}), 404

    h_dict = hospital.to_dict()
    
    # Get available doctors in this hospital
    doctors = Doctor.query.filter_by(hospital_id=hospital_id).all()
    h_dict['doctors'] = [d.to_dict() for d in doctors]

    # Get active queues in this hospital
    queues = Queue.query.filter_by(hospital_id=hospital_id, status='ACTIVE').all()
    h_dict['active_queues'] = [q.to_dict() for q in queues]

    return jsonify({'success': True, 'hospital': h_dict}), 200

@hospital_bp.route('/departments', methods=['GET'])
def get_all_departments():
    departments = Department.query.all()
    return jsonify({'success': True, 'departments': [d.to_dict() for d in departments]}), 200
