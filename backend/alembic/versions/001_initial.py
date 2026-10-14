"""Initial schema migration

Revision ID: 001_initial
Revises: 
Create Date: 2026-10-15 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '001_initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Users table
    op.create_table(
        'users',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('phone_number', sa.String(length=32), nullable=True),
        sa.Column('role', sa.String(length=50), nullable=False, server_default='patient'),
        sa.Column('language', sa.String(length=10), nullable=False, server_default='en'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('is_verified', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('last_login', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)
    op.create_index('ix_users_phone_number', 'users', ['phone_number'], unique=False)

    # User Profiles table
    op.create_table(
        'user_profiles',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('user_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('date_of_birth', sa.String(length=20), nullable=True),
        sa.Column('gender', sa.String(length=20), nullable=True),
        sa.Column('emergency_contact_name', sa.String(length=255), nullable=True),
        sa.Column('emergency_contact_phone', sa.String(length=32), nullable=True),
        sa.Column('blood_group', sa.String(length=10), nullable=True),
        sa.Column('allergies', sa.JSON(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('disability_type', sa.String(length=50), nullable=False, server_default='none'),
        sa.Column('preferred_alert_mode', sa.String(length=50), nullable=False, server_default='sms'),
        sa.Column('requires_large_display', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('caregiver_assisted_setup', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint('user_id', name='uq_user_profile_user_id'),
    )

    # Accessibility Preferences table
    op.create_table(
        'accessibility_preferences',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('user_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('mode', sa.String(length=50), nullable=False, server_default='standard'),
        sa.Column('font_size_multiplier', sa.Float(), nullable=False, server_default='1.0'),
        sa.Column('high_contrast', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('reduced_motion', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('screen_reader_mode', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('tts_enabled', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('tts_language', sa.String(length=10), nullable=False, server_default='en'),
        sa.Column('tts_rate', sa.Float(), nullable=False, server_default='1.0'),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint('user_id', name='uq_accessibility_user_id'),
    )

    # Prescriptions table
    op.create_table(
        'prescriptions',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('patient_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('medicine_id', sa.String(length=36), nullable=True),
        sa.Column('file_path', sa.String(length=512), nullable=False),
        sa.Column('file_type', sa.String(length=50), nullable=True),
        sa.Column('ocr_raw_text', sa.Text(), nullable=True),
        sa.Column('ocr_extracted_data', sa.JSON(), nullable=False),
        sa.Column('ocr_confidence', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('verification_status', sa.String(length=50), nullable=False, server_default='uploaded'),
        sa.Column('verified_by', sa.String(length=36), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('verified_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('verification_notes', sa.Text(), nullable=True),
        sa.Column('uploaded_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_prescriptions_patient_id', 'prescriptions', ['patient_id'])

    # Medicines table
    op.create_table(
        'medicines',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('patient_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('brand_name', sa.String(length=255), nullable=True),
        sa.Column('active_ingredient', sa.String(length=255), nullable=True),
        sa.Column('strength', sa.String(length=100), nullable=False),
        sa.Column('dosage_form', sa.String(length=100), nullable=True),
        sa.Column('prescribed_quantity', sa.String(length=100), nullable=True, server_default='1 tablet'),
        sa.Column('route', sa.String(length=100), nullable=True, server_default='oral'),
        sa.Column('tablet_color', sa.String(length=50), nullable=True),
        sa.Column('tablet_shape', sa.String(length=50), nullable=True),
        sa.Column('tablet_size', sa.String(length=100), nullable=True),
        sa.Column('strip_cover_color', sa.String(length=100), nullable=True),
        sa.Column('box_color', sa.String(length=100), nullable=True),
        sa.Column('packaging_image_path', sa.String(length=512), nullable=True),
        sa.Column('color', sa.String(length=50), nullable=True),
        sa.Column('shape', sa.String(length=50), nullable=True),
        sa.Column('size_description', sa.String(length=100), nullable=True),
        sa.Column('packaging_color', sa.String(length=50), nullable=True),
        sa.Column('icon_symbol', sa.String(length=50), nullable=True, server_default='sun'),
        sa.Column('pictogram_code', sa.String(length=100), nullable=True, server_default='sun-morning'),
        sa.Column('special_instructions', sa.Text(), nullable=True),
        sa.Column('food_instructions', sa.String(length=100), nullable=True, server_default='after_food'),
        sa.Column('warning_info', sa.Text(), nullable=True),
        sa.Column('prescriber_name', sa.String(length=255), nullable=True),
        sa.Column('pharmacy_name', sa.String(length=255), nullable=True),
        sa.Column('start_date', sa.Date(), nullable=True),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('verification_status', sa.String(length=50), nullable=False, server_default='verified'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('prescription_id', sa.String(length=36), sa.ForeignKey('prescriptions.id', ondelete='SET NULL'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_medicines_patient_id', 'medicines', ['patient_id'])
    op.create_index('ix_medicines_name', 'medicines', ['name'])

    # Medicine Schedules table
    op.create_table(
        'medicine_schedules',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('medicine_id', sa.String(length=36), sa.ForeignKey('medicines.id', ondelete='CASCADE'), nullable=False),
        sa.Column('patient_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('reminder_times', sa.JSON(), nullable=False),
        sa.Column('timezone', sa.String(length=64), nullable=False, server_default='Asia/Kolkata'),
        sa.Column('days_of_week', sa.JSON(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('pause_reason', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_medicine_schedules_medicine_id', 'medicine_schedules', ['medicine_id'])
    op.create_index('ix_medicine_schedules_patient_id', 'medicine_schedules', ['patient_id'])

    # Reminder Events table
    op.create_table(
        'reminder_events',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('schedule_id', sa.String(length=36), sa.ForeignKey('medicine_schedules.id', ondelete='SET NULL'), nullable=True),
        sa.Column('medicine_id', sa.String(length=36), sa.ForeignKey('medicines.id', ondelete='CASCADE'), nullable=False),
        sa.Column('patient_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('scheduled_datetime', sa.DateTime(timezone=True), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='scheduled'),
        sa.Column('notification_channels', sa.JSON(), nullable=False),
        sa.Column('sent_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('delivered_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('acknowledged_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('confirmed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('confirmation_method', sa.String(length=50), nullable=True),
        sa.Column('missed_dose_guidance_shown', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('escalation_level', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('next_escalation_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_reminder_events_patient_id', 'reminder_events', ['patient_id'])
    op.create_index('ix_reminder_events_medicine_id', 'reminder_events', ['medicine_id'])
    op.create_index('ix_reminder_events_scheduled_datetime', 'reminder_events', ['scheduled_datetime'])
    op.create_index('ix_reminder_events_status', 'reminder_events', ['status'])

    # Dose Confirmations table
    op.create_table(
        'dose_confirmations',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('reminder_id', sa.String(length=36), sa.ForeignKey('reminder_events.id', ondelete='CASCADE'), nullable=False),
        sa.Column('patient_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('confirmation_type', sa.String(length=50), nullable=False, server_default='app_button'),
        sa.Column('confirmed_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('is_self_reported', sa.Boolean(), nullable=False, server_default='1'),
    )
    op.create_index('ix_dose_confirmations_reminder_id', 'dose_confirmations', ['reminder_id'])
    op.create_index('ix_dose_confirmations_patient_id', 'dose_confirmations', ['patient_id'])

    # Caregiver Relationships table
    op.create_table(
        'caregiver_relationships',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('patient_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('caregiver_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('relationship_type', sa.String(length=100), nullable=True),
        sa.Column('relation_label', sa.String(length=100), nullable=False, server_default='family member'),
        sa.Column('consent_status', sa.String(length=50), nullable=False, server_default='pending'),
        sa.Column('consent_granted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('consent_revoked_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_primary', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('can_view_medicines', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('can_view_schedule', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('can_view_adherence', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('escalation_order', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('contact_method', sa.String(length=50), nullable=False, server_default='both'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint('patient_id', 'caregiver_id', name='uq_patient_caregiver'),
    )

    # Caregiver Alerts table
    op.create_table(
        'caregiver_alerts',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('reminder_id', sa.String(length=36), sa.ForeignKey('reminder_events.id', ondelete='SET NULL'), nullable=True),
        sa.Column('patient_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('caregiver_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('alert_type', sa.String(length=50), nullable=False, server_default='missed_reminder'),
        sa.Column('message_en', sa.Text(), nullable=False),
        sa.Column('message_ta', sa.Text(), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='open'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('acknowledged_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
    )
    op.create_index('ix_caregiver_alerts_patient_id', 'caregiver_alerts', ['patient_id'])
    op.create_index('ix_caregiver_alerts_caregiver_id', 'caregiver_alerts', ['caregiver_id'])

    # Assistance Requests table
    op.create_table(
        'assistance_requests',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('patient_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('reminder_id', sa.String(length=36), sa.ForeignKey('reminder_events.id', ondelete='SET NULL'), nullable=True),
        sa.Column('request_type', sa.String(length=100), nullable=False, server_default='help'),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='open'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
    )

    # Notification Deliveries table
    op.create_table(
        'notification_deliveries',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('reminder_id', sa.String(length=36), sa.ForeignKey('reminder_events.id', ondelete='SET NULL'), nullable=True),
        sa.Column('caregiver_alert_id', sa.String(length=36), sa.ForeignKey('caregiver_alerts.id', ondelete='SET NULL'), nullable=True),
        sa.Column('recipient_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('recipient_type', sa.String(length=50), nullable=False, server_default='patient'),
        sa.Column('channel', sa.String(length=50), nullable=False, server_default='sms'),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='pending'),
        sa.Column('provider_name', sa.String(length=50), nullable=False, server_default='demo'),
        sa.Column('provider_message_id', sa.String(length=255), nullable=True),
        sa.Column('provider_status', sa.String(length=50), nullable=True),
        sa.Column('sent_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('delivered_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('failed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('attempt_number', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('idempotency_key', sa.String(length=128), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_notification_deliveries_recipient_id', 'notification_deliveries', ['recipient_id'])
    op.create_index('ix_notification_deliveries_idempotency_key', 'notification_deliveries', ['idempotency_key'])

    # Chatbot Conversations table
    op.create_table(
        'chatbot_conversations',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('patient_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('session_id', sa.String(length=128), nullable=False),
        sa.Column('messages', sa.JSON(), nullable=False),
        sa.Column('language', sa.String(length=10), nullable=False, server_default='en'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_chatbot_conversations_patient_id', 'chatbot_conversations', ['patient_id'])
    op.create_index('ix_chatbot_conversations_session_id', 'chatbot_conversations', ['session_id'])

    # Audit Logs table
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('user_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('resource_type', sa.String(length=100), nullable=False),
        sa.Column('resource_id', sa.String(length=128), nullable=True),
        sa.Column('old_value', sa.JSON(), nullable=True),
        sa.Column('new_value', sa.JSON(), nullable=True),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )

    # System Settings table
    op.create_table(
        'system_settings',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('key', sa.String(length=100), nullable=False),
        sa.Column('value', sa.JSON(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('updated_by', sa.String(length=36), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_system_settings_key', 'system_settings', ['key'], unique=True)


def downgrade() -> None:
    op.drop_table('system_settings')
    op.drop_table('audit_logs')
    op.drop_table('chatbot_conversations')
    op.drop_table('notification_deliveries')
    op.drop_table('assistance_requests')
    op.drop_table('caregiver_alerts')
    op.drop_table('caregiver_relationships')
    op.drop_table('dose_confirmations')
    op.drop_table('reminder_events')
    op.drop_table('medicine_schedules')
    op.drop_table('medicines')
    op.drop_table('prescriptions')
    op.drop_table('accessibility_preferences')
    op.drop_table('user_profiles')
    op.drop_table('users')
