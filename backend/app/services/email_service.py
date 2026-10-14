import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Any, Dict, Optional
from datetime import datetime
import uuid

from app.config import settings

logger = logging.getLogger("medisakhi.email")


def send_email(
    to_email: str,
    subject: str,
    content_html: str,
    content_text: Optional[str] = None
) -> Dict[str, Any]:
    """Send an email using configured provider (Live Gmail SMTP SSL or fallback)."""
    recipient = to_email or settings.GMAIL_RECEIVER or "g17670714@gmail.com"
    sender = settings.GMAIL_SENDER or "g17670714@gmail.com"
    password = settings.GMAIL_APP_PASSWORD or "hexe syjd dfyv wbal"

    logger.info(f"[EMAIL INITIATED] To: {recipient} | Subject: {subject}")

    # If provider is configured for Gmail or live SMTP
    if settings.EMAIL_PROVIDER in ["gmail", "smtp"] and sender and password:
        try:
            from email.header import Header
            msg = MIMEMultipart("alternative")
            msg["Subject"] = Header(subject, "utf-8")
            msg["From"] = f"MEDISAKHI AI Alert <{sender}>"
            msg["To"] = recipient

            text_part = content_text or "MEDISAKHI AI Emergency Medication Alert"
            msg.attach(MIMEText(text_part, "plain", "utf-8"))
            msg.attach(MIMEText(content_html, "html", "utf-8"))

            with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=12) as server:
                server.login(sender, password)
                server.sendmail(sender, [recipient], msg.as_string())

            logger.info(f"[EMAIL SUCCESS] Live alert email dispatched successfully to {recipient}")
            return {
                "success": True,
                "to": recipient,
                "subject": subject,
                "provider": "gmail_smtp_live",
                "message_id": f"gmail-{uuid.uuid4().hex[:12]}",
                "error": None
            }
        except Exception as e:
            logger.error(f"[EMAIL ERROR] Failed to send via Gmail SMTP: {e}")
            return {
                "success": False,
                "to": recipient,
                "subject": subject,
                "provider": "gmail_smtp",
                "error": str(e)
            }

    # Simulation fallback
    logger.info(f"[SIMULATED EMAIL] To: {recipient} | Subject: {subject}")
    return {
        "success": True,
        "to": recipient,
        "subject": subject,
        "provider": "simulation",
        "message_id": f"mail-sim-{uuid.uuid4().hex[:12]}",
        "error": None
    }


