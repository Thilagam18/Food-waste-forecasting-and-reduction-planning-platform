import pytest
from flask_jwt_extended import create_access_token

def test_successful_registration(client):
    res = client.post('/api/auth/register', json={
        "name": "New Patient",
        "email": "newpatient@medisync.demo",
        "phone": "+1 555-9876",
        "password": "securepassword123",
        "role": "PATIENT",
        "age": 29,
        "gender": "Female"
    })
    assert res.status_code == 201
    data = res.get_json()
    assert data['success'] is True
    assert 'access_token' in data
    assert data['user']['email'] == "newpatient@medisync.demo"
    assert data['user']['role'] == "PATIENT"
    assert 'password_hash' not in data['user']

def test_duplicate_registration(client):
    payload = {
        "name": "Duplicate User",
        "email": "dup@medisync.demo",
        "phone": "+1 555-1111",
        "password": "password123",
        "role": "PATIENT"
    }
    res1 = client.post('/api/auth/register', json=payload)
    assert res1.status_code == 201

    res2 = client.post('/api/auth/register', json=payload)
    assert res2.status_code == 400
    data2 = res2.get_json()
    assert data2['success'] is False
    assert "already exists" in data2['message'].lower()

def test_successful_login(client):
    # Register first
    client.post('/api/auth/register', json={
        "name": "Login User",
        "email": "loginuser@medisync.demo",
        "phone": "+1 555-2222",
        "password": "mysecretpassword",
        "role": "DOCTOR"
    })

    # Login
    res = client.post('/api/auth/login', json={
        "email": "loginuser@medisync.demo",
        "password": "mysecretpassword"
    })
    assert res.status_code == 200
    data = res.get_json()
    assert data['success'] is True
    assert 'access_token' in data
    assert data['user']['email'] == "loginuser@medisync.demo"
    assert data['user']['role'] == "DOCTOR"
    assert 'password_hash' not in data['user']

def test_login_wrong_password(client):
    client.post('/api/auth/register', json={
        "name": "Wrong Pass User",
        "email": "wrongpass@medisync.demo",
        "phone": "+1 555-3333",
        "password": "correctpassword",
        "role": "PATIENT"
    })

    res = client.post('/api/auth/login', json={
        "email": "wrongpass@medisync.demo",
        "password": "INCORRECT_PASSWORD"
    })
    assert res.status_code == 401
    data = res.get_json()
    assert data['success'] is False

def test_missing_jwt(client):
    res = client.get('/api/auth/me')
    assert res.status_code == 401

def test_valid_jwt_and_me_endpoint(client):
    reg = client.post('/api/auth/register', json={
        "name": "Valid JWT User",
        "email": "validjwt@medisync.demo",
        "phone": "+1 555-4444",
        "password": "password123",
        "role": "PATIENT"
    }).get_json()

    token = reg['access_token']
    res = client.get('/api/auth/me', headers={
        "Authorization": f"Bearer {token}"
    })
    assert res.status_code == 200
    data = res.get_json()
    assert data['success'] is True
    assert data['user']['email'] == "validjwt@medisync.demo"

def test_invalid_jwt(client):
    res = client.get('/api/auth/me', headers={
        "Authorization": "Bearer INVALID_TOKEN_STRING_123"
    })
    assert res.status_code == 422 or res.status_code == 401

def test_role_based_authorizations(app, client):
    with app.app_context():
        # Create 4 users with different roles
        patient_token = client.post('/api/auth/register', json={
            "name": "Patient Role", "email": "p_role@medisync.demo", "phone": "1", "password": "password123", "role": "PATIENT"
        }).get_json()['access_token']

        doctor_token = client.post('/api/auth/register', json={
            "name": "Doctor Role", "email": "d_role@medisync.demo", "phone": "2", "password": "password123", "role": "DOCTOR"
        }).get_json()['access_token']

        admin_token = client.post('/api/auth/register', json={
            "name": "Admin Role", "email": "a_role@medisync.demo", "phone": "3", "password": "password123", "role": "HOSPITAL_ADMIN"
        }).get_json()['access_token']

        pharmacy_token = client.post('/api/auth/register', json={
            "name": "Pharmacy Role", "email": "ph_role@medisync.demo", "phone": "4", "password": "password123", "role": "PHARMACY"
        }).get_json()['access_token']

        # Patient test
        res = client.get('/api/auth/test/patient', headers={"Authorization": f"Bearer {patient_token}"})
        assert res.status_code == 200

        # Patient attempting Admin endpoint -> 403 Forbidden
        res_forbidden = client.get('/api/auth/test/admin', headers={"Authorization": f"Bearer {patient_token}"})
        assert res_forbidden.status_code == 403

        # Doctor test
        res = client.get('/api/auth/test/doctor', headers={"Authorization": f"Bearer {doctor_token}"})
        assert res.status_code == 200

        # Admin test
        res = client.get('/api/auth/test/admin', headers={"Authorization": f"Bearer {admin_token}"})
        assert res.status_code == 200

        # Pharmacy test
        res = client.get('/api/auth/test/pharmacy', headers={"Authorization": f"Bearer {pharmacy_token}"})
        assert res.status_code == 200
