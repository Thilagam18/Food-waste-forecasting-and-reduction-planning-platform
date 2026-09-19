from flask import Blueprint, request, jsonify
from backend.ai.ai_service import ai_service
from backend.models.hospital import Hospital, Department
from backend.models.queue import Queue

ai_bp = Blueprint('ai', __name__, url_prefix='/api/ai')

@ai_bp.route('/analyze-health-issue', methods=['POST'])
def analyze_health_issue():
    data = request.get_json() or {}
    health_issue = data.get('health_issue', '')
    if not health_issue:
        return jsonify({'success': False, 'message': 'health_issue text is required.'}), 400

    result = ai_service.analyze_health_issue(health_issue)
    return jsonify({'success': True, 'analysis': result}), 200

@ai_bp.route('/recommend-hospitals', methods=['POST'])
def recommend_hospitals():
    data = request.get_json() or {}
    health_issue = data.get('health_issue', '')
    department_name = data.get('department', 'General Medicine')
    user_lat = data.get('lat', 12.9716)
    user_lng = data.get('lng', 77.5946)

    # Fetch hospitals from database
    hospitals = Hospital.query.all()
    candidates = []
    for h in hospitals:
        h_dict = h.to_dict()
        # Count current waiting queue items
        active_queues = Queue.query.filter_by(hospital_id=h.id, status='ACTIVE').all()
        waiting_count = sum(q.to_dict()['waiting_patients_count'] for q in active_queues)
        
        # Calculate rough distance
        from backend.routes.hospital import haversine_distance
        dist = haversine_distance(user_lat, user_lng, h.latitude, h.longitude)
        h_dict['distance_km'] = round(dist, 1)
        h_dict['estimated_wait_mins'] = max(10, waiting_count * 10)
        h_dict['available_doctors_count'] = h_dict.get('doctors_count', 1)
        candidates.append(h_dict)

    recommendation = ai_service.recommend_hospitals(health_issue, department_name, candidates)
    return jsonify({'success': True, 'recommendation': recommendation}), 200

@ai_bp.route('/search-query', methods=['POST'])
def natural_language_search():
    data = request.get_json() or {}
    query_text = data.get('query', '')
    if not query_text:
        return jsonify({'success': False, 'message': 'query string is required.'}), 400

    analysis = ai_service.analyze_health_issue(query_text)
    category = analysis.get('category', 'General Medicine')

    # Query matching hospitals
    hospitals = Hospital.query.all()
    matching = []
    for h in hospitals:
        h_dict = h.to_dict()
        dept_names = [d['name'] for d in h_dict['departments']]
        if category in dept_names or 'General Medicine' in dept_names:
            matching.append(h_dict)

    return jsonify({
        'success': True,
        'category': category,
        'reasoning': analysis.get('reasoning', ''),
        'disclaimer': analysis.get('disclaimer', ''),
        'matching_hospitals': matching
    }), 200