def send_caretaker_emergency_alert_email(
    patient_name: str,
    medicine_name: str,
    strength: str,
    scheduled_time: str,
    color: str = "white",
    shape: str = "round",
    food_instructions: str = "after food",
    to_email: Optional[str] = None
) -> Dict[str, Any]:
    """Send an immediate emergency notification email to the caregiver when patient misses dose."""
    dest_email = to_email or settings.GMAIL_RECEIVER or "g17670714@gmail.com"
    subject = f"🚨 [MEDISAKHI URGENT ALERT] Patient {patient_name} Did Not Respond to Alarm for {medicine_name}"

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }}
        .card {{ max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1); border: 2px solid #ef4444; }}
        .header {{ background: #dc2626; color: #ffffff; padding: 24px; text-align: center; }}
        .header h1 {{ margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }}
        .header p {{ margin: 6px 0 0 0; opacity: 0.95; font-size: 14px; font-weight: 500; }}
        .body {{ padding: 24px; }}
        .alert-box {{ background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 16px; margin-bottom: 20px; }}
        .alert-box p {{ margin: 0; color: #991b1b; font-size: 15px; font-weight: 600; line-height: 1.5; }}
        .info-table {{ width: 100%; border-collapse: collapse; margin-bottom: 24px; }}
        .info-table td {{ padding: 12px 14px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }}
        .info-table td.label {{ color: #64748b; font-weight: 600; width: 40%; background: #f8fafc; }}
        .info-table td.value {{ color: #0f172a; font-weight: 700; }}
        .badge {{ display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; }}
        .badge-red {{ background: #fee2e2; color: #b91c1c; }}
        .cta {{ background: #2563eb; color: #ffffff; text-align: center; padding: 14px 20px; border-radius: 12px; text-decoration: none; font-weight: bold; display: block; margin-top: 10px; font-size: 16px; }}
        .footer {{ padding: 16px 24px; background: #f1f5f9; text-align: center; font-size: 12px; color: #64748b; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>🚨 MEDISAKHI AI CAREGIVER ALERT</h1>
          <p>Automated Adherence Protection System</p>
        </div>
        <div class="body">
          <div class="alert-box">
            <p>⚠️ <strong>ATTENTION REQUIRED:</strong> Patient <strong>{patient_name}</strong> was alerted at <strong>{scheduled_time}</strong> but has NOT confirmed taking their prescribed tablet.</p>
          </div>

          <table class="info-table">
            <tr>
              <td class="label">Patient Name</td>
              <td class="value">{patient_name}</td>
            </tr>
            <tr>
              <td class="label">Prescribed Medicine</td>
              <td class="value">{medicine_name} {strength}</td>
            </tr>
            <tr>
              <td class="label">Scheduled Alarm Time</td>
              <td class="value">{scheduled_time}</td>
            </tr>
            <tr>
              <td class="label">Tablet Appearance</td>
              <td class="value">{color.capitalize()} {shape.capitalize()} Tablet</td>
            </tr>
            <tr>
              <td class="label">Food Instructions</td>
              <td class="value">{food_instructions.replace('_', ' ').capitalize()}</td>
            </tr>
            <tr>
              <td class="label">Alarm Status</td>
              <td class="value"><span class="badge badge-red">Unacknowledged / No Response</span></td>
            </tr>
          </table>

          <p style="font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 16px;">
            Please contact the patient or visit them immediately to assist them with taking their medication safely.
          </p>

          <a href="tel:+919876543210" class="cta">📞 Call Patient Directly</a>
        </div>
        <div class="footer">
          MEDISAKHI AI &bull; Your Medicine. Your Language. Your Safety.<br>
          Notification generated automatically at {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}.
        </div>
      </div>
    </body>
    </html>
    """

    plain = (
        f"MEDISAKHI AI URGENT CAREGIVER ALERT\n\n"
        f"Patient {patient_name} did NOT respond to the medicine alarm at {scheduled_time}.\n\n"
        f"Medicine: {medicine_name} {strength}\n"
        f"Visual Appearance: {color} {shape} tablet\n"
        f"Instructions: {food_instructions}\n"
        f"Status: No response from patient.\n\n"
        f"Please check on or contact the patient immediately!"
    )

    return send_email(to_email=dest_email, subject=subject, content_html=html, content_text=plain)


def send_low_stock_alert_email(
    patient_name: str,
    medicine_name: str,
    strength: str,
    remaining_tablets: int,
    total_tablets: int = 30,
    to_email: Optional[str] = None
) -> Dict[str, Any]:
    """Send low medicine inventory warning email to caregiver when remaining tablets <= 10."""
    dest_email = to_email or settings.GMAIL_RECEIVER or "g17670714@gmail.com"
    subject = f"⚠️ [MEDISAKHI STOCK ALERT] Only {remaining_tablets} Tablets Left: {medicine_name} for {patient_name}"

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }}
        .card {{ max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1); border: 2px solid #f59e0b; }}
        .header {{ background: #d97706; color: #ffffff; padding: 24px; text-align: center; }}
        .header h1 {{ margin: 0; font-size: 22px; font-weight: 800; }}
        .header p {{ margin: 6px 0 0 0; opacity: 0.95; font-size: 14px; font-weight: 500; }}
        .body {{ padding: 24px; }}
        .alert-box {{ background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 16px; margin-bottom: 20px; }}
        .alert-box p {{ margin: 0; color: #92400e; font-size: 15px; font-weight: 600; line-height: 1.5; }}
        .info-table {{ width: 100%; border-collapse: collapse; margin-bottom: 24px; }}
        .info-table td {{ padding: 12px 14px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }}
        .info-table td.label {{ color: #64748b; font-weight: 600; width: 40%; background: #f8fafc; }}
        .info-table td.value {{ color: #0f172a; font-weight: 700; }}
        .badge-warning {{ display: inline-block; padding: 6px 12px; border-radius: 9999px; font-size: 13px; font-weight: 800; background: #fef3c7; color: #b45309; border: 1px solid #fcd34d; }}
        .cta {{ background: #2563eb; color: #ffffff; text-align: center; padding: 14px 20px; border-radius: 12px; text-decoration: none; font-weight: bold; display: block; margin-top: 10px; font-size: 16px; }}
        .footer {{ padding: 16px 24px; background: #f1f5f9; text-align: center; font-size: 12px; color: #64748b; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>⚠️ LOW MEDICINE STOCK ALERT</h1>
          <p>Prescription Inventory Depletion Warning</p>
        </div>
        <div class="body">
          <div class="alert-box">
            <p>🔔 <strong>REFILL REQUIRED:</strong> Patient <strong>{patient_name}</strong>'s medicine <strong>{medicine_name}</strong> is running low. Only <strong>{remaining_tablets} tablets</strong> are remaining in stock!</p>
          </div>

          <table class="info-table">
            <tr>
              <td class="label">Patient Name</td>
              <td class="value">{patient_name}</td>
            </tr>
            <tr>
              <td class="label">Medicine Name</td>
              <td class="value">{medicine_name} {strength}</td>
            </tr>
            <tr>
              <td class="label">Available Stock</td>
              <td class="value"><span class="badge-warning">⚠️ {remaining_tablets} / {total_tablets} Tablets Remaining</span></td>
            </tr>
            <tr>
              <td class="label">Alert Reason</td>
              <td class="value">Inventory fell below the 10-tablet minimum safe reserve</td>
            </tr>
          </table>

          <p style="font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 16px;">
            Please visit the pharmacy or order a refill strip/box for the patient immediately so their medication routine is not interrupted.
          </p>

          <a href="tel:+919876543210" class="cta">📞 Contact Patient / Pharmacist</a>
        </div>
        <div class="footer">
          MEDISAKHI AI &bull; Your Medicine. Your Language. Your Safety.<br>
          Automated daily inventory monitoring.
        </div>
      </div>
    </body>
    </html>
    """

    plain = (
        f"MEDISAKHI AI LOW MEDICINE STOCK ALERT\n\n"
        f"Patient: {patient_name}\n"
        f"Medicine: {medicine_name} {strength}\n"
        f"Remaining Stock: {remaining_tablets} tablets left out of {total_tablets}\n\n"
        f"Notice: Medicine inventory is running low (<= 10 tablets). Please order or refill this prescription soon!"
    )

    return send_email(to_email=dest_email, subject=subject, content_html=html, content_text=plain)
