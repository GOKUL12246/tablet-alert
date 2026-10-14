import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, HelpCircle, Bell, Volume2, Clock, ArrowLeft, AlertTriangle } from 'lucide-react';
import { remindersAPI, medicinesAPI } from '../../lib/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSpeech } from '../../hooks/useSpeech';
import { t } from '../../lib/i18n';
import toast from 'react-hot-toast';
import type { ReminderEvent, Medicine } from '../../types';

const COLOR_MAP: Record<string, string> = {
  white: 'bg-gray-100 border-gray-400', yellow: 'bg-yellow-300 border-yellow-500',
  pink: 'bg-pink-300 border-pink-500', blue: 'bg-blue-300 border-blue-500',
  orange: 'bg-orange-300 border-orange-500', red: 'bg-red-300 border-red-500',
  green: 'bg-green-300 border-green-500',
};

export default function ReminderConfirm() {
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();
  const { speak, stopSpeaking, isSpeaking } = useSpeech(language);
  const navigate = useNavigate();

  const [reminder, setReminder] = useState<ReminderEvent | null>(null);
  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const rem = await remindersAPI.get(id!);
        setReminder(rem.data);
        if (rem.data.medicine_id) {
          const med = await medicinesAPI.get(rem.data.medicine_id);
          const scheduledTimeStr = new Date(rem.data.scheduled_datetime).toLocaleTimeString(
            language === 'ta' ? 'ta-IN' : 'en-US',
            { hour: '2-digit', minute: '2-digit' }
          );
          const colorDesc = med.data.color ? (language === 'ta' ? `${med.data.color} நிற` : `${med.data.color}`) : '';
          const shapeDesc = med.data.shape ? (language === 'ta' ? `${med.data.shape} வடிவ` : `${med.data.shape}`) : '';
          const msg = language === 'ta'
            ? `கவனம்! குறித்த மணி ${scheduledTimeStr}. உங்கள் ${med.data.name} ${med.data.strength} ${colorDesc} ${shapeDesc} மாத்திரை எடுத்துக்கொள்ள வேண்டிய நேரம் வந்துவிட்டது. ${med.data.food_instructions || ''}.`
            : `Attention! The set clock time is ${scheduledTimeStr}. It is time to take your ${med.data.name} ${med.data.strength} ${colorDesc} ${shapeDesc} tablet. ${med.data.food_instructions || ''}.`;
          setTimeout(() => speak(msg, language), 800);
        }
      } catch { /* graceful */ }
      finally { setLoading(false); }
    }
    load();
  }, [id, language]);

  async function handleConfirm() {
    if (!id || confirmed) return;
    setActionLoading('confirm');
    try {
      await remindersAPI.confirm(id);
      setConfirmed(true);
      toast.success(language === 'ta' ? 'உறுதிப்படுத்தல் பதிவு செய்யப்பட்டது' : 'Confirmation recorded successfully');
      speak(language === 'ta' ? 'நன்றி! உறுதிப்படுத்தல் பதிவாகியது.' : 'Thank you! Your confirmation has been recorded.', language);
      setTimeout(() => navigate('/patient/dashboard'), 2500);
    } catch { toast.error(t('common.error', language)); }
    finally { setActionLoading(null); }
  }

  async function handleHelp() {
    if (!id) return;
    setActionLoading('help');
    try {
      await remindersAPI.requestHelp(id);
      toast.success(language === 'ta' ? 'உங்கள் கவனிப்பாளருக்கு தகவல் அனுப்பப்பட்டது' : 'Your caregiver has been notified');
      speak(language === 'ta' ? 'உங்கள் கவனிப்பாளருக்கு செய்தி அனுப்பப்பட்டது.' : 'Your caregiver has been notified. Please wait for their assistance.', language);
    } catch { toast.error(t('common.error', language)); }
    finally { setActionLoading(null); }
  }

  async function handleSnooze() {
    if (!id) return;
    toast(language === 'ta' ? '10 நிமிடத்தில் மீண்டும் நினைவூட்டும்' : 'You will be reminded again in 10 minutes', { icon: '🔔' });
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600" />
    </div>
  );

  const medColor = medicine?.color?.toLowerCase();
  const colorCls = medColor ? COLOR_MAP[medColor] || 'bg-gray-200 border-gray-400' : 'bg-gray-200 border-gray-400';
  const scheduledTime = reminder ? new Date(reminder.scheduled_datetime).toLocaleTimeString(language === 'ta' ? 'ta-IN' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : '--:--';

  return (
    <div className="min-h-screen bg-blue-900 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        {/* Back */}
        <Link to="/patient/dashboard" className="flex items-center gap-2 text-blue-200 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="h-5 w-5" />
          <span>{t('common.back', language)}</span>
        </Link>

        {/* Reminder Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 p-6 text-white text-center">
            <Bell className="h-10 w-10 mx-auto mb-2 animate-bounce" />
            <p className="text-lg font-semibold opacity-90">
              {language === 'ta' ? 'மருந்து நேரம்!' : 'Medicine Time!'}
            </p>
            <p className="text-4xl font-black mt-1">{scheduledTime}</p>
          </div>

          <div className="p-6">
            {/* Medicine Visual */}
            <div className="flex items-center gap-5 mb-6">
              {/* Tablet color circle — large */}
              <div className={`w-20 h-20 rounded-full border-4 ${colorCls} flex-shrink-0 shadow-inner`}
                aria-label={medicine?.color ? `${medicine.color} tablet` : 'tablet'} />
              <div>
                <h2 className="text-3xl font-extrabold text-gray-900">{medicine?.name || '—'}</h2>
                <p className="text-xl text-gray-600">{medicine?.strength}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {medicine?.color && <span className="bg-gray-100 text-gray-700 text-sm px-2 py-0.5 rounded-full capitalize">{medicine.color}</span>}
                  {medicine?.shape && <span className="bg-gray-100 text-gray-700 text-sm px-2 py-0.5 rounded-full capitalize">{medicine.shape}</span>}
                  {medicine?.size_description && <span className="bg-gray-100 text-gray-700 text-sm px-2 py-0.5 rounded-full">{medicine.size_description}</span>}
                </div>
              </div>
            </div>

            {/* Instructions */}
            {medicine?.special_instructions && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 mb-4">
                <p className="font-semibold text-blue-800 mb-1 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {language === 'ta' ? 'வழிமுறைகள்:' : 'Instructions:'}
                </p>
                <p className="text-blue-700 text-lg">{medicine.special_instructions}</p>
              </div>
            )}
            {medicine?.food_instructions && (
              <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-3 mb-4 text-green-800 font-medium">
                🍽️ {medicine.food_instructions}
              </div>
            )}
            {medicine?.warning_info && (
              <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-3 mb-4">
                <p className="text-orange-800 text-sm flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  {medicine.warning_info}
                </p>
              </div>
            )}

            {/* Available stock card */}
            {medicine?.remaining_tablets !== undefined && (
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-3.5 mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2 font-bold text-emerald-950 text-sm">
                  <span>📦</span>
                  <span>{language === 'ta' ? 'மீதமுள்ள மாத்திரைகள்:' : 'Available Stock:'}</span>
                </span>
                <span className="text-base font-black text-emerald-900">
                  {medicine.remaining_tablets} / {medicine.total_tablets || 30} {language === 'ta' ? 'மாத்திரைகள்' : 'tablets'}
                </span>
              </div>
            )}

            {/* Audio button */}
            <button onClick={() => {
                if (!medicine) return;
                const timeStr = reminder ? new Date(reminder.scheduled_datetime).toLocaleTimeString(language === 'ta' ? 'ta-IN' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : scheduledTime;
                const colorDesc = medicine.color ? (language === 'ta' ? `${medicine.color} நிற` : `${medicine.color}`) : '';
                const shapeDesc = medicine.shape ? (language === 'ta' ? `${medicine.shape} வடிவ` : `${medicine.shape}`) : '';
                const msg = language === 'ta'
                  ? `குறிக்கப்பட்ட நேரம் ${timeStr}. உங்கள் மருந்து: ${medicine.name} ${medicine.strength}. ${colorDesc} ${shapeDesc} மாத்திரை. ${medicine.food_instructions || ''}. ${medicine.special_instructions || ''}`
                  : `Set clock time is ${timeStr}. Your scheduled medicine is ${medicine.name} ${medicine.strength}. ${colorDesc} ${shapeDesc} tablet. ${medicine.food_instructions || ''}. ${medicine.special_instructions || ''}`;
                speak(msg, language);
              }}
              disabled={isSpeaking}
              className="w-full flex items-center justify-center gap-3 bg-purple-100 hover:bg-purple-200 text-purple-700 font-bold py-3 rounded-2xl mb-6 transition-colors focus-visible:ring-4 focus-visible:ring-purple-300"
              aria-label={t('reminder.play_audio', language)}>
              <Volume2 className={`h-6 w-6 ${isSpeaking ? 'animate-pulse' : ''}`} />
              {t('reminder.play_audio', language)}
            </button>

            {confirmed ? (
              <div data-testid="confirmation-success" className="text-center py-6">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-3" />
                <p className="text-2xl font-extrabold text-green-700">
                  {language === 'ta' ? 'நன்றி! பதிவு செய்யப்பட்டது.' : 'Thank you! Confirmation recorded.'}
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  {language === 'ta' ? 'இது உங்கள் சொந்த அறிக்கை மட்டுமே.' : 'This is your self-reported confirmation only.'}
                </p>
              </div>
            ) : (
              /* THREE BIG BUTTONS */
              <div className="space-y-3">
                {/* I HAVE TAKEN IT */}
                <button onClick={handleConfirm} disabled={actionLoading === 'confirm'}
                  data-testid="confirm-taken-btn"
                  className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-70 text-white font-extrabold py-6 rounded-2xl text-2xl shadow-lg transition-colors focus-visible:ring-4 focus-visible:ring-green-300 flex items-center justify-center gap-3">
                  <CheckCircle className="h-8 w-8" />
                  {t('reminder.taken', language)}
                </button>
                <p className="text-center text-xs text-green-700 font-bold -mt-1 mb-1">
                  {language === 'ta' ? '💡 உறுதிப்படுத்தியதும் இருப்பு மாத்திரை 1 குறையும்' : '💡 Confirming reduces available stock by 1 tablet'}
                </p>
                {/* I NEED HELP */}
                <button onClick={handleHelp} disabled={actionLoading === 'help'}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-70 text-white font-extrabold py-6 rounded-2xl text-2xl shadow-lg transition-colors focus-visible:ring-4 focus-visible:ring-orange-300 flex items-center justify-center gap-3">
                  <HelpCircle className="h-8 w-8" />
                  {t('reminder.need_help', language)}
                </button>
                {/* REMIND ME AGAIN */}
                <button onClick={handleSnooze}
                  className="w-full bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold py-5 rounded-2xl text-xl transition-colors focus-visible:ring-4 focus-visible:ring-blue-300 flex items-center justify-center gap-3">
                  <Bell className="h-6 w-6" />
                  {t('reminder.remind_again', language)}
                </button>
              </div>
            )}

            {/* Safety note */}
            <p className="text-xs text-gray-400 text-center mt-4 leading-relaxed">
              {language === 'ta'
                ? 'இந்த உறுதிப்படுத்தல் உங்கள் சொந்த அறிக்கை மட்டுமே. சந்தேகம் இருந்தால் மருந்தாளரை தொடர்பு கொள்ளுங்கள்.'
                : 'This confirmation is self-reported. For missed-dose guidance, contact your pharmacist or healthcare professional.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
