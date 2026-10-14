from fastapi import APIRouter

from app.api.v1 import (
    admin,
    auth,
    caregivers,
    chatbot,
    medicines,
    notifications,
    patients,
    prescriptions,
    reminders,
    reports,
    schedules,
    webhooks,
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(patients.router)
api_router.include_router(medicines.router)
api_router.include_router(prescriptions.router)
api_router.include_router(schedules.router)
api_router.include_router(reminders.router)
api_router.include_router(caregivers.router)
api_router.include_router(notifications.router)
api_router.include_router(chatbot.router)
api_router.include_router(reports.router)
api_router.include_router(admin.router)
api_router.include_router(webhooks.router)
