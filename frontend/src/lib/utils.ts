export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatTime(timeStr: string): string {
  if (!timeStr) return '';
  // Check if it's already HH:MM format
  if (/^\d{2}:\d{2}$/.test(timeStr)) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  }
  try {
    const date = new Date(timeStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return timeStr;
  }
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function getVerificationStatusColor(status: string): {
  bg: string;
  text: string;
  border: string;
} {
  switch (status) {
    case 'verified':
      return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' };
    case 'awaiting_confirmation':
    case 'ocr_extracted':
      return { bg: 'bg-yellow-50', text: 'text-yellow-800', border: 'border-yellow-200' };
    case 'verification_required':
      return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' };
    case 'discontinued':
      return { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300' };
    default:
      return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
  }
}

export function getReminderStatusBadge(status: string): { label: string; color: string } {
  switch (status) {
    case 'patient_reported_taken':
      return { label: 'Taken', color: 'bg-green-100 text-green-800' };
    case 'acknowledged':
      return { label: 'Acknowledged', color: 'bg-blue-100 text-blue-800' };
    case 'sent':
    case 'delivered':
      return { label: 'Scheduled / Sent', color: 'bg-indigo-100 text-indigo-800' };
    case 'confirmation_not_received':
    case 'missed':
      return { label: 'Confirmation Pending', color: 'bg-red-100 text-red-800' };
    default:
      return { label: status, color: 'bg-gray-100 text-gray-800' };
  }
}
