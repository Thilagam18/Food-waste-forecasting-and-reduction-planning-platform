import json
from datetime import date, timedelta

def register_user(client, org_name, email, password="Password123!", org_type="Restaurant"):
    return client.post('/api/auth/register', json={
        'organization_name': org_name,
        'org_type': org_type,
        'full_name': f'Admin of {org_name}',
        'email': email,
        'password': password,
        'location': 'Downtown Hub'
    })

def login_user(client, email, password="Password123!"):
    return client.post('/api/auth/login', json={
        'email': email,
        'password': password
    })

def auth_headers(token):
    return {'Authorization': f'Bearer {token}'}

def test_registration_and_login(client):
    # 1. Register organization
    res = register_user(client, "Metro Bistro", "bistro@example.com")
    assert res.status_code == 201
    data = res.get_json()
    assert data['success'] is True
    assert 'access_token' in data
    assert data['user']['email'] == 'bistro@example.com'
    assert data['user']['organization_name'] == 'Metro Bistro'

    # 2. Duplicate registration should fail
    dup = register_user(client, "Metro Bistro 2", "bistro@example.com")
    assert dup.status_code == 409

    # 3. Valid Login
    login_res = login_user(client, "bistro@example.com")
    assert login_res.status_code == 200
    token = login_res.get_json()['access_token']
    assert token is not None

    # 4. Invalid Login
    bad_login = login_user(client, "bistro@example.com", "WrongPassword")
    assert bad_login.status_code == 401

def test_organization_data_isolation(client):
    # Register Org A
    res_a = register_user(client, "Org A Cafeteria", "orga@example.com", org_type="Cafeteria")
    token_a = res_a.get_json()['access_token']

    # Register Org B
    res_b = register_user(client, "Org B Hotel", "orgb@example.com", org_type="Hotel")
    token_b = res_b.get_json()['access_token']

    # Org A adds a food item
    item_res = client.post('/api/food-items', headers=auth_headers(token_a), json={
        'name': 'Organic Tomato Soup',
        'category': 'Cooked Meals',
        'unit': 'liters',
        'default_unit_cost': 4.50,
        'shelf_life_days': 2
    })
    assert item_res.status_code == 201
    item_a_id = item_res.get_json()['data']['id']

    # Org B queries food items - MUST NOT see Org A's item!
    org_b_items = client.get('/api/food-items', headers=auth_headers(token_b))
    assert org_b_items.status_code == 200
    b_data = org_b_items.get_json()['data']
    assert len(b_data) == 0

    # Org B attempts to delete or update Org A's item - MUST be 404 forbidden/not found!
    delete_res = client.delete(f'/api/food-items/{item_a_id}', headers=auth_headers(token_b))
    assert delete_res.status_code == 404

def test_food_log_validations_and_persistence(client):
    res = register_user(client, "Central Kitchen", "kitchen@example.com")
    token = res.get_json()['access_token']

    # Add food item
    item_res = client.post('/api/food-items', headers=auth_headers(token), json={
        'name': 'Roast Beef Slices',
        'category': 'Meat & Poultry',
        'unit': 'kg',
        'default_unit_cost': 12.00
    })
    item_id = item_res.get_json()['data']['id']

    # Validation: Consumed > Prepared must be rejected!
    bad_log = client.post('/api/food-logs', headers=auth_headers(token), json={
        'food_item_id': item_id,
        'record_date': date.today().isoformat(),
        'meal_period': 'Lunch',
        'quantity_prepared': 10.0,
        'quantity_consumed': 15.0  # Invalid!
    })
    assert bad_log.status_code == 400
    assert 'cannot exceed prepared' in bad_log.get_json()['message']

    # Validation: Negative quantity must be rejected!
    neg_log = client.post('/api/food-logs', headers=auth_headers(token), json={
        'food_item_id': item_id,
        'record_date': date.today().isoformat(),
        'meal_period': 'Lunch',
        'quantity_prepared': -5.0,
        'quantity_consumed': 2.0
    })
    assert neg_log.status_code == 400

    # Valid log
    valid_log = client.post('/api/food-logs', headers=auth_headers(token), json={
        'food_item_id': item_id,
        'record_date': date.today().isoformat(),
        'meal_period': 'Lunch',
        'quantity_prepared': 20.0,
        'quantity_consumed': 16.0,
        'surplus_quantity': 4.0,
        'discarded_quantity': 2.5,
        'waste_reason': 'Overproduction'
    })
    assert valid_log.status_code == 201
    log_data = valid_log.get_json()['data']
    assert log_data['surplus_quantity'] == 4.0
    assert log_data['discarded_quantity'] == 2.5
    assert log_data['waste_cost'] == round(2.5 * 12.00, 2)

    # Dashboard check
    dash = client.get('/api/dashboard/stats', headers=auth_headers(token))
    assert dash.status_code == 200
    stats = dash.get_json()['data']['metrics']
    assert stats['total_prepared_kg'] == 20.0
    assert stats['total_consumed_kg'] == 16.0
    assert stats['total_waste_kg'] == 2.5
    assert stats['current_surplus_kg'] == 4.0

