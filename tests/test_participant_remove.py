from fastapi.testclient import TestClient
from src.app import app, activities


def test_remove_participant():
    client = TestClient(app)

    # Ensure there's at least one activity and participant
    response = client.get("/activities")
    assert response.status_code == 200
    data = response.json()
    # pick an activity with at least one participant
    activity_name = None
    participant_email = None
    for name, details in data.items():
        if details.get("participants"):
            activity_name = name
            participant_email = details["participants"][0]
            break

    assert activity_name is not None, "No activity with participants found"

    # Remove the participant
    del_resp = client.delete(f"/activities/{activity_name}/participants", params={"email": participant_email})
    assert del_resp.status_code == 200
    assert f"Removed {participant_email}" in del_resp.json().get("message", "")

    # Verify participant removed from in-memory activities
    assert participant_email not in activities[activity_name]["participants"]