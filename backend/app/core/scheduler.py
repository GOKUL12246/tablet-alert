import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.database import SessionLocal

logger = logging.getLogger("medisakhi.scheduler")

scheduler = AsyncIOScheduler()


def run_process_due_reminders():
    """Job wrapper to process due reminders."""
    from app.services.reminder_service import process_due_reminders
    db = SessionLocal()
    try:
        process_due_reminders(db)
    except Exception as e:
        logger.error(f"Error running process_due_reminders job: {e}", exc_info=True)
    finally:
        db.close()


def run_check_escalations():
    """Job wrapper to check reminder escalations."""
    from app.services.escalation_service import check_pending_escalations
    db = SessionLocal()
    try:
        check_pending_escalations(db)
    except Exception as e:
        logger.error(f"Error running run_check_escalations job: {e}", exc_info=True)
    finally:
        db.close()


def run_retry_failed_notifications():
    """Job wrapper to retry failed notifications."""
    from app.services.notification_service import retry_failed_notifications
    db = SessionLocal()
    try:
        retry_failed_notifications(db)
    except Exception as e:
        logger.error(f"Error running retry_failed_notifications job: {e}", exc_info=True)
    finally:
        db.close()


def start_scheduler():
    """Start APScheduler jobs."""
    if not scheduler.running:
        scheduler.add_job(
            run_process_due_reminders,
            "interval",
            minutes=1,
            id="process_due_reminders",
            replace_existing=True
        )
        scheduler.add_job(
            run_check_escalations,
            "interval",
            minutes=5,
            id="check_escalations",
            replace_existing=True
        )
        scheduler.add_job(
            run_retry_failed_notifications,
            "interval",
            minutes=10,
            id="retry_failed_notifications",
            replace_existing=True
        )
        scheduler.start()
        logger.info("APScheduler background jobs started successfully.")


def shutdown_scheduler():
    """Shutdown APScheduler."""
    try:
        if scheduler.running:
            scheduler.shutdown(wait=False)
            logger.info("APScheduler stopped.")
    except Exception as e:
        logger.warning(f"Error shutting down scheduler: {e}")
