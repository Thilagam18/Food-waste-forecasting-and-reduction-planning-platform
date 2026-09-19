import pytest

def test_doctor_profile_get_and_put(client):
    # Login as Doctor Demo
    login_res = client.post('/api/auth/login', json={
        "email": "doctor@medisync.demo",
        "password": "doctor123"
    }).get_json()
    token = login_res['access_token']

    # GET profile
    res_get = client.get('/api/doctors/profile', headers={"Authorization": f"Bearer {token}"})
    assert res_get.status_code == 200
    assert res_get.get_json()['doctor']['name'] == "Dr. Demo Doctor"

    # PUT update profile
    res_put = client.put('/api/doctors/profile', headers={"Authorization": f"Bearer {token}"}, json={
        "qualification": "MD (Internal Med), FACP",
        "avg_consultation_time_mins": 15
    })
    assert res_put.status_code == 200
    assert res_put.get_json()['doctor']['qualification'] == "MD (Internal Med), FACP"
    assert res_put.get_json()['doctor']['avg_consultation_time_mins'] == 15

def test_unauthorized_access_and_doctor_isolation(client):
    # Patient login
    p_token = client.post('/api/auth/login', json={
        "email": "patient@medisync.demo", "password": "patient123"
    }).get_json()['access_token']

    # Patient accessing doctor dashboard -> 403
    p_access = client.get('/api/doctors/dashboard', headers={"Authorization": f"Bearer {p_token}"})
    assert p_access.status_code == 403

    # Doctor A login (Dr. Demo Doctor - id 1)
    docA_token = client.post('/api/auth/login', json={
        "email": "doctor@medisync.demo", "password": "doctor123"
    }).get_json()['access_token']

    # Doctor B login (Dr. Ananya Sen - id 2)
    docB_token = client.post('/api/auth/login', json={
        "email": "cardio@medisync.demo", "password": "doctor123"
    }).get_json()['access_token']

    # Doctor B attempts to view patient #1 (assigned to Doctor A) -> 403 Forbidden
    docB_access = client.get('/api/doctors/patients/1', headers={"Authorization": f"Bearer {docB_token}"})
    assert docB_access.status_code == 403

def test_doctor_dashboard_and_appointments(client):
    doc_token = client.post('/api/auth/login', json={
        "email": "doctor@medisync.demo", "password": "doctor123"
    }).get_json()['access_token']

    # Dashboard
    dash_res = client.get('/api/doctors/dashboard', headers={"Authorization": f"Bearer {doc_token}"})
    assert dash_res.status_code == 200
    assert dash_res.get_json()['success'] is True
    assert 'doctor' in dash_res.get_json()

    # Appointments
    appts_res = client.get('/api/doctors/appointments', headers={"Authorization": f"Bearer {doc_token}"})
    assert appts_res.status_code == 200

def test_call_next_start_complete_consultation(client):
    doc_token = client.post('/api/auth/login', json={
        "email": "doctor@medisync.demo", "password": "doctor123"
    }).get_json()['access_token']

    # Call Next Patient
    next_res = client.post('/api/doctors/queue/next', headers={"Authorization": f"Bearer {doc_token}"})
    assert next_res.status_code == 200
    next_data = next_res.get_json()
    assert next_data['success'] is True

    # Complete Consultation
    if next_data.get('called_patient'):
        q_item_id = next_data['called_patient']['id']
        comp_res = client.post(f'/api/doctors/consultations/{q_item_id}/complete', headers={"Authorization": f"Bearer {doc_token}"}, json={
            "diagnosis": "Acute Pharyngitis",
            "clinical_notes": "Prescribed antibiotic and oral rehydration."
        })
        assert comp_res.status_code == 200
        assert comp_res.get_json()['queue_item']['status'] == 'COMPLETED'

def test_emergency_case_injection_and_recalculation(client):
    doc_token = client.post('/api/auth/login', json={
        "email": "doctor@medisync.demo", "password": "doctor123"
    }).get_json()['access_token']

    # Inject Emergency Case
    emg_res = client.post('/api/doctors/queue/emergency', headers={"Authorization": f"Bearer {doc_token}"}, json={
        "patient_id": 1,
        "reason": "Acute chest pain & respiratory distress"
    })
    assert emg_res.status_code == 200
    emg_data = emg_res.get_json()
    assert emg_data['success'] is True
    assert emg_data['token']['is_emergency'] is True

def test_prescription_and_availability(client):
    doc_token = client.post('/api/auth/login', json={
        "email": "doctor@medisync.demo", "password": "doctor123"
    }).get_json()['access_token']

    # Availability GET & PUT
    avail_get = client.get('/api/doctors/availability', headers={"Authorization": f"Bearer {doc_token}"})
    assert avail_get.status_code == 200

    avail_put = client.put('/api/doctors/availability', headers={"Authorization": f"Bearer {doc_token}"}, json={
        "is_available": True,
        "avg_consultation_time_mins": 14
    })
    assert avail_put.status_code == 200
    assert avail_put.get_json()['avg_consultation_time_mins'] == 14

    # Create Prescription
    rx_res = client.post('/api/doctors/prescriptions', headers={"Authorization": f"Bearer {doc_token}"}, json={
        "patient_id": 1,
        "diagnosis": "Hyperacidity",
        "clinical_notes": "Advised lifestyle modifications.",
        "medicines": [
            {"name": "Omeprazole 20mg", "dosage": "1 Cap", "frequency": "OD", "duration": "14 days", "instructions": "Before breakfast"}
        ]
    })
    assert rx_res.status_code == 201
    assert rx_res.get_json()['prescription']['diagnosis'] == "Hyperacidity"
