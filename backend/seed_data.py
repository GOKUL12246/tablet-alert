"""Seed data for MEDISAKHI AI.

NOTE: All data populated in this script is strictly fictional and intended exclusively
for local testing, UI demonstration, and development verification.
"""
from datetime import date, datetime, time, timedelta, timezone
from sqlalchemy.orm import Session

from app.database import Base, SessionLocal, engine
from app.core.security import get_password_hash
from app.models.audit import AccessibilityPreferences, AccessibilityMode, SystemSettings
from app.models.caregiver import CaregiverRelationship, ConsentStatus, ContactMethod
from app.models.medicine import Medicine, MedicineVerificationStatus
from app.models.reminder import (
    AlertType,
    AlertStatus,
    CaregiverAlert,
    ConfirmationMethod,
    ConfirmationType,
    DoseConfirmation,
    ReminderEvent,
    ReminderStatus,
)
from app.models.schedule import MedicineSchedule
from app.models.user import User, UserProfile, UserRole, UserLanguage, DisabilityType, PreferredAlertMode


def seed_database():
    print("--- Initializing database tables ---")
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()
    try:
        # Check if already seeded
        existing = db.query(User).filter(User.email == "arjun.kumar@example.com").first()
        if existing:
            print("Database already contains seed data. Skipping seed process.")
            return

        default_pw_hash = get_password_hash("password123")
        now_utc = datetime.now(timezone.utc)

        print("--- Seeding Users ---")
        # 1. Admin
        admin = User(
            email="admin@medisakhi.ai",
            hashed_password=default_pw_hash,
            full_name="Medisakhi System Administrator",
            phone_number="+919000000001",
            role=UserRole.ADMIN,
            language=UserLanguage.EN,
            is_active=True,
            is_verified=True,
        )
        db.add(admin)
        db.flush()

        # 2. Healthcare Professional
        doctor = User(
            email="dr.ramesh@medisakhi.ai",
            hashed_password=default_pw_hash,
            full_name="Dr. S. Ramesh, MD",
            phone_number="+919000000002",
            role=UserRole.HEALTHCARE_PROFESSIONAL,
            language=UserLanguage.EN,
            is_active=True,
            is_verified=True,
        )
        db.add(doctor)
        db.flush()

        # 3. Patients
        # Patient 1: Arjun Kumar (Type 2 Diabetes, Hypertension)
        patient1 = User(
            email="arjun.kumar@example.com",
            hashed_password=default_pw_hash,
            full_name="Arjun Kumar",
            phone_number="+919876500001",
            role=UserRole.PATIENT,
            language=UserLanguage.EN,
            is_active=True,
            is_verified=True,
        )
        db.add(patient1)
        db.flush()

        p1_profile = UserProfile(
            user_id=patient1.id,
            date_of_birth="1975-06-15",
            gender="Male",
            emergency_contact_name="Ananya Kumar",
            emergency_contact_phone="+919876500011",
            blood_group="B+",
            allergies=["Penicillin"],
            notes="Patient has mild hypertension and diabetes; keypad phone user.",
            disability_type=DisabilityType.NONE,
            preferred_alert_mode=PreferredAlertMode.SMS,
            requires_large_display=False,
            caregiver_assisted_setup=True,
        )
        db.add(p1_profile)

        p1_acc = AccessibilityPreferences(
            user_id=patient1.id,
            mode=AccessibilityMode.STANDARD,
            font_size_multiplier=1.2,
            high_contrast=False,
            tts_enabled=False,
        )
        db.add(p1_acc)

        # Patient 2: Priya Devi (Elderly, Visual Impairment, Tamil speaker)
        patient2 = User(
            email="priya.devi@example.com",
            hashed_password=default_pw_hash,
            full_name="Priya Devi",
            phone_number="+919876500002",
            role=UserRole.PATIENT,
            language=UserLanguage.TA,
            is_active=True,
            is_verified=True,
        )
        db.add(patient2)
        db.flush()

        p2_profile = UserProfile(
            user_id=patient2.id,
            date_of_birth="1952-11-20",
            gender="Female",
            emergency_contact_name="Sundar Devi",
            emergency_contact_phone="+919876500012",
            blood_group="O+",
            allergies=["Sulfa drugs"],
            notes="Elderly patient with low vision; benefits from voice prompts and high-contrast pictograms.",
            disability_type=DisabilityType.VISUAL,
            preferred_alert_mode=PreferredAlertMode.AUDIO,
            requires_large_display=True,
            caregiver_assisted_setup=True,
        )
        db.add(p2_profile)

        p2_acc = AccessibilityPreferences(
            user_id=patient2.id,
            mode=AccessibilityMode.HIGH_CONTRAST,
            font_size_multiplier=1.5,
            high_contrast=True,
            screen_reader_mode=True,
            tts_enabled=True,
            tts_language="ta",
            tts_rate=0.9,
        )
        db.add(p2_acc)

        # Patient 3: Rajan Subramanian (Cardiac support, non-literate support)
        patient3 = User(
            email="rajan.s@example.com",
            hashed_password=default_pw_hash,
            full_name="Rajan Subramanian",
            phone_number="+919876500003",
            role=UserRole.PATIENT,
            language=UserLanguage.TA,
            is_active=True,
            is_verified=True,
        )
        db.add(patient3)
        db.flush()

        p3_profile = UserProfile(
            user_id=patient3.id,
            date_of_birth="1960-03-08",
            gender="Male",
            emergency_contact_name="Sundar Devi",
            emergency_contact_phone="+919876500012",
            blood_group="A+",
            allergies=[],
            notes="Uses pictogram guidance (sun/moon) and Tamil audio reminders.",
            disability_type=DisabilityType.NONE,
            preferred_alert_mode=PreferredAlertMode.SMS,
            requires_large_display=False,
            caregiver_assisted_setup=True,
        )
        db.add(p3_profile)

        p3_acc = AccessibilityPreferences(
            user_id=patient3.id,
            mode=AccessibilityMode.EASY,
            font_size_multiplier=1.25,
            high_contrast=True,
            tts_enabled=True,
            tts_language="ta",
        )
        db.add(p3_acc)

        # 4. Caregivers
        # Caregiver 1: Ananya Kumar (Daughter of Arjun)
        cg1 = User(
            email="ananya.kumar@example.com",
            hashed_password=default_pw_hash,
            full_name="Ananya Kumar",
            phone_number="+919876500011",
            role=UserRole.CAREGIVER,
            language=UserLanguage.EN,
            is_active=True,
            is_verified=True,
        )
        db.add(cg1)
        db.flush()

        # Caregiver 2: Sundar Devi (Son of Priya Devi & Nephew of Rajan)
        cg2 = User(
            email="sundar.devi@example.com",
            hashed_password=default_pw_hash,
            full_name="Sundar Devi",
            phone_number="+919876500012",
            role=UserRole.CAREGIVER,
            language=UserLanguage.TA,
            is_active=True,
            is_verified=True,
        )
        db.add(cg2)
        db.flush()

        print("--- Seeding Caregiver Relationships ---")
        rel1 = CaregiverRelationship(
            patient_id=patient1.id,
            caregiver_id=cg1.id,
            relationship_type="daughter",
            relation_label="daughter",
            consent_status=ConsentStatus.APPROVED,
            consent_granted_at=now_utc - timedelta(days=30),
            is_primary=True,
            can_view_medicines=True,
            can_view_schedule=True,
            can_view_adherence=True,
            escalation_order=1,
            contact_method=ContactMethod.BOTH,
        )
        db.add(rel1)

        rel2 = CaregiverRelationship(
            patient_id=patient2.id,
            caregiver_id=cg2.id,
            relationship_type="mother",
            relation_label="mother",
            consent_status=ConsentStatus.APPROVED,
            consent_granted_at=now_utc - timedelta(days=45),
            is_primary=True,
            can_view_medicines=True,
            can_view_schedule=True,
            can_view_adherence=True,
            escalation_order=1,
            contact_method=ContactMethod.BOTH,
        )
        db.add(rel2)

        rel3 = CaregiverRelationship(
            patient_id=patient3.id,
            caregiver_id=cg2.id,
            relationship_type="nephew",
            relation_label="nephew",
            consent_status=ConsentStatus.APPROVED,
            consent_granted_at=now_utc - timedelta(days=20),
            is_primary=True,
            can_view_medicines=True,
            can_view_schedule=True,
            can_view_adherence=True,
            escalation_order=1,
            contact_method=ContactMethod.SMS,
        )
        db.add(rel3)

        print("--- Seeding Medicines ---")
        # Arjun's medicines
        m1 = Medicine(
            patient_id=patient1.id,
            name="Metformin",
            brand_name="Glycomet",
            active_ingredient="Metformin Hydrochloride",
            strength="500 mg",
            dosage_form="tablet",
            prescribed_quantity="1 tablet",
            route="oral",
            tablet_color="white",
            tablet_shape="round",
            tablet_size="medium 9mm",
            strip_cover_color="silver foil",
            box_color="white with blue strip",
            color="white",
            shape="round",
            size_description="medium 9mm",
            packaging_color="silver",
            icon_symbol="sun",
            pictogram_code="sun-morning",
            food_instructions="after_food",
            special_instructions="Take immediately after breakfast and dinner with water.",
            prescriber_name="Dr. S. Ramesh",
            start_date=date(2026, 1, 1),
            verification_status=MedicineVerificationStatus.VERIFIED,
            is_active=True,
        )
        db.add(m1)

        m2 = Medicine(
            patient_id=patient1.id,
            name="Telmisartan",
            brand_name="Telma",
            active_ingredient="Telmisartan",
            strength="40 mg",
            dosage_form="tablet",
            prescribed_quantity="1 tablet",
            route="oral",
            tablet_color="pink",
            tablet_shape="oval",
            tablet_size="small 7mm",
            strip_cover_color="aluminum blister",
            box_color="red and white box",
            color="pink",
            shape="oval",
            size_description="small 7mm",
            packaging_color="red",
            icon_symbol="sun",
            pictogram_code="sun-morning",
            food_instructions="before_food",
            special_instructions="Take early in the morning before breakfast.",
            prescriber_name="Dr. S. Ramesh",
            start_date=date(2026, 1, 1),
            verification_status=MedicineVerificationStatus.VERIFIED,
            is_active=True,
        )
        db.add(m2)

        # Priya's medicines
        m3 = Medicine(
            patient_id=patient2.id,
            name="Amlodipine",
            brand_name="Norvasc",
            active_ingredient="Amlodipine Besylate",
            strength="5 mg",
            dosage_form="tablet",
            prescribed_quantity="1 tablet",
            route="oral",
            tablet_color="white",
            tablet_shape="round",
            tablet_size="small 6mm",
            strip_cover_color="silver blister pack",
            box_color="blue and white box",
            color="white",
            shape="round",
            size_description="small 6mm",
            packaging_color="blue",
            icon_symbol="sun",
            pictogram_code="sun-morning",
            food_instructions="after_food",
            special_instructions="காலை உணவுக்குப் பின் உட்கொள்ளவும் (Take after morning meal).",
            prescriber_name="Dr. S. Ramesh",
            start_date=date(2026, 2, 1),
            verification_status=MedicineVerificationStatus.VERIFIED,
            is_active=True,
        )
        db.add(m3)

        m4 = Medicine(
            patient_id=patient2.id,
            name="Atorvastatin",
            brand_name="Atorva",
            active_ingredient="Atorvastatin Calcium",
            strength="10 mg",
            dosage_form="tablet",
            prescribed_quantity="1 tablet",
            route="oral",
            tablet_color="yellow",
            tablet_shape="oval",
            tablet_size="medium 8mm",
            strip_cover_color="gold strip pack",
            box_color="orange and white box",
            color="yellow",
            shape="oval",
            size_description="medium 8mm",
            packaging_color="gold",
            icon_symbol="moon",
            pictogram_code="moon-night",
            food_instructions="after_food",
            special_instructions="இரவு உணவுக்குப் பின் தூங்குவதற்கு முன் உட்கொள்ளவும் (Take after dinner before sleep).",
            prescriber_name="Dr. S. Ramesh",
            start_date=date(2026, 2, 1),
            verification_status=MedicineVerificationStatus.VERIFIED,
            is_active=True,
        )
        db.add(m4)

        db.flush()

        print("--- Seeding Schedules ---")
        s1 = MedicineSchedule(
            medicine_id=m1.id,
            patient_id=patient1.id,
            reminder_times=["08:30", "20:30"],
            timezone="Asia/Kolkata",
            is_active=True,
        )
        db.add(s1)

        s2 = MedicineSchedule(
            medicine_id=m2.id,
            patient_id=patient1.id,
            reminder_times=["07:30"],
            timezone="Asia/Kolkata",
            is_active=True,
        )
        db.add(s2)

        s3 = MedicineSchedule(
            medicine_id=m3.id,
            patient_id=patient2.id,
            reminder_times=["09:00"],
            timezone="Asia/Kolkata",
            is_active=True,
        )
        db.add(s3)

        s4 = MedicineSchedule(
            medicine_id=m4.id,
            patient_id=patient2.id,
            reminder_times=["21:00"],
            timezone="Asia/Kolkata",
            is_active=True,
        )
        db.add(s4)

        db.flush()

        print("--- Seeding Reminder Events and Confirmations ---")
        # Past confirmed reminder for Arjun
        r1_past = ReminderEvent(
            schedule_id=s1.id,
            medicine_id=m1.id,
            patient_id=patient1.id,
            scheduled_datetime=now_utc - timedelta(hours=5),
            status=ReminderStatus.PATIENT_REPORTED_TAKEN,
            notification_channels=["sms", "app"],
            sent_at=now_utc - timedelta(hours=5),
            delivered_at=now_utc - timedelta(hours=5),
            confirmed_at=now_utc - timedelta(hours=4, minutes=50),
            confirmation_method=ConfirmationMethod.SMS,
            escalation_level=0,
        )
        db.add(r1_past)
        db.flush()

        c1 = DoseConfirmation(
            reminder_id=r1_past.id,
            patient_id=patient1.id,
            confirmation_type=ConfirmationType.SMS_REPLY,
            confirmed_at=now_utc - timedelta(hours=4, minutes=50),
            notes="Confirmed via keypad '1'",
            is_self_reported=True,
        )
        db.add(c1)

        # Unacknowledged / Missed dose for Priya Devi with Caregiver Alert
        r2_missed = ReminderEvent(
            schedule_id=s3.id,
            medicine_id=m3.id,
            patient_id=patient2.id,
            scheduled_datetime=now_utc - timedelta(hours=2),
            status=ReminderStatus.CONFIRMATION_NOT_RECEIVED,
            notification_channels=["sms", "app"],
            sent_at=now_utc - timedelta(hours=2),
            delivered_at=now_utc - timedelta(hours=2),
            missed_dose_guidance_shown=True,
            escalation_level=2,
            next_escalation_at=now_utc + timedelta(minutes=15),
        )
        db.add(r2_missed)
        db.flush()

        alert1 = CaregiverAlert(
            reminder_id=r2_missed.id,
            patient_id=patient2.id,
            caregiver_id=cg2.id,
            alert_type=AlertType.MISSED_REMINDER,
            message_en=f"Your mother Priya Devi's medicine reminder at {r2_missed.scheduled_datetime.strftime('%I:%M %p')} has not been confirmed. Please check on them.",
            message_ta=f"உங்கள் தாய் Priya Devi {r2_missed.scheduled_datetime.strftime('%I:%M %p')} மணிக்கு உட்கொள்ள வேண்டிய மருந்து இன்னும் உறுதிப்படுத்தப்படவில்லை. தயவுசெய்து கவனிக்கவும்.",
            status=AlertStatus.OPEN,
            created_at=now_utc - timedelta(minutes=45),
        )
        db.add(alert1)

        # Upcoming reminders for today and tomorrow
        r_upcoming1 = ReminderEvent(
            schedule_id=s1.id,
            medicine_id=m1.id,
            patient_id=patient1.id,
            scheduled_datetime=now_utc + timedelta(hours=3),
            status=ReminderStatus.SCHEDULED,
            notification_channels=["sms", "app"],
            escalation_level=0,
        )
        db.add(r_upcoming1)

        r_upcoming2 = ReminderEvent(
            schedule_id=s4.id,
            medicine_id=m4.id,
            patient_id=patient2.id,
            scheduled_datetime=now_utc + timedelta(hours=4),
            status=ReminderStatus.SCHEDULED,
            notification_channels=["sms", "app"],
            escalation_level=0,
        )
        db.add(r_upcoming2)

        # Seed System Settings
        settings_seed = [
            SystemSettings(key="default_sms_sender", value="MEDISK", description="Default telecom sender header"),
            SystemSettings(key="enable_tamizh_audio", value=True, description="Enable automated Tamil voice alerts"),
            SystemSettings(key="keypad_sms_template_enabled", value=True, description="Enable keypad-optimized 1=Taken format"),
        ]
        db.add_all(settings_seed)

        db.commit()
        print("--- Seed data created successfully! ---")
        print("Fictional demo accounts available:")
        print("  Admin:     admin@medisakhi.ai / password123")
        print("  Doctor:    dr.ramesh@medisakhi.ai / password123")
        print("  Patient 1: arjun.kumar@example.com / password123")
        print("  Patient 2: priya.devi@example.com / password123")
        print("  Caregiver: ananya.kumar@example.com / password123")

    except Exception as e:
        db.rollback()
        print(f"Error seeding data: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
