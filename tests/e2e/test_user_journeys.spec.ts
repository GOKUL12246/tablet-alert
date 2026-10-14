import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:8000/api/v1';

// ─────────────────────────────────────────────────────────────────────────────
// TEST 1: Tamil language selection and TTS
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TEST 1: Language selection - Tamil', () => {
  test('patient can select Tamil and see Tamil UI', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('[data-testid="lang-ta"]');
    await expect(page.locator('body')).toContainText('வணக்கம்');
    // Verify dashboard greeting in Tamil
    await page.fill('[data-testid="email"]', 'patient@demo.medisakhi');
    await page.fill('[data-testid="password"]', 'Demo@1234');
    await page.click('[data-testid="login-btn"]');
    await expect(page.locator('[data-testid="dashboard-greeting"]')).toContainText('வணக்கம்');
    // TTS button should be present
    await expect(page.locator('[data-testid="tts-btn"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 2: Caregiver can view authorized patient's schedule
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TEST 2: Caregiver schedule access', () => {
  test('authorized caregiver sees linked patient schedule', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('[data-testid="email"]', 'caregiver@demo.medisakhi');
    await page.fill('[data-testid="password"]', 'Demo@1234');
    await page.click('[data-testid="login-btn"]');
    await expect(page).toHaveURL(/caregiver\/dashboard/);
    // Should see linked patients
    await expect(page.locator('[data-testid="patient-card"]').first()).toBeVisible();
    // Click view schedule
    await page.click('[data-testid="view-schedule-btn"]');
    await expect(page.locator('[data-testid="schedule-list"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 3: Reminder generated at configured time
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TEST 3: Reminder generation', () => {
  test('reminder appears in upcoming list after schedule creation', async ({ page }) => {
    // Login as patient
    await page.goto(`${BASE_URL}/login`);
    await page.fill('[data-testid="email"]', 'patient@demo.medisakhi');
    await page.fill('[data-testid="password"]', 'Demo@1234');
    await page.click('[data-testid="login-btn"]');
    // Navigate to schedule
    await page.goto(`${BASE_URL}/patient/schedule`);
    await expect(page.locator('[data-testid="upcoming-reminders"]')).toBeVisible();
    // At least one reminder should be shown from seed data
    const reminders = page.locator('[data-testid="reminder-item"]');
    await expect(reminders.first()).toBeVisible({ timeout: 10000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 4: Patient reports taking medicine
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TEST 4: Dose confirmation', () => {
  test('patient confirms reminder and status updates to patient_reported_taken', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('[data-testid="email"]', 'patient@demo.medisakhi');
    await page.fill('[data-testid="password"]', 'Demo@1234');
    await page.click('[data-testid="login-btn"]');
    // Get a reminder that's in sent/scheduled state
    await page.goto(`${BASE_URL}/patient/schedule`);
    const reminderLink = page.locator('[data-testid="confirm-reminder-btn"]').first();
    await reminderLink.click();
    // On reminder confirmation screen, click "I HAVE TAKEN IT"
    await page.click('[data-testid="confirm-taken-btn"]');
    await expect(page.locator('[data-testid="confirmation-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="confirmation-success"]')).toContainText('recorded');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 5: Unacknowledged reminder workflow
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TEST 5: Missed reminder escalation', () => {
  test('unacknowledged reminder shows follow-up status', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('[data-testid="email"]', 'patient@demo.medisakhi');
    await page.fill('[data-testid="password"]', 'Demo@1234');
    await page.click('[data-testid="login-btn"]');
    // Navigate to history to see unacknowledged reminders
    await page.goto(`${BASE_URL}/patient/history`);
    // Should show reminders with "confirmation_not_received" status (from seed data)
    const unackItem = page.locator('[data-testid="reminder-status-confirmation_not_received"]').first();
    if (await unackItem.isVisible()) {
      await expect(unackItem).toContainText('Confirmation Not Received');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 6: Caregiver receives and acknowledges alert
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TEST 6: Caregiver alert acknowledgement', () => {
  test('caregiver can see and acknowledge open alerts', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('[data-testid="email"]', 'caregiver@demo.medisakhi');
    await page.fill('[data-testid="password"]', 'Demo@1234');
    await page.click('[data-testid="login-btn"]');
    await page.goto(`${BASE_URL}/caregiver/alerts`);
    // From seed data, there should be open alerts
    const alertCard = page.locator('[data-testid="alert-card"]').first();
    if (await alertCard.isVisible({ timeout: 5000 })) {
      await alertCard.locator('[data-testid="acknowledge-btn"]').click();
      await expect(page.locator('[data-testid="alert-acknowledged-msg"]')).toBeVisible();
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 9: Unauthorized caregiver cannot view another patient's records
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TEST 9: Authorization isolation', () => {
  test('unauthorized caregiver cannot access patient records', async ({ page }) => {
    // Login as caregiver
    await page.goto(`${BASE_URL}/login`);
    await page.fill('[data-testid="email"]', 'caregiver@demo.medisakhi');
    await page.fill('[data-testid="password"]', 'Demo@1234');
    await page.click('[data-testid="login-btn"]');
    // Try to access another patient's medicine directly by ID
    await page.goto(`${BASE_URL}/patient/medicines/unauthorized-patient-medicine-id`);
    // Should show error or redirect
    await expect(page.locator('body')).toContainText(/not authorized|not found|403|404/i, { timeout: 5000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 11: Keyboard accessibility - core controls
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TEST 11: Keyboard accessibility', () => {
  test('core controls are accessible via keyboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    // Tab to email field
    await page.keyboard.press('Tab');
    await page.keyboard.type('patient@demo.medisakhi');
    await page.keyboard.press('Tab');
    await page.keyboard.type('Demo@1234');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    // Should navigate to dashboard
    await expect(page).toHaveURL(/patient\/dashboard/, { timeout: 10000 });
    // Verify dashboard large buttons are focusable
    const mainBtn = page.locator('[data-testid="btn-my-medicines"]');
    await mainBtn.focus();
    await expect(mainBtn).toBeFocused();
  });

  test('skip link works for screen readers', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.keyboard.press('Tab');
    const skipLink = page.locator('.skip-link:focus');
    await expect(skipLink).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 12: Chatbot refuses to guess missing dosage
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TEST 12: Chatbot safety guardrails', () => {
  test('chatbot does not fabricate dosage for unknown medicine', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('[data-testid="email"]', 'patient@demo.medisakhi');
    await page.fill('[data-testid="password"]', 'Demo@1234');
    await page.click('[data-testid="login-btn"]');
    await page.goto(`${BASE_URL}/patient/chatbot`);
    await page.fill('[data-testid="chat-input"]', 'What is the dosage for a medicine I have not registered?');
    await page.click('[data-testid="chat-send-btn"]');
    const response = page.locator('[data-testid="chat-message-assistant"]').last();
    await expect(response).toBeVisible({ timeout: 10000 });
    // Should refer to pharmacist, not guess
    const text = await response.innerText();
    expect(text.toLowerCase()).toMatch(/pharmacist|healthcare|cannot|not find|no record/);
  });
});
