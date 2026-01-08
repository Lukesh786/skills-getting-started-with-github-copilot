import os
import importlib.util
from fastapi.testclient import TestClient


# Load the app module from src/app.py by file path
ROOT = os.path.dirname(os.path.dirname(__file__))
APP_PATH = os.path.join(ROOT, "src", "app.py")

spec = importlib.util.spec_from_file_location("app_module", APP_PATH)
app_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(app_module)

client = TestClient(app_module.app)


def test_get_activities():
    res = client.get("/activities")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, dict)
    # Expect some known activity from the seeded dataset
    assert "Soccer Team" in data


def test_signup_and_duplicate_and_unregister():
    activity = "Soccer Team"
    email = "test_student@example.com"

    # Ensure email is not already present
    res = client.get("/activities")
    participants = res.json()[activity]["participants"]
    if email in participants:
        # If already present from a previous run, remove it first
        client.delete(f"/activities/{activity}/participants?email={email}")

    # Sign up
    signup = client.post(f"/activities/{activity}/signup?email={email}")
    assert signup.status_code == 200
    assert "Signed up" in signup.json().get("message", "")

    # Signing up again should fail with 400
    dup = client.post(f"/activities/{activity}/signup?email={email}")
    assert dup.status_code == 400

    # Unregister the participant
    unreg = client.delete(f"/activities/{activity}/participants?email={email}")
    assert unreg.status_code == 200
    assert "Unregistered" in unreg.json().get("message", "")

    # Verify removal
    res2 = client.get("/activities")
    participants2 = res2.json()[activity]["participants"]
    assert email not in participants2
