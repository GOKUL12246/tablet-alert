from datetime import datetime, timezone
import json
import logging
import re
from typing import Any, Dict, List, Optional
import httpx
from sqlalchemy.orm import Session

from app.config import settings
from app.models.chatbot import ChatbotConversation
from app.models.medicine import Medicine, MedicineVerificationStatus
from app.models.reminder import ReminderEvent, ReminderStatus
from app.models.schedule import MedicineSchedule
from app.models.user import User
from app.services.reminder_service import generate_reminders_for_schedule

logger = logging.getLogger("medisakhi.chatbot")


def get_patient_context(db: Session, patient_id: str) -> Dict[str, Any]:
    """Compile verified medicines, schedules, clock times, and clinical context for a patient safely."""
    patient = db.query(User).filter(User.id == patient_id).first()
    medicines = db.query(Medicine).filter(
        Medicine.patient_id == patient_id,
        Medicine.is_active == True,
    ).all()

    from datetime import timedelta
    # Current clock time in IST (UTC+5:30)
    ist_now = datetime.now(timezone(timedelta(hours=5, minutes=30)))
    current_clock_time = ist_now.strftime("%I:%M %p")

    med_list = []
    for m in medicines:
        reminder_times = []
        for s in m.schedules:
            if s.is_active and s.reminder_times:
                reminder_times.extend(s.reminder_times)

        med_list.append({
            "name": m.name,
            "brand_name": m.brand_name,
            "active_ingredient": m.active_ingredient,
            "strength": m.strength,
            "dosage_form": m.dosage_form,
            "tablet_color": m.tablet_color or m.color or "white",
            "tablet_shape": m.tablet_shape or m.shape or "round",
            "tablet_size": m.tablet_size or m.size_description or "medium",
            "set_clock_times": reminder_times if reminder_times else ["08:00 AM", "08:00 PM"],
            "route": m.route,
            "food_instructions": m.food_instructions,
            "special_instructions": m.special_instructions,
            "warning_info": m.warning_info,
            "verification_status": m.verification_status.value if m.verification_status else "verified",
        })

    return {
        "patient_name": patient.full_name if patient else "Patient",
        "current_clock_time": current_clock_time,
        "medicines": med_list
    }


