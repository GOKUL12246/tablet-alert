# MEDISAKHI AI — Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT TIER                              │
│                                                                 │
│  ┌─────────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Web Browser    │  │ Basic Phone  │  │  Screen Reader   │  │
│  │ React/TypeScript│  │ (SMS/IVR)    │  │  Keyboard Nav    │  │
│  └────────┬────────┘  └──────┬───────┘  └────────┬─────────┘  │
└───────────┼──────────────────┼──────────────────┼─────────────┘
            │ HTTPS REST       │ SMS/Voice         │ ARIA
            ▼                  ▼                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API TIER                                 │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   FastAPI Application                    │  │
│  │                                                          │  │
│  │  Auth  │ Medicines │ Schedules │ Reminders │ Caregivers  │  │
│  │  ──────   ─────────   ─────────   ─────────   ─────────  │  │
│  │  Chatbot │ Reports │  Admin   │  Webhooks │ Prescriptions│  │
│  └──────┬───────────────────────────────────────────────────┘  │
│         │                                                        │
│  ┌──────┴───────────────────────────────────────────────────┐  │
│  │                   Service Layer                          │  │
│  │                                                          │  │
│  │  AuthService │ MedicineService │ ReminderService         │  │
│  │  NotificationService │ ChatbotService │ OCRService       │  │
│  │  EscalationService │ ReportService │ SMSService          │  │
│  └──────┬───────────────────────────────────────────────────┘  │
│         │                                                        │
│  ┌──────┴─────────────────────────────────────────────────┐    │
│  │              APScheduler (Background Jobs)              │    │
│  │  - process_due_reminders (every 1 min)                  │    │
│  │  - check_escalations (every 5 min)                      │    │
│  │  - retry_failed_notifications (every 10 min)            │    │
│  └──────┬──────────────────────────────────────────────────┘    │
└─────────┼───────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DATA TIER                                 │
│                                                                 │
│  ┌──────────────────────┐    ┌───────────────────────────────┐ │
│  │   SQLite (dev)       │    │  PostgreSQL (production)       │ │
│  │   medisakhi.db       │    │  medisakhi_db                  │ │
│  └──────────────────────┘    └───────────────────────────────┘ │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   File Storage                           │  │
│  │   uploads/ (prescriptions, packaging images)             │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                            │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ SMS      │  │ AI/LLM   │  │ OCR      │  │ Email        │  │
│  │ Provider │  │ Provider │  │ Provider │  │ Provider     │  │
│  │ Twilio/  │  │ OpenAI/  │  │ Google/  │  │ SMTP         │  │
│  │ MSG91    │  │ Gemini   │  │ Tesseract│  │              │  │
│  │ [demo]   │  │ [demo]   │  │ [demo]   │  │ [demo]       │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Database Entity Relationship

```
Users ──────────────────────────────────┐
  │                                     │
  ├── PatientProfile                    │
  ├── AccessibilityPreferences          │
  │                                     │
  ├── Medicines ──────────────────┐     │
  │     │                        │     │
  │     ├── Prescriptions        │     │
  │     └── MedicineSchedules ──┐│     │
  │                             ││     │
  │                         ReminderEvents
  │                             │
  │                             ├── DoseConfirmations
  │                             ├── CaregiverAlerts
  │                             ├── AssistanceRequests
  │                             └── NotificationDeliveries
  │
  └── CaregiverRelationships (patient_id + caregiver_id)
        │
        └── CaregiverAlerts

AuditLogs (references Users, any resource)
SystemSettings
ChatbotConversations
```

## Reminder Escalation Flow

```
Scheduled Time
      │
      ▼
  Send Reminder ──────── NotificationDelivery.status = sent
      │
      │ (10 min no ack)
      ▼
  Follow-up Reminder ─── NotificationDelivery.status = sent
      │
      │ (20 min no ack)
      ▼
  Notify Primary ──────── CaregiverAlert created
  Caregiver               status = open
      │
      │ (30 min no ack, alert unresolved)
      ▼
  Notify Secondary ─────── CaregiverAlert created (level 2)
  Caregiver

  Patient Confirms ──────► ReminderEvent.status = patient_reported_taken
  at any point            DoseConfirmation created
                          Escalation cancelled
                          CaregiverAlerts cancelled if open
```

## Security Model

### Authentication
- JWT Bearer tokens (HS256)
- 24-hour token expiry (configurable)
- bcrypt password hashing

### Authorization
- Role-based (patient, caregiver, healthcare_professional, admin)
- Patient-level ownership checks on all medicine/schedule/reminder operations
- Caregiver access requires explicit patient consent (CaregiverRelationship.consent_status = approved)
- Admin endpoints require admin role
- No implicit trust of patient_id from request body — always resolved from JWT

### Data Privacy
- Prescription files stored in protected uploads directory
- File access via authenticated API endpoint, not public URLs
- AI API calls made server-side only
- SMS provider credentials server-side only
- Audit logging for all sensitive changes

## Notification Provider Abstraction

```python
class NotificationProvider(ABC):
    @abstractmethod
    async def send_sms(self, to: str, message: str, idempotency_key: str) -> DeliveryResult: ...
    
    @abstractmethod
    async def send_email(self, to: str, subject: str, body: str) -> DeliveryResult: ...
    
    @abstractmethod
    async def get_delivery_status(self, provider_message_id: str) -> DeliveryStatus: ...

class DemoProvider(NotificationProvider):
    # Logs to file, simulates delivery — clearly labelled DEMO
    
class TwilioProvider(NotificationProvider):
    # Real Twilio REST API integration

class MSG91Provider(NotificationProvider):
    # Real MSG91 API integration
```

## Metric Definitions (Reports)

| Metric | Definition | Denominator |
|--------|-----------|-------------|
| Notification Delivery Rate | Notifications confirmed delivered by provider ÷ notifications with known outcome | Only reminders with known delivery status |
| Reminder Acknowledgement Rate | Acknowledged reminders ÷ eligible reminders in period | Excludes cancelled reminders |
| Patient-Reported Dose Confirmation Rate | Reminders confirmed by patient ÷ eligible reminders | Excludes cancelled reminders |
| Avg Escalation Time | Mean time from scheduled reminder to caregiver notification | Only escalated reminders |
| Caregiver Response Time | Mean time from alert creation to alert acknowledgement | Only acknowledged alerts |

> **Note:** Patient-reported dose confirmation is self-reported and not independently verified physical consumption.
