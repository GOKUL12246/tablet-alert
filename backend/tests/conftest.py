import os
import sys
os.environ["TESTING"] = "1"
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import Base, get_db
from app.main import app
from app.models.user import User, UserRole, UserLanguage
from app.core.security import get_password_hash, create_access_token

# Use an in-memory SQLite database for test isolation
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def test_patient(db_session):
    user = User(
        email="test_patient@example.com",
        hashed_password=get_password_hash("password123"),
        full_name="Test Patient",
        phone_number="+919876543201",
        role=UserRole.PATIENT,
        language=UserLanguage.EN,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_caregiver(db_session):
    user = User(
        email="test_caregiver@example.com",
        hashed_password=get_password_hash("password123"),
        full_name="Test Caregiver",
        phone_number="+919876543202",
        role=UserRole.CAREGIVER,
        language=UserLanguage.EN,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def patient_token(test_patient):
    return create_access_token({"sub": test_patient.id, "email": test_patient.email, "role": "patient"})


@pytest.fixture
def caregiver_token(test_caregiver):
    return create_access_token({"sub": test_caregiver.id, "email": test_caregiver.email, "role": "caregiver"})
