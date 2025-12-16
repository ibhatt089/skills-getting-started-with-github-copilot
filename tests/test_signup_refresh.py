from fastapi.testclient import TestClient
from src.app import app, activities
import time


def test_signup_updates_activities():
    client = TestClient(app)

    # pick an activity to sign up for
    response = client.get("/activities")
    assert response.status_code == 200
    data = response.json()
    activity_name = next(iter(data.keys()))

    email = f"testuser+{int(time.time())}@example.com"

    # Sign up
    signup_resp = client.post(f"/activities/{activity_name}/signup", params={"email": email})
    assert signup_resp.status_code == 200

    # Immediately GET activities and check the participant is present
    get_resp = client.get("/activities")
    assert get_resp.status_code == 200
    activities_data = get_resp.json()
    assert email in activities_data[activity_name]["participants"]

    # Cleanup: remove the participant
    del_resp = client.delete(f"/activities/{activity_name}/participants", params={"email": email})
    assert del_resp.status_code == 200
    assert email not in activities[activity_name]["participants"]
