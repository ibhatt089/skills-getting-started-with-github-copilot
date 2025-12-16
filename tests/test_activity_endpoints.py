from fastapi.testclient import TestClient
from src.app import app, activities


client = TestClient(app)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    # Check known activity keys are present
    assert "Basketball" in data


def test_signup_nonexistent_activity():
    resp = client.post("/activities/NoSuchActivity/signup", params={"email": "x@example.com"})
    assert resp.status_code == 404


def test_signup_duplicate_fails():
    # Pick an activity with an existing participant
    for name, details in activities.items():
        if details.get("participants"):
            activity_name = name
            existing = details["participants"][0]
            break

    resp = client.post(f"/activities/{activity_name}/signup", params={"email": existing})
    assert resp.status_code == 400


def test_remove_nonexistent_participant():
    # Use an existing activity
    activity_name = next(iter(activities.keys()))
    resp = client.delete(f"/activities/{activity_name}/participants", params={"email": "not-a-participant@example.com"})
    assert resp.status_code == 404


def test_remove_nonexistent_activity():
    resp = client.delete("/activities/NoSuchActivity/participants", params={"email": "x@example.com"})
    assert resp.status_code == 404
