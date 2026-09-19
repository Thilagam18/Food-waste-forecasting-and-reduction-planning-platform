def test_ai_health_issue_categorization(client):
    res = client.post('/api/ai/analyze-health-issue', json={
        "health_issue": "I have a severe skin rash and persistent itching on my arms."
    })
    assert res.status_code == 200
    data = res.get_json()
    assert data['success'] is True
    analysis = data['analysis']
    assert analysis['category'] == "Dermatology"
    assert "disclaimer" in analysis
    assert "NOT a medical diagnosis" in analysis['disclaimer']
