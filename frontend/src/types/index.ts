export type UserRole = 'patient' | 'caregiver' | 'healthcare_professional' | 'admin';
export type Language = 'en' | 'ta';
export type VerificationStatus =
  | 'uploaded'
  | 'ocr_extracted'
  | 'awaiting_confirmation'
  | 'verified'
  | 'verification_required'
  | 'discontinued';

export type ReminderStatus =
  | 'scheduled'
  | 'processing'
  | 'sent'
  | 'delivered'
  | 'acknowledged'
  | 'patient_reported_taken'
  | 'confirmation_not_received'
  | 'delivery_failed'
  | 'cancelled';

export type AccessibilityMode =
  | 'standard'
  | 'easy'
  | 'voice'
  | 'high_contrast'
  | 'large_text'
  | 'reduced_motion';

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  role: UserRole;
  language: Language;
  is_active: boolean;
  avatar_url?: string;
  emergency_contact?: string;
}

export interface Medicine {
  id: string;
  name: string;
  brand_name?: string;
  active_ingredient?: string;
  strength: string;
  dosage_form: string;
  prescribed_quantity: number;
  route?: string;
  color?: string;
  shape?: string;
  size_description?: string;
  packaging_color?: string;
  image_url?: string;
  special_instructions?: string;
  food_instructions?: string;
  warning_info?: string;
  prescriber_name?: string;
  pharmacy_name?: string;
  start_date: string;
  end_date?: string;
  verification_status: VerificationStatus;
  is_active: boolean;
  frequency?: string;
  times_per_day?: number;
  reminder_times?: string[];
  notes?: string;
  total_tablets?: number;
  remaining_tablets?: number;
  low_stock_threshold?: number;
}

export interface MedicineSchedule {
  id: string;
  medicine_id: string;
  medicine_name?: string;
  reminder_times: string[];
  timezone: string;
  is_active: boolean;
  days_of_week?: number[];
  dose_amount?: string;
}

export interface ReminderEvent {
  id: string;
  medicine_id: string;
  medicine_name: string;
  scheduled_datetime: string;
  status: ReminderStatus;
  escalation_level: number;
  strength?: string;
  dosage_form?: string;
  special_instructions?: string;
  food_instructions?: string;
  taken_at?: string;
}

export interface CaregiverAlert {
  id: string;
  patient_id?: string;
  patient_name: string;
  patient_phone?: string;
  alert_type: string;
  message_en: string;
  message_ta: string;
  status: 'open' | 'acknowledged' | 'resolved';
  created_at: string;
  notes?: string;
  resolved_at?: string;
}

export interface AssistanceRequest {
  id: string;
  patient_id: string;
  patient_name: string;
  patient_phone?: string;
  medicine_name?: string;
  reason: string;
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
  notes?: string;
}

export interface NotificationLog {
  id: string;
  recipient_name: string;
  channel: 'sms' | 'voice' | 'push' | 'email';
  content: string;
  status: 'sent' | 'delivered' | 'failed';
  timestamp: string;
  provider?: string;
  delivered_at?: string;
}

export interface AuditLog {
  id: string;
  actor: string;
  user?: string;
  action: string;
  entity: string;
  resource_type?: string;
  resource_id?: string;
  timestamp: string;
  ip_address: string;
  status: 'success' | 'failure';
  details?: string;
}

export interface SystemSettingsConfig {
  sms_provider: string;
  sms_sender_id: string;
  sms_api_key_masked: string;
  sms_webhook_url: string;
  ai_provider: string;
  ai_api_key_masked: string;
  ocr_provider: string;
  email_host: string;
  email_port: number;
  email_sender: string;
  escalation_delay_minutes: number;
  max_escalation_level: number;
  demo_mode: boolean;
}

export interface AccessibilityPreferences {
  mode: AccessibilityMode;
  font_size_multiplier: number;
  high_contrast: boolean;
  reduced_motion: boolean;
  screen_reader_mode: boolean;
  tts_enabled: boolean;
  tts_language: Language;
  tts_rate: number;
}

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  language?: Language;
}

export interface PrescriptionExtraction {
  id: string;
  image_url?: string;
  extracted_text: string;
  detected_medicines: Array<{
    name: string;
    strength?: string;
    dosage?: string;
    frequency?: string;
    instructions?: string;
    confidence: number;
  }>;
  prescriber_name?: string;
  date_prescribed?: string;
  verification_status: VerificationStatus;
}

export interface AdherenceSummary {
  total_scheduled: number;
  taken_count: number;
  missed_count: number;
  adherence_rate: number;
  acknowledged_rate: number;
  period_start: string;
  period_end: string;
  daily_data: Array<{
    date: string;
    scheduled: number;
    taken: number;
    missed: number;
  }>;
}
