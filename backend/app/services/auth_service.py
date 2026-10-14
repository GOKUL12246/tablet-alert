from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session

from app.core.exceptions import BadRequestException, DuplicateResourceException
from app.core.security import (
    create_access_token,
    get_password_hash,
    verify_password,
)
from app.models.user import User, UserProfile, UserRole, UserLanguage
from app.models.audit import AccessibilityPreferences, AccessibilityMode
from app.schemas.user import UserCreate


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Fetch user by case-insensitive email address."""
    return db.query(User).filter(User.email == email.lower().strip()).first()


def get_user_by_id(db: Session, user_id: str) -> Optional[User]:
    """Fetch user by ID."""
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_phone(db: Session, phone_number: str) -> Optional[User]:
    """Fetch user by phone number (normalizing digits)."""
    clean_phone = "".join(filter(str.isdigit, phone_number))
    users = db.query(User).filter(User.phone_number.isnot(None)).all()
    for u in users:
        if u.phone_number:
            u_clean = "".join(filter(str.isdigit, u.phone_number))
            if u_clean and (u_clean == clean_phone or clean_phone.endswith(u_clean) or u_clean.endswith(clean_phone)):
                return u
    return None


def create_user(db: Session, schema: UserCreate) -> User:
    """Register a new user, create default profile and accessibility preferences."""
    existing_user = get_user_by_email(db, schema.email)
    if existing_user:
        raise DuplicateResourceException(detail=f"User with email '{schema.email}' already exists")

    hashed_pw = get_password_hash(schema.password)
    user = User(
        email=schema.email.lower().strip(),
        hashed_password=hashed_pw,
        full_name=schema.full_name.strip(),
        phone_number=schema.phone_number.strip() if schema.phone_number else None,
        role=schema.role,
        language=schema.language,
        is_active=True,
        is_verified=False,
    )
    db.add(user)
    db.flush()

    # Create associated profile
    profile = UserProfile(user_id=user.id)
    db.add(profile)

    # Create accessibility preferences
    accessibility = AccessibilityPreferences(
        user_id=user.id,
        mode=AccessibilityMode.STANDARD,
        tts_language="ta" if user.language == UserLanguage.TA else "en"
    )
    db.add(accessibility)

    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """Verify user credentials and update last login timestamp."""
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    if not user.is_active:
        return None

    user.last_login = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)
    return user
