from app.services.auth_service import (
    create_user,
    authenticate_user,
    get_user_by_email,
    get_user_by_id,
    get_user_by_phone,
)
from app.services.medicine_service import (
    create_medicine,
    get_patient_medicines,
    get_medicine_by_id,
    update_medicine,
    discontinue_medicine,
    validate_medicine_data,
    check_duplicate_medicine,
)
from app.services.reminder_service import (
    generate_reminders_for_schedule,
    get_upcoming_reminders,
    confirm_reminder,
    mark_missed,
    check_escalation_needed,
    process_due_reminders,
)
from app.services.notification_service import (
    send_reminder_notification,
    send_custom_notification,
    record_delivery,
    retry_failed_notifications,
)
from app.services.sms_service import (
    parse_sms_reply,
    process_incoming_sms,
    find_pending_reminder_for_phone,
    is_duplicate_confirmation,
)
from app.services.email_service import (
    send_email,
)
from app.services.chatbot_service import (
    get_patient_context,
    generate_response,
)
from app.services.ocr_service import (
    extract_prescription_text,
    parse_ocr_output,
)
from app.services.escalation_service import (
    check_and_escalate,
    check_pending_escalations,
    send_caregiver_alert,
    resolve_alert,
    get_open_alerts_for_caregiver,
    get_authorized_caregivers,
)
from app.services.report_service import (
    get_reminder_stats,
    get_delivery_stats,
    get_adherence_rate,
    get_adherence_summary,
    get_problem_statement_metrics,
    export_csv,
    get_admin_overview,
)

__all__ = [
    "create_user",
    "authenticate_user",
    "get_user_by_email",
    "get_user_by_id",
    "get_user_by_phone",
    "create_medicine",
    "get_patient_medicines",
    "get_medicine_by_id",
    "update_medicine",
    "discontinue_medicine",
    "validate_medicine_data",
    "check_duplicate_medicine",
    "generate_reminders_for_schedule",
    "get_upcoming_reminders",
    "confirm_reminder",
    "mark_missed",
    "check_escalation_needed",
    "process_due_reminders",
    "send_reminder_notification",
    "send_custom_notification",
    "record_delivery",
    "retry_failed_notifications",
    "parse_sms_reply",
    "process_incoming_sms",
    "find_pending_reminder_for_phone",
    "is_duplicate_confirmation",
    "send_email",
    "get_patient_context",
    "generate_response",
    "extract_prescription_text",
    "parse_ocr_output",
    "check_and_escalate",
    "check_pending_escalations",
    "send_caregiver_alert",
    "resolve_alert",
    "get_open_alerts_for_caregiver",
    "get_authorized_caregivers",
    "get_reminder_stats",
    "get_delivery_stats",
    "get_adherence_rate",
    "get_adherence_summary",
    "get_problem_statement_metrics",
    "export_csv",
    "get_admin_overview",
]