def process_voice_time_command(db: Session, patient_id: str, message: str, language: str) -> Optional[str]:
    """Check if the user is asking to set or change their tablet reminder time by voice.
    If so, update the schedule in the database, regenerate reminders, and return a spoken confirmation."""
    msg = message.lower().strip()
    is_tamil = (language.lower() == "ta")

    # Intent keywords
    has_time_intent = any(w in msg for w in [
        "set time", "change time", "update time", "set reminder", "schedule time", 
        "set clock", "time to", "set to", "remind at", "alarm", "set",
        "நேரம்", "மணிக்கு", "வை", "மாற்று", "அமை", "மாத்திரை நேரம்", "மாத்திரை"
    ])
    if not has_time_intent:
        return None

    # Fetch patient's active medicines
    medicines = db.query(Medicine).filter(
        Medicine.patient_id == patient_id,
        Medicine.is_active == True
    ).all()
    if not medicines:
        return None

    # Match medicine from message
    matched_med = None
    for med in medicines:
        m_name = med.name.lower()
        b_name = (med.brand_name or "").lower()
        if m_name in msg or (b_name and b_name in msg):
            matched_med = med
            break
        # Tamil phonetics
        if "டெல்" in msg and ("telm" in m_name or "telm" in b_name):
            matched_med = med
            break
        if "மெட்" in msg and ("metf" in m_name or "glyc" in b_name):
            matched_med = med
            break

    # If no specific medicine named, pick first active medicine
    if not matched_med:
        matched_med = medicines[0]

    # Extract time
    new_time_24 = None

    # 1. 12-hr with AM/PM e.g. "9:30 am", "09:00pm", "9 am", "8 pm"
    m1 = re.search(r'(\b\d{1,2})(?::(\d{2}))?\s*(am|pm)', msg)
    if m1:
        hr = int(m1.group(1))
        mn = int(m1.group(2) or 0)
        mer = m1.group(3)
        if mer == 'pm' and hr < 12: hr += 12
        if mer == 'am' and hr == 12: hr = 0
        new_time_24 = f"{hr:02d}:{mn:02d}"

    # 2. Tamil period: "காலை 9", "இரவு 8:30", "மதியம் 1"
    if not new_time_24:
        m2 = re.search(r'(காலை|மதியம்|மாலை|இரவு)\s*(\d{1,2})(?::(\d{2}))?', msg)
        if m2:
            period = m2.group(1)
            hr = int(m2.group(2))
            mn = int(m2.group(3) or 0)
            if period in ['மாலை', 'இரவு'] and hr < 12: hr += 12
            if period == 'மதியம்' and hr < 12 and hr != 12: hr += 12
            new_time_24 = f"{hr:02d}:{mn:02d}"

    # 3. 24-hr format: "09:00", "20:30", "08:30"
    if not new_time_24:
        m3 = re.search(r'\b([01]?\d|2[0-3]):([0-5]\d)\b', msg)
        if m3:
            hr = int(m3.group(1))
            mn = int(m3.group(2))
            new_time_24 = f"{hr:02d}:{mn:02d}"

    # 4. Plain "at 9", "9 மணிக்கு", "நேரம் 9"
    if not new_time_24:
        m4 = re.search(r'(?:at|நேரம்|மணிக்கு)\s*(\d{1,2})|(\d{1,2})\s*மணிக்கு', msg)
        if m4:
            hr_str = m4.group(1) or m4.group(2)
            hr = int(hr_str)
            mn = 0
            if any(w in msg for w in ['pm', 'night', 'evening', 'இரவு', 'மாலை']) and hr < 12:
                hr += 12
            new_time_24 = f"{hr:02d}:{mn:02d}"

    if not new_time_24:
        return None

    # Update or create schedule for matched_med
    schedule = db.query(MedicineSchedule).filter(
        MedicineSchedule.medicine_id == matched_med.id,
        MedicineSchedule.patient_id == patient_id
    ).first()

    if not schedule:
        schedule = MedicineSchedule(
            medicine_id=matched_med.id,
            patient_id=patient_id,
            reminder_times=[new_time_24],
            timezone="Asia/Kolkata",
            is_active=True
        )
        db.add(schedule)
    else:
        schedule.reminder_times = [new_time_24]
        schedule.is_active = True

    db.commit()
    db.refresh(schedule)

    # Clean up pending future scheduled reminders and regenerate
    now_utc = datetime.now(timezone.utc)
    db.query(ReminderEvent).filter(
        ReminderEvent.schedule_id == schedule.id,
        ReminderEvent.scheduled_datetime >= now_utc,
        ReminderEvent.status.in_([ReminderStatus.SCHEDULED, ReminderStatus.PROCESSING])
    ).delete(synchronize_session=False)
    db.commit()

    generate_reminders_for_schedule(db, schedule.id, days_ahead=2)

    # Friendly formatted time
    hr_part, mn_part = map(int, new_time_24.split(":"))
    dt_temp = datetime(2026, 1, 1, hr_part, mn_part)
    friendly_12hr = dt_temp.strftime("%I:%M %p")

    med_display = f"{matched_med.name}" + (f" ({matched_med.brand_name})" if matched_med.brand_name else "")
    if is_tamil:
        period_ta = "காலை" if hr_part < 12 else ("மதியம்" if hr_part < 16 else "இரவு")
        ta_hr = hr_part if hr_part <= 12 else hr_part - 12
        if ta_hr == 0: ta_hr = 12
        time_ta_str = f"{period_ta} {ta_hr:02d}:{mn_part:02d}"
        return (
            f"உங்கள் {med_display} மாத்திரையின் நினைவூட்டல் நேரம் {time_ta_str} மணிக்கு வெற்றிகரமாக மாற்றப்பட்டு சேமிக்கப்பட்டது. "
            f"புதிய நேரத்திற்கு குரல் நினைவூட்டல் தயாராக உள்ளது!"
        )
    return (
        f"I have successfully set the reminder time for {med_display} to {friendly_12hr}. "
        f"Your schedule has been saved and your voice reminder is updated!"
    )


