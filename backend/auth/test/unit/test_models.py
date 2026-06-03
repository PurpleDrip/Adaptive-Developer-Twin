import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..', '..'))

import pytest
from pydantic import ValidationError
from shared.models.user import UserRegistrationDTO, LoginDTO, ManagerCreateDTO

pytestmark = pytest.mark.unit


class TestUserRegistrationDTO:
    VALID = {
        "name": "Alice Dev",
        "username": "alice123",
        "email": "alice@example.com",
        "phone_number": "9876543210",
        "gender": "Female",
        "password": "SecurePass123!",
        "strong_domains": ["backend", "ml"],
        "experience_level": "Mid",
        "github_project_urls": []
    }

    def test_valid_registration_passes(self):
        dto = UserRegistrationDTO(**self.VALID)
        assert dto.username == "alice123"
        assert dto.email == "alice@example.com"

    def test_missing_required_field_raises(self):
        data = {**self.VALID}
        del data["email"]
        with pytest.raises(ValidationError):
            UserRegistrationDTO(**data)

    def test_strong_domains_must_be_list(self):
        data = {**self.VALID, "strong_domains": "backend"}
        with pytest.raises(ValidationError):
            UserRegistrationDTO(**data)


class TestLoginDTO:
    def test_valid_login_dto(self):
        dto = LoginDTO(username="alice", password="pass")
        assert dto.username == "alice"

    def test_missing_password_raises(self):
        with pytest.raises(ValidationError):
            LoginDTO(username="alice")


class TestManagerCreateDTO:
    VALID = {
        "name": "Nora Manager",
        "username": "nora.manager",
        "email": "Nora.Manager@ADT.ai",
        "phone_number": "9876543210",
        "gender": "Female",
        "department": "Backend",
        "password": "SecurePass123!",
    }

    def test_valid_manager_passes_and_lowercases_email(self):
        dto = ManagerCreateDTO(**self.VALID)
        assert dto.username == "nora.manager"
        assert dto.email == "nora.manager@adt.ai"
        assert dto.department == "Backend"

    def test_missing_department_raises(self):
        data = {**self.VALID}
        del data["department"]
        with pytest.raises(ValidationError):
            ManagerCreateDTO(**data)

    def test_missing_email_raises(self):
        data = {**self.VALID}
        del data["email"]
        with pytest.raises(ValidationError):
            ManagerCreateDTO(**data)

    def test_invalid_gender_raises(self):
        data = {**self.VALID, "gender": "Robot"}
        with pytest.raises(ValidationError):
            ManagerCreateDTO(**data)

    def test_short_password_raises(self):
        data = {**self.VALID, "password": "short"}
        with pytest.raises(ValidationError):
            ManagerCreateDTO(**data)

    def test_invalid_email_format_raises(self):
        data = {**self.VALID, "email": "not-an-email"}
        with pytest.raises(ValidationError):
            ManagerCreateDTO(**data)
