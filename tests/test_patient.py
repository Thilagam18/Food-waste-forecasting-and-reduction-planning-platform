import pytest
from datetime import datetime, timedelta

def test_patient_profile_get_and_put(app, client):
    # Register Patient 1
    p1 = client.post('/api/auth/register', json={
        "name": "Profile Patient",
        "email": "p_profile@medisync.demo",
        "phone": "+1 555-1000",
        "password": "password123",
        "role": "PATIENT"
    }).get_json()
    t1 = p1['access_token']

    # GET profile
    res_get = client.get('/api/patients/profile', headers={"Authorization": f"Bearer {t1}"})
    assert res_get.status_code == 200
    assert res_get.get_json()['patient']['name'] == "Profile Patient"

    # PUT update profile
    res_put = client.put('/api/patients/profile', headers={"Authorization": f"Bearer {t1}"}, json={
        "name": "Updated Profile Patient",
        "age": 35,
        "gender": "Female",
        "blood_group": "AB+",
        "emergency_contact": "+1 555-9999"
    })
    assert res_put.status_code == 200
    updated = res_put.get_json()['patient']
    assert updated['name'] == "Updated Profile Patient"
    assert updated['age'] == 35
    assert updated['blood_group'] == "AB+"

def test_patient_idor_protection(client):
    # Register Patient A and Patient B
    pA = client.post('/api/auth/register', json={
        "name": "Patient A", "email": "pa@medisync.demo", "phone": "1", "password": "password123", "role": "PATIENT"
    }).get_json()['access_token']

    pB = client.post('/api/auth/register', json={
        "name": "Patient B", "email": "pb@medisync.demo", "phone": "2", "password": "password123", "role": "PATIENT"
    }).get_json()['access_token']

    # Patient A books an appointment
    appt_res = client.post('/api/patients/appointments', headers={"Authorization": f"Bearer {pA}"}, json={
        "hospital_id": 1,
        "doctor_id": 1,
        "department_id": 1,
        "appointment_date": (datetime.utcnow() + timedelta(days=1)).isoformat()
    }).get_json()
    appt_id = appt_res['appointment']['id']

    # Patient B attempts to view Patient A's appointment -> 403 Forbidden
    res_idor = client.get(f'/api/patients/appointments/{appt_id}', headers={"Authorization": f"Bearer {pB}"})
    assert res_idor.status_code == 403

def test_hospital_and_doctor_search(client):
    # Register Patient
    token = client.post('/api/auth/register', json={
        "name": "Search Patient", "email": "search@medisync.demo", "phone": "3", "password": "password123", "role": "PATIENT"
    }).get_json()['access_token']

    # Search hospitals
    h_res = client.get('/api/patients/hospitals?search=City', headers={"Authorization": f"Bearer {token}"})
    assert h_res.status_code == 200
    assert h_res.get_json()['count'] >= 1

    # Search doctors
    d_res = client.get('/api/patients/doctors?hospital=1', headers={"Authorization": f"Bearer {token}"})
    assert d_res.status_code == 200
    assert len(d_res.get_json()['doctors']) >= 1

def test_token_booking_and_queue_calculation(client):
    # Register Patient
    token = client.post('/api/auth/register', json={
        "name": "Token Patient", "email": "token@medisync.demo", "phone": "4", "password": "password123", "role": "PATIENT"
    }).get_json()['access_token']

    # Book Token
    book_res = client.post('/api/patients/tokens', headers={"Authorization": f"Bearer {token}"}, json={
        "hospital_id": 1,
        "doctor_id": 1,
        "department_id": 1
    })
    assert book_res.status_code == 201
    t_data = book_res.get_json()['token']
    assert t_data['status'] == 'WAITING'
    assert 'token_code' in t_data
    assert t_data['queue_position'] >= 1

    # Attempt duplicate token booking in same queue -> 400 Bad Request
    dup_res = client.post('/api/patients/tokens', headers={"Authorization": f"Bearer {token}"}, json={
        "hospital_id": 1,
        "doctor_id": 1,
        "department_id": 1
    })
    assert dup_res.status_code == 400

    # Active token endpoint
    act_res = client.get('/api/patients/tokens/active', headers={"Authorization": f"Bearer {token}"})
    assert act_res.status_code == 200
    assert act_res.get_json()['token'] is not None

    # Cancel Token
    token_id = t_data['id']
    cancel_res = client.delete(f'/api/patients/tokens/{token_id}', headers={"Authorization": f"Bearer {token}"})
    assert cancel_res.status_code == 200
    assert cancel_res.get_json()['token']['status'] == 'CANCELLED'

def test_medical_records_and_notifications_auth(client):
    token = client.post('/api/auth/register', json={
        "name": "Med Patient", "email": "medp@medisync.demo", "phone": "5", "password": "password123", "role": "PATIENT"
    }).get_json()['access_token']

    # Health issue submission
    issue_res = client.post('/api/patients/health-issues', headers={"Authorization": f"Bearer {token}"}, json={
        "description": "I have severe throat pain and fever."
    })
    assert issue_res.status_code == 201

    # Medical records view
    mr_res = client.get('/api/patients/medical-records', headers={"Authorization": f"Bearer {token}"})
    assert mr_res.status_code == 200
    assert len(mr_res.get_json()['consultation_history']) >= 1

    # Notifications view
    notif_res = client.get('/api/patients/notifications', headers={"Authorization": f"Bearer {token}"})
    assert notif_res.status_code == 200