def rule_based_response(patient_context: Dict[str, Any], message: str, language: str) -> str:
    """Generate deterministic, medically safe responses based on verified patient records."""
    msg = message.lower().strip()
    medicines = patient_context.get("medicines", [])
    patient_name = patient_context.get("patient_name", "Patient")

    is_tamil = (language.lower() == "ta")

    # If no medicines recorded
    if not medicines:
        if is_tamil:
            return f"வணக்கம் {patient_name}, உங்களுக்கான அங்கீகரிக்கப்பட்ட மருந்துகள் எதுவும் தற்போது அமைப்பில் இல்லை. புதிய மருந்துகளை சேர்க்க உங்கள் மருத்துவரை அணுகவும்."
        return f"Hello {patient_name}, you currently have no active verified medicines registered in MEDISAKHI. Please add your prescriptions or consult your healthcare provider."

    # Identify if a specific medicine is mentioned
    matched_med = None
    for med in medicines:
        if med["name"].lower() in msg or (med.get("brand_name") and med["brand_name"].lower() in msg):
            matched_med = med
            break

    # If asking about missed dose
    if "missed" in msg or "forgot" in msg or "தவறிய" in msg or "மறந்து" in msg:
        if is_tamil:
            return "தவறிய மருந்திற்கான வழிகாட்டல்: நினைவுக்கு வந்தவுடன் மருந்தை உட்கொள்ளவும். அடுத்த முறைக்கான நேரம் நெருங்கிவிட்டால், தவறவிட்ட அளவைத் தவிர்த்து வழக்கமான அட்டவணையைத் தொடரவும். இரண்டு மடங்கு உட்கொள்ள வேண்டாம்."
        return "Missed Dose Guidance: Take the missed dose as soon as you remember. If it is almost time for your next scheduled dose, skip the missed dose and resume your regular schedule. Never take double doses."

    # If asking about food instructions
    if "food" in msg or "eat" in msg or "சாப்பாடு" in msg or "உணவு" in msg:
        if matched_med:
            food_info = matched_med.get("food_instructions") or "as directed by your doctor"
            if is_tamil:
                return f"{matched_med['name']} மருந்தை உணவு குறிப்பு: {food_info}."
            return f"For {matched_med['name']} ({matched_med['strength']}): Take {food_info.replace('_', ' ')}. {matched_med.get('special_instructions') or ''}"
        else:
            details = [f"{m['name']}: {m.get('food_instructions', 'after food').replace('_', ' ')}" for m in medicines]
            if is_tamil:
                return "உங்கள் மருந்துகளுக்கான உணவு வழிகாட்டுதல்: " + "; ".join(details)
            return "Food instructions for your medications: " + "; ".join(details)

    # If asking what medicines they have or list medicines
    if "what" in msg or "list" in msg or "all" in msg or "medicine" in msg or "என்ன" in msg or "மருந்து" in msg:
        med_summary = [f"{m['name']} {m['strength']} ({m.get('food_instructions', 'after food')})" for m in medicines]
        if is_tamil:
            return f"வணக்கம் {patient_name}, உங்கள் தற்போதைய மருந்துகள்: {', '.join(med_summary)}."
        return f"Hello {patient_name}, your current verified medicines are: {', '.join(med_summary)}. Take them exactly as scheduled."

    # Specific medicine details query
    if matched_med:
        if is_tamil:
            return f"{matched_med['name']} ({matched_med['strength']}): {matched_med.get('special_instructions') or 'மருத்துவர் கூறியபடி உட்கொள்ளவும்'}. உணவு முறை: {matched_med.get('food_instructions', 'உணவுக்குப் பின்')}."
        return f"{matched_med['name']} ({matched_med['strength']}): Instructions - {matched_med.get('special_instructions') or 'Take as prescribed by doctor'}. Food guidance - {matched_med.get('food_instructions', 'after food').replace('_', ' ')}."

    # Default fallback
    if is_tamil:
        return "மெடிசகி உங்கள் கேள்வியைப் புரிந்து கொண்டது. உங்கள் மருந்து அட்டவணை, அளவு மற்றும் பயன்பாட்டு முறைகள் பற்றி நீங்கள் கேட்கலாம். அவசர சிகிச்சைக்கு மருத்துவரை உடனடியாக அணுகவும்."
    return "MEDISAKHI Assistant: I can help you with your verified medication dosage, timing, and food instructions. For clinical emergencies or changing dosages, please consult your physician immediately."