def test_demo_dataset_and_purge(client):
    res = register_user(client, "Green Leaf Catering", "catering@greenleaf.com", org_type="Catering Service")
    token = res.get_json()['access_token']

    # Initially empty
    dash_empty = client.get('/api/dashboard/stats', headers=auth_headers(token))
    assert dash_empty.get_json()['data']['record_count'] == 0

    # Load Demo Data
    load_res = client.post('/api/demo/load', headers=auth_headers(token))
    assert load_res.status_code == 200
    assert load_res.get_json()['success'] is True

    # Dashboard now populated
    dash_loaded = client.get('/api/dashboard/stats', headers=auth_headers(token))
    assert dash_loaded.get_json()['data']['record_count'] > 0
    assert dash_loaded.get_json()['data']['has_demo_data'] is True

    # Forecasts and recommendations generated
    f_res = client.get('/api/forecasting/latest', headers=auth_headers(token))
    assert f_res.status_code == 200
    assert len(f_res.get_json()['data']) > 0

    recs_res = client.get('/api/recommendations', headers=auth_headers(token))
    assert recs_res.status_code == 200
    assert len(recs_res.get_json()['data']) > 0

    # Clear Demo Data
    clear_res = client.post('/api/demo/clear', headers=auth_headers(token))
    assert clear_res.status_code == 200

    # Verify returned to clean empty state
    dash_cleared = client.get('/api/dashboard/stats', headers=auth_headers(token))
    assert dash_cleared.get_json()['data']['record_count'] == 0

def test_recommendation_and_intervention_workflow(client):
    res = register_user(client, "University Dining Hall", "dining@uni.edu", org_type="College Canteen")
    token = res.get_json()['access_token']

    # Load demo data to populate recommendations
    client.post('/api/demo/load', headers=auth_headers(token))

    recs_res = client.get('/api/recommendations', headers=auth_headers(token))
    recs = recs_res.get_json()['data']
    assert len(recs) > 0
    target_rec = recs[0]

    # Update recommendation status to In Progress
    status_res = client.patch(f"/api/recommendations/{target_rec['id']}/status", headers=auth_headers(token), json={
        'status': 'In Progress',
        'action_notes': 'Meeting with kitchen chef tomorrow.'
    })
    assert status_res.status_code == 200
    assert status_res.get_json()['data']['status'] == 'In Progress'

    # Record intervention outcome
    intervene_res = client.post(f"/api/recommendations/{target_rec['id']}/intervene", headers=auth_headers(token), json={
        'action_taken': 'Reduced batch cooking by 5kg per lunch shift.',
        'food_saved_kg': 15.0,
        'cost_saved': 75.0,
        'staff_notes': 'Kitchen team verified that hunger needs were fully met.'
    })
    assert intervene_res.status_code == 201

    # Verify impact reflects this intervention
    impact_res = client.get('/api/impact/summary', headers=auth_headers(token))
    assert impact_res.status_code == 200
    impact_data = impact_res.get_json()
    assert impact_data['metrics']['food_saved_interventions_kg'] >= 15.0
    assert impact_data['metrics']['co2_avoided_kg'] >= round(15.0 * 2.5, 1)
