"""
Backend tests for Mergington High School Activity Management System.
Structured using the AAA (Arrange-Act-Assert) pattern.
"""

import pytest
from fastapi.testclient import TestClient
from src.app import app, activities


@pytest.fixture
def client():
    """Fixture providing FastAPI test client"""
    return TestClient(app)


@pytest.fixture(autouse=True)
def reset_activities():
    """Reset activities dictionary state before each test"""
    initial_activities = {
        "Chess Club": {
            "description": "Learn strategies and compete in chess tournaments",
            "schedule": "Fridays, 3:30 PM - 5:00 PM",
            "max_participants": 12,
            "participants": ["michael@mergington.edu", "daniel@mergington.edu"],
        },
        "Programming Class": {
            "description": "Learn programming fundamentals and build software projects",
            "schedule": "Tuesdays and Thursdays, 3:30 PM - 4:30 PM",
            "max_participants": 20,
            "participants": ["emma@mergington.edu", "sophia@mergington.edu"],
        },
        "Gym Class": {
            "description": "Physical education and sports activities",
            "schedule": "Mondays, Wednesdays, Fridays, 2:00 PM - 3:00 PM",
            "max_participants": 30,
            "participants": ["john@mergington.edu", "olivia@mergington.edu"],
        },
    }
    activities.clear()
    activities.update(initial_activities)
    yield


def test_get_activities(client):
    # Arrange: Expected activity in sample data
    expected_activity = "Chess Club"

    # Act: Retrieve activities list
    response = client.get("/activities")

    # Assert: Response is 200 OK and contains expected activities
    assert response.status_code == 200
    data = response.json()
    assert expected_activity in data
    assert "Gym Class" in data


def test_signup_success(client):
    # Arrange: Valid activity and new student email
    activity_name = "Chess Club"
    new_student = "alex@mergington.edu"

    # Act: Sign up new student
    response = client.post(f"/activities/{activity_name}/signup?email={new_student}")

    # Assert: Signup succeeds and student is in participants
    assert response.status_code == 200
    assert response.json()["message"] == f"Signed up {new_student} for {activity_name}"
    assert new_student in activities[activity_name]["participants"]


def test_signup_duplicate_prevented(client):
    # Arrange: Student already registered in Chess Club
    activity_name = "Chess Club"
    existing_student = "michael@mergington.edu"

    # Act: Try to sign up again
    response = client.post(f"/activities/{activity_name}/signup?email={existing_student}")

    # Assert: Request is rejected with 400 Bad Request
    assert response.status_code == 400
    assert "already signed up" in response.json()["detail"].lower()


def test_signup_nonexistent_activity(client):
    # Arrange: Activity that does not exist
    activity_name = "Nonexistent Club"
    student_email = "student@mergington.edu"

    # Act: Attempt to sign up
    response = client.post(f"/activities/{activity_name}/signup?email={student_email}")

    # Assert: 404 Not Found
    assert response.status_code == 404


def test_unregister_success(client):
    # Arrange: Student already registered in Chess Club
    activity_name = "Chess Club"
    student_email = "michael@mergington.edu"

    # Act: Unregister student
    response = client.delete(f"/activities/{activity_name}/unregister?email={student_email}")

    # Assert: Response is 200 OK and student is removed
    assert response.status_code == 200
    assert student_email not in activities[activity_name]["participants"]


def test_unregister_not_registered(client):
    # Arrange: Student not registered in Chess Club
    activity_name = "Chess Club"
    unregistered_student = "unknown@mergington.edu"

    # Act: Attempt unregister
    response = client.delete(f"/activities/{activity_name}/unregister?email={unregistered_student}")

    # Assert: 404 Not Found
    assert response.status_code == 404
