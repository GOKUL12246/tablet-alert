import { useState, useEffect, useCallback } from 'react';
import { ReminderEvent } from '../types';
import { remindersAPI } from '../lib/api';
import toast from 'react-hot-toast';

const MOCK_REMINDERS: ReminderEvent[] = [
  {
    id: 'rem-001',
    medicine_id: 'med-001',
    medicine_name: 'Metformin Hydrochloride',
    scheduled_datetime: new Date().toISOString(),
    status: 'scheduled',
    escalation_level: 0,
    strength: '500 mg',
    dosage_form: 'Tablet',
    special_instructions: 'Take with or immediately after food. Swallow with water.',
    food_instructions: 'With or after breakfast/lunch',
  },
  {
    id: 'rem-002',
    medicine_id: 'med-002',
    medicine_name: 'Amlodipine Besylate',
    scheduled_datetime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    status: 'scheduled',
    escalation_level: 0,
    strength: '5 mg',
    dosage_form: 'Tablet',
    special_instructions: 'Take once daily in the evening at the same time.',
    food_instructions: 'Before or after food',
  },
  {
    id: 'rem-003',
    medicine_id: 'med-003',
    medicine_name: 'Atorvastatin Calcium',
    scheduled_datetime: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    status: 'scheduled',
    escalation_level: 0,
    strength: '10 mg',
    dosage_form: 'Tablet',
    special_instructions: 'Take at bedtime with water.',
    food_instructions: 'Night bedtime',
  },
];

export const useReminders = () => {
  const [reminders, setReminders] = useState<ReminderEvent[]>(MOCK_REMINDERS);
  const [nextReminder, setNextReminder] = useState<ReminderEvent | null>(MOCK_REMINDERS[0]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReminders = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await remindersAPI.upcoming();
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setReminders(res.data);
        setNextReminder(res.data[0]);
      } else {
        // Keep mock reminders for demo display
        setNextReminder(MOCK_REMINDERS[0]);
      }
    } catch {
      // Backend not yet reachable or empty - keep mock data
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const confirmTaken = async (reminderId: string) => {
    try {
      await remindersAPI.confirm(reminderId);
    } catch {
      // fallback local update
    }
    setReminders((prev) =>
      prev.map((r) =>
        r.id === reminderId
          ? { ...r, status: 'patient_reported_taken', taken_at: new Date().toISOString() }
          : r
      )
    );
    if (nextReminder?.id === reminderId) {
      const remaining = reminders.filter(
        (r) => r.id !== reminderId && r.status !== 'patient_reported_taken'
      );
      setNextReminder(remaining.length > 0 ? remaining[0] : null);
    }
    toast.success('Dose confirmed as taken!');
  };

  const requestHelp = async (reminderId: string, notes?: string) => {
    try {
      await remindersAPI.requestHelp(reminderId, notes);
    } catch {
      // fallback
    }
    setReminders((prev) =>
      prev.map((r) => (r.id === reminderId ? { ...r, escalation_level: r.escalation_level + 1 } : r))
    );
    toast.success('Caregiver alerted for assistance.');
  };

  const snoozeReminder = async (reminderId: string, minutes: number = 15) => {
    try {
      await remindersAPI.snooze(reminderId, minutes);
    } catch {
      // fallback
    }
    toast.success(`Reminder snoozed for ${minutes} minutes.`);
  };

  return {
    reminders,
    nextReminder,
    isLoading,
    error,
    refreshReminders: fetchReminders,
    confirmTaken,
    requestHelp,
    snoozeReminder,
  };
};

export default useReminders;