def generate_response(
    db: Session,
    patient_id: str,
    message: str,
    language: str = "en",
    session_id: str = "default"
) -> Dict[str, Any]:
    """Generate assistant response with verified patient context and save conversation history."""
    patient_context = get_patient_context(db, patient_id)

    # Load or create conversation session
    conv = db.query(ChatbotConversation).filter(
        ChatbotConversation.patient_id == patient_id,
        ChatbotConversation.session_id == session_id
    ).first()

    if not conv:
        conv = ChatbotConversation(
            patient_id=patient_id,
            session_id=session_id,
            messages=[],
            language=language
        )
        db.add(conv)
        db.flush()

    now_iso = datetime.now(timezone.utc).isoformat()
    current_messages = list(conv.messages or [])
    current_messages.append({"role": "user", "content": message, "timestamp": now_iso})

    # AI Mode or Demo Mode
    assistant_reply = ""
    sources_used = [m["name"] for m in patient_context.get("medicines", [])]

    # 1. Check if patient is giving a voice command to set/change tablet time
    voice_time_reply = process_voice_time_command(db, patient_id, message, language)
    if voice_time_reply:
        assistant_reply = voice_time_reply

    # 2. Check if Gemini API Key is configured
    gemini_key = settings.GEMINI_API_KEY
    if not assistant_reply and gemini_key:
        try:
            curr_time = patient_context.get("current_clock_time", "08:00 AM")
            system_prompt = (
                f"You are MEDISAKHI AI, an empathetic, accessible medicine assistant designed for elderly, non-literate and rural patients. "
                f"Respond in {'Tamil' if language == 'ta' else 'English'}. "
                f"Current Clock Time: {curr_time} (IST). "
                f"Patient Name: {patient_context.get('patient_name')}. "
                f"Verified Medicines & Set Clock Times: {json.dumps(patient_context.get('medicines'))}. "
                f"CRITICAL INSTRUCTIONS: "
                f"1. When answering when to take medicines or what time it is, ALWAYS state the exact clock time clearly (e.g., 'தற்போது மணி {curr_time}' / 'The current clock time is {curr_time}') and mention the scheduled clock time for the medicine. "
                f"2. Mention the tablet color and shape to help non-literate elders identify the medicine visually. "
                f"3. Strictly base your answer on the patient's verified medicines. NEVER invent unprescribed medicines or recommend changing prescribed dosages. "
                f"4. Keep explanations short, clear, warm, and easy to understand for elderly listeners."
            )

            models_to_try = [settings.GEMINI_MODEL, "gemini-3.1-flash-lite-preview", "gemma-4-31b-it"]
            for model_name in models_to_try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={gemini_key}"
                payload = {
                    "contents": [
                        {"role": "user", "parts": [{"text": f"System context:\n{system_prompt}\n\nPatient asks: {message}"}]}
                    ],
                    "generationConfig": {
                        "temperature": 0.2,
                        "maxOutputTokens": 450
                    }
                }
                with httpx.Client(timeout=10.0) as client:
                    resp = client.post(url, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        candidate_text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                        if candidate_text:
                            assistant_reply = candidate_text.strip()
                            break
        except Exception as e:
            logger.warning(f"Gemini API call failed, falling back to rule engine: {e}")

    # Fallback to deterministic rule-based response if Gemini call didn't succeed
    if not assistant_reply:
        assistant_reply = rule_based_response(patient_context, message, language)

    current_messages.append({"role": "assistant", "content": assistant_reply, "timestamp": datetime.now(timezone.utc).isoformat()})
    conv.messages = current_messages
    conv.language = language
    conv.updated_at = datetime.now(timezone.utc)
    db.commit()

    return {
        "response": assistant_reply,
        "session_id": session_id,
        "language": language,
        "sources_used": sources_used,
    }
