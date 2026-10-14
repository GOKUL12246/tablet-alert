from typing import Any, Dict

MESSAGES: Dict[str, Dict[str, str]] = {
    "en": {
        "reminder_keypad": "MEDISAKHI: Time for {medicine_name} {strength}. Take {prescribed_quantity} [{visual_desc}]. Follow your prescription. Reply 1=Taken, 2=Help",
        "reminder_greeting": "MEDISAKHI Reminder: Hello {patient_name}, it is time to take your medicine.",
        "reminder_detail": "Medicine: {medicine_name} ({strength}). Visual: [{visual_desc}]. Instructions: {instructions}.",
        "reminder_prompt": "Reply 1=Taken, 2=Help (or reply 'YES' to confirm, 'HELP' for assistance).",
        "confirmation_success": "Thank you, {patient_name}! Your dose of {medicine_name} has been recorded as taken at {time}.",
        "confirmation_duplicate": "Your dose of {medicine_name} was already recorded for this reminder time. Thank you!",
        "missed_alert_first": "Follow-up Reminder: {patient_name}, you have not yet confirmed your {medicine_name} scheduled for {time}.",
        "missed_alert_caregiver": "Your {relation} {patient_name}'s medicine reminder at {time} has not been confirmed. Please check on them.",
        "missed_dose_guidance": "Missed Dose Guidance: Take the missed dose as soon as you remember. If it is almost time for your next scheduled dose, skip the missed dose and resume your regular schedule. Do not take double doses.",
        "assistance_received": "Help request received for {patient_name}. Your primary caregiver has been alerted.",
        "caregiver_link_request": "Caregiver {caregiver_name} has requested access to assist with your medication schedule. Please review and approve in your Medisakhi app.",
        "unknown_reply": "MEDISAKHI: We received your message. Please reply 1=Taken, 2=Help (or YES/HELP).",
    },
    "ta": {
        "reminder_keypad": "MEDISAKHI: {medicine_name} {strength} மருந்து நேரம். {prescribed_quantity} [{visual_desc}] எடுத்துக்கொள்ளுங்கள். உறுதி=1, உதவி=2",
        "reminder_greeting": "மெடிசகி நினைவூட்டல்: வணக்கம் {patient_name}, உங்கள் மருந்தை உட்கொள்ளும் நேரம் வந்துவிட்டது.",
        "reminder_detail": "மருந்து: {medicine_name} ({strength}). அடையாளம்: [{visual_desc}]. குறிப்புகள்: {instructions}.",
        "reminder_prompt": "உறுதிப்படுத்த 1=எடுத்தேன், 2=உதவி (அல்லது 'YES' / 'HELP' அனுப்பவும்).",
        "confirmation_success": "நன்றி, {patient_name}! {medicine_name} மருந்தை {time} மணிக்கு உட்கொண்டது வெற்றிகரமாகப் பதிவு செய்யப்பட்டது.",
        "confirmation_duplicate": "இந்த நேரத்திற்கான {medicine_name} மருந்து ஏற்கனவே பதிவு செய்யப்பட்டுள்ளது. நன்றி!",
        "missed_alert_first": "தொடர் நினைவூட்டல்: {patient_name}, {time} மணிக்கு நீங்கள் உட்கொள்ள வேண்டிய {medicine_name} மருந்து இன்னும் உறுதிப்படுத்தப்படவில்லை.",
        "missed_alert_caregiver": "உங்கள் {relation} {patient_name} {time} மணிக்கு உட்கொள்ள வேண்டிய மருந்து இன்னும் உறுதிப்படுத்தப்படவில்லை. தயவுசெய்து கவனிக்கவும்.",
        "missed_dose_guidance": "தவறிய மருந்திற்கான வழிகாட்டல்: நினைவுக்கு வந்தவுடன் மருந்தை உட்கொள்ளவும். அடுத்த முறைக்கான நேரம் நெருங்கிவிட்டால், தவறவிட்ட அளவைத் தவிர்த்து வழக்கமான அட்டவணையைத் தொடரவும். இரண்டு மடங்கு உட்கொள்ள வேண்டாம்.",
        "assistance_received": "{patient_name} அவர்களுக்கான உதவி கோரிக்கை பெறப்பட்டது. உங்கள் முதன்மை பராமரிப்பாளருக்கு தகவல் தெரிவிக்கப்பட்டுள்ளது.",
        "caregiver_link_request": "பராமரிப்பாளர் {caregiver_name} உங்கள் மருந்து அட்டவணைக்கு அணுகல் கோரியுள்ளார். தயவுசெய்து உங்கள் மெடிசகி செயலியில் சரிபார்த்து அங்கீகரிக்கவும்.",
        "unknown_reply": "மெடிசகி: உங்கள் செய்தி பெறப்பட்டது. உறுதிப்படுத்த 1=எடுத்தேன், 2=உதவி என அனுப்பவும்.",
    }
}


def get_text(key: str, language: str = "en", **kwargs: Any) -> str:
    """Retrieve localized message string formatted with supplied kwargs."""
    lang = language.lower() if language else "en"
    if lang not in MESSAGES:
        lang = "en"

    template = MESSAGES[lang].get(key) or MESSAGES["en"].get(key, key)
    try:
        return template.format(**kwargs)
    except Exception:
        return template
