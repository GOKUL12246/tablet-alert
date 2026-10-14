# MEDISAKHI AI
### "Your Medicine. Your Language. Your Safety."

An AI-powered smart medicine assistance and caregiver alert platform designed for elderly users, people with low literacy, and people with disabilities. Supports **Tamil and English** with voice guidance, SMS reminders for basic phones, and caregiver escalation workflows.

---

## 🏗️ Project Structure

```
medisakhi-ai/
├── frontend/          # React + TypeScript + Vite + Tailwind CSS
├── backend/           # Python + FastAPI + SQLAlchemy + APScheduler
├── tests/             # Integration and E2E tests
├── docs/              # Architecture, API, and setup documentation
├── .env.example       # Environment variable template
├── docker-compose.yml # Full-stack Docker setup
└── README.md
```

---

## ⚡ Quick Start (Local Development)

### Prerequisites
- Python 3.11+
- Node.js 18+
- Git

### 1. Clone and configure environment

```bash
git clone <repo-url>
cd medisakhi-ai
cp .env.example .env
# Edit .env with your settings (demo mode works without any API keys)
```

### 2. Start the Backend

```bash
cd backend
pip install -r requirements.txt

# Initialize database and run migrations
alembic upgrade head

# Seed with demo data (fictional patients)
python seed_data.py

# Start the API server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend runs at: http://localhost:8000
API docs at: http://localhost:8000/docs

### 3. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: http://localhost:5173

---

## 🐳 Docker (Full Stack)

```bash
docker-compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## 🔑 Demo Credentials

> ⚠️ **DEMO DATA ONLY** — All names and medical records are completely fictional.

| Role | Email | Password |
|------|-------|----------|
| Patient | patient@demo.medisakhi | Demo@1234 |
| Caregiver | caregiver@demo.medisakhi | Demo@1234 |
| Healthcare Professional | doctor@demo.medisakhi | Demo@1234 |
| Administrator | admin@demo.medisakhi | Demo@1234 |

---

## 🌐 Features

### Core Features
- ✅ Tamil and English interface with text-to-speech
- ✅ Medicine management with prescription upload
- ✅ Prescription OCR extraction (demo mode included)
- ✅ Smart reminder engine with configurable scheduling
- ✅ Caregiver escalation workflow
- ✅ MediFriend AI chatbot (demo mode + AI API)
- ✅ SMS support for basic/keypad phones
- ✅ Adherence reports and analytics

### Accessibility
- ✅ WCAG-guided design
- ✅ Screen reader compatible (ARIA)
- ✅ Keyboard navigation
- ✅ High contrast mode
- ✅ Large text mode
- ✅ Reduced motion mode
- ✅ Voice input and output
- ✅ Large touch targets

### User Roles
- **Patient** — Medicine management, reminders, chatbot
- **Caregiver** — Alert monitoring, adherence tracking, patient connection
- **Healthcare Professional** — Prescription verification, record review
- **Administrator** — System configuration, audit logs, reports

---

## 🔌 Configuring External Services

### AI Chatbot (MediFriend)
Set in `.env`:
```
AI_PROVIDER=openai        # or 'gemini' or 'demo'
OPENAI_API_KEY=sk-...
```
Without a key, MediFriend uses a rule-based demo mode clearly labelled as "Demo Mode".

### SMS Provider (for basic phone support)
```
SMS_PROVIDER=twilio       # or 'msg91' or 'demo'
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+91...
```
Without credentials, the app uses a simulation mode that logs messages to the console.

**Webhook URL** for incoming SMS (e.g. Twilio):
```
https://your-domain/api/v1/webhooks/sms/incoming
```

### OCR Service
```
OCR_PROVIDER=google       # or 'tesseract' or 'demo'
GOOGLE_CLOUD_VISION_API_KEY=...
```

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
pip install pytest pytest-asyncio
pytest tests/ -v
```

### Frontend Tests
```bash
cd frontend
npm test
```

---

## 📊 API Documentation

Full OpenAPI docs available at: http://localhost:8000/docs

Key API groups:
- `/api/v1/auth` — Authentication
- `/api/v1/medicines` — Medicine management
- `/api/v1/schedules` — Reminder schedules
- `/api/v1/reminders` — Reminder events and confirmations
- `/api/v1/caregivers` — Caregiver linking and alerts
- `/api/v1/chatbot` — MediFriend AI assistant
- `/api/v1/reports` — Adherence analytics
- `/api/v1/webhooks` — SMS provider webhooks
- `/api/v1/admin` — Administration

---

## 🔒 Privacy and Security

- Passwords hashed with bcrypt
- JWT authentication with expiry
- Role-based access control (RBAC)
- Patient-caregiver consent required
- Audit logging for all sensitive operations
- API keys stored server-side only, never in frontend
- Webhook signature verification
- Input validation with Pydantic

> **Important:** Before using with real patient data, consult a qualified privacy and security professional and ensure compliance with applicable Indian healthcare data regulations.

---

## ⚠️ Important Disclaimers

- This platform is a **medicine assistance and adherence support tool**
- It does **not** independently prescribe medicines or replace doctors or pharmacists
- Patient-reported dose confirmations are **self-reported** and not independently verified
- OCR extraction must be **reviewed and confirmed** before being treated as verified
- Unacknowledged reminders are labeled as "confirmation not received" — **not** as "dose skipped"
- Demo data is completely **fictional** — no real patient information is used

---

## 📋 Escalation Workflow

```
T+0 min  → Reminder sent via configured channels
T+10 min → Follow-up reminder if no acknowledgement
T+20 min → Primary caregiver notified
T+30 min → Secondary caregiver notified (if configured)
```
All intervals are configurable in `.env` or admin settings.

---

## 🗺️ Roadmap / Remaining Integration Requirements

- [ ] Real-time WebSocket notifications
- [ ] IVR / voice-call provider integration (Exotel, Twilio Voice)
- [ ] Playwright E2E test suite
- [ ] PDF report export
- [ ] Push notifications (PWA / Firebase)
- [ ] Multi-language support expansion (Hindi, Telugu)
- [ ] Doctor/pharmacy portal integration
- [ ] ABDM (Ayushman Bharat Digital Mission) compliance review

---

## 📜 License

This project is for demonstration and development purposes. Review applicable licenses before deployment.
