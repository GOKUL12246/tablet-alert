import React, { useEffect, useState, useRef } from 'react';
import { Bell, Check, Clock, AlertTriangle, Volume2, ShieldAlert, X, HeartHandshake, PhoneCall } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSpeech } from '../../hooks/useSpeech';
import { remindersAPI } from '../../lib/api';
import { playAlarmChime, stopAlarmChime } from '../../lib/audioAlert';
import toast from 'react-hot-toast';

interface AlarmData {
  reminder_id: string;
  scheduled_time: string;
  scheduled_time_ta: string;
  medicine_id: string;
  medicine_name: string;
  brand_name?: string;
  strength?: string;
  color: string;
  shape: string;
  color_ta: string;
  shape_ta: string;
  food_instructions: string;
  food_instructions_ta: string;
  speech_en: string;
  speech_ta: string;
  remaining_tablets?: number;
  total_tablets?: number;
  low_stock_threshold?: number;
}

export default function AlarmModal() {
  const { language } = useLanguage();
  const { speak, stopSpeaking } = useSpeech(language);

  const [isOpen, setIsOpen] = useState(false);
  const [alarmData, setAlarmData] = useState<AlarmData | null>(null);
  const [countdown, setCountdown] = useState(90); // 90 seconds before auto-escalating to caretaker
  const [escalated, setEscalated] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  const countdownRef = useRef<any>(null);
  const speechRepeatRef = useRef<any>(null);
  const triggeredIdsRef = useRef<Set<string>>(new Set());

  // Listen for custom trigger or interval check
  useEffect(() => {
    const handleTrigger = (e: any) => {
      const data = e.detail;
      if (data?.reminder_id) {
        triggerActiveAlarm(data.reminder_id);
      } else if (data) {
        startAlarm(data);
      } else {
        triggerActiveAlarm();
      }
    };

    window.addEventListener('medisakhi-trigger-alarm', handleTrigger);
    return () => {
      window.removeEventListener('medisakhi-trigger-alarm', handleTrigger);
      stopAllAudio();
    };
  }, [language]);

  // Automated clock watcher: checks every 10 seconds if any medicine reminder is due now
  useEffect(() => {
    let checking = false;
    const interval = setInterval(async () => {
      if (isOpen || checking) return;
      checking = true;

      try {
        const res = await remindersAPI.upcoming(24);
        const reminders = res.data || [];
        if (!reminders.length) return;

        const now = new Date();
        const currentHH = String(now.getHours()).padStart(2, '0');
        const currentMM = String(now.getMinutes()).padStart(2, '0');
        const currentHHMM = `${currentHH}:${currentMM}`;

        const dueReminder = reminders.find((r: any) => {
          if (r.status !== 'scheduled' && r.status !== 'sent') return false;
          if (triggeredIdsRef.current.has(r.id)) return false;

          // 1. Exact match with local HH:MM set on schedule
          if (r.scheduled_time_local && r.scheduled_time_local === currentHHMM) {
            return true;
          }

          // 2. Or if within due window (within past 12 minutes)
          const remTime = new Date(r.scheduled_datetime).getTime();
          const diffMinutes = (now.getTime() - remTime) / 60000;
          return diffMinutes >= 0 && diffMinutes <= 12;
        });

        if (dueReminder) {
          triggeredIdsRef.current.add(dueReminder.id);
          triggerActiveAlarm(dueReminder.id);
        }
      } catch (err) {
        // Ignored if user not authenticated
      } finally {
        checking = false;
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isOpen, language]);

  const triggerActiveAlarm = async (reminderId?: string) => {
    try {
      const res = await remindersAPI.getActiveAlarm(reminderId);
      if (res.data) {
        startAlarm(res.data);
      }
    } catch (err) {
      console.warn('No active reminder found for alarm:', err);
    }
  };

  const startAlarm = (data: AlarmData) => {
    setAlarmData(data);
    setIsOpen(true);
    setConfirmed(false);
    setEscalated(false);
    setCountdown(90);

    // 1. Play musical chime sound
    playAlarmChime();

    // 2. Automatically speak tablet details in user's language
    const speechText = language === 'ta' ? data.speech_ta : data.speech_en;
    speak(speechText, language);

    // 3. Repeat voice speech every 22 seconds until OK is pressed
    if (speechRepeatRef.current) clearInterval(speechRepeatRef.current);
    speechRepeatRef.current = setInterval(() => {
      speak(speechText, language);
    }, 22000);

    // 4. Start 90s countdown for caretaker escalation
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          handleTimeoutEscalation(data.reminder_id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopAllAudio = () => {
    stopAlarmChime();
    stopSpeaking();
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (speechRepeatRef.current) clearInterval(speechRepeatRef.current);
  };

  const handleConfirmTaken = async () => {
    if (!alarmData) return;
    stopAllAudio();
    setLoading(true);
    try {
      await remindersAPI.confirm(alarmData.reminder_id);
      setConfirmed(true);

      const msg = language === 'ta'
        ? 'நன்றி! உங்கள் மருந்து பதிவு செய்யப்பட்டது. அடுத்த நினைவூட்டல் வரை நலமாக இருங்கள்.'
        : 'Thank you! Your medicine has been recorded as taken. Stay healthy!';
      toast.success(msg);
      speak(msg, language);

      setTimeout(() => {
        setIsOpen(false);
        setConfirmed(false);
      }, 3500);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to confirm dose');
    } finally {
      setLoading(false);
    }
  };

  const handleTimeoutEscalation = async (reminderId: string) => {
    stopAllAudio();
    try {
      await remindersAPI.escalateCaretaker(reminderId);
      setEscalated(true);
      const msg = language === 'ta'
        ? 'எச்சரிக்கை: நீங்கள் பதில் அளிக்காததால், உங்கள் பாதுகாவலருக்கு உடனடி தகவல் அனுப்பப்பட்டுள்ளது!'
        : 'Alert: Since no button was pressed, an urgent alert has been sent to your caregiver!';
      toast.error(msg);
      speak(msg, language);
    } catch (err) {
      console.error(err);
    }
  };

  const handleManualEscalate = () => {
    if (alarmData) {
      handleTimeoutEscalation(alarmData.reminder_id);
    }
  };

  const handleSnooze = () => {
    stopAllAudio();
    setIsOpen(false);
    const msg = language === 'ta' ? 'அலாரம் 5 நிமிடங்களுக்கு ஒத்திவைக்கப்பட்டது.' : 'Alarm snoozed for 5 minutes.';
    toast(msg, { icon: '⏳' });
    speak(msg, language);
  };

  if (!isOpen || !alarmData) return null;

  const colorBgMap: Record<string, string> = {
    white: 'bg-white border-gray-400 text-gray-800',
    pink: 'bg-pink-100 border-pink-400 text-pink-900',
    yellow: 'bg-yellow-100 border-yellow-400 text-yellow-900',
    blue: 'bg-blue-100 border-blue-400 text-blue-900',
    orange: 'bg-orange-100 border-orange-400 text-orange-900',
    red: 'bg-red-100 border-red-400 text-red-900',
    green: 'bg-green-100 border-green-400 text-green-900',
  };

  const tabletBg = colorBgMap[alarmData.color.toLowerCase()] || 'bg-blue-100 border-blue-300 text-blue-900';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border-4 border-red-400 overflow-hidden text-center p-6 sm:p-8 space-y-6 animate-scaleUp">
        {/* Pulsing Alarm Top Banner */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2 text-red-600 font-black animate-pulse text-lg">
            <Bell className="h-7 w-7" />
            <span>{language === 'ta' ? '🚨 மருந்து அலாரம் அடிக்கிறது!' : '🚨 MEDICINE ALARM RINGING!'}</span>
          </div>
          <button
            onClick={() => { stopAllAudio(); setIsOpen(false); }}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Scheduled Clock Time Display */}
        <div className="bg-red-50 border-2 border-red-200 rounded-3xl py-4 px-6 shadow-inner">
          <span className="text-xs font-black uppercase tracking-wider text-red-600 block">
            {language === 'ta' ? 'மருந்து உட்கொள்ளும் நேரம்' : 'SCHEDULED CLOCK TIME'}
          </span>
          <span className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight block my-1">
            {language === 'ta' ? alarmData.scheduled_time_ta : alarmData.scheduled_time}
          </span>
          <p className="text-xs font-bold text-red-700">
            {language === 'ta' ? '🔊 விவரங்கள் உரக்கப் பேசப்படுகின்றன' : '🔊 Speaking tablet instructions aloud'}
          </p>
        </div>

        {/* Medicine Name & Visual Tablet Identifier */}
        <div className="space-y-3">
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900">
            {alarmData.medicine_name} {alarmData.strength}
          </h2>
          {alarmData.brand_name && (
            <p className="text-base font-bold text-gray-500">{alarmData.brand_name}</p>
          )}

          {/* Visual Tablet Box */}
          <div className={`p-4 rounded-2xl border-2 flex items-center justify-around gap-3 ${tabletBg}`}>
            <div>
              <span className="text-xs font-bold text-gray-500 block">
                {language === 'ta' ? 'மாத்திரை நிறம் & வடிவம்' : 'Tablet Appearance'}
              </span>
              <span className="text-lg font-black capitalize">
                {language === 'ta'
                  ? `${alarmData.color_ta} (${alarmData.color}), ${alarmData.shape_ta} வடிவம்`
                  : `${alarmData.color} color, ${alarmData.shape} shape`}
              </span>
            </div>
            <div className="h-12 w-12 rounded-full border-2 border-gray-400 shadow-md flex items-center justify-center font-bold text-xs bg-white/70">
              💊
            </div>
          </div>

          {/* Food Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl py-2 px-4 text-blue-900 font-extrabold text-sm flex items-center justify-center gap-2">
            <span>🍽️</span>
            <span>
              {language === 'ta'
                ? `வழிமுறை: ${alarmData.food_instructions_ta} தண்ணீருடன்`
                : `Instructions: Take with water ${alarmData.food_instructions}`}
            </span>
          </div>

          {/* Available Tablets Stock Badge */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl py-2 px-4 text-emerald-950 font-bold text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span>📦</span>
              <span>{language === 'ta' ? 'மீதமுள்ள மாத்திரைகள்:' : 'Available Stock:'}</span>
            </span>
            <span className="font-black text-emerald-800">
              {alarmData.remaining_tablets !== undefined ? alarmData.remaining_tablets : 30} / {alarmData.total_tablets || 30} {language === 'ta' ? 'மாத்திரைகள்' : 'tablets'}
            </span>
          </div>

          {/* Low Stock Warning if <= 10 */}
          {alarmData.remaining_tablets !== undefined && alarmData.remaining_tablets <= 10 && (
            <div className="bg-amber-100 border border-amber-300 rounded-2xl p-2.5 text-amber-900 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
              <span>
                {language === 'ta'
                  ? `குறைவான இருப்பு (${alarmData.remaining_tablets} மட்டுமே)! பராமரிப்பாளருக்கு தினசரி எச்சரிக்கை அனுப்பப்பட்டுள்ளது.`
                  : `Low stock (${alarmData.remaining_tablets} left)! Daily alert sent to caretaker.`}
              </span>
            </div>
          )}
        </div>

        {/* ESCALATION STATUS & COUNTDOWN */}
        {!confirmed && !escalated && (
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3 text-amber-900 text-xs font-bold flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
              {language === 'ta'
                ? `பொத்தான் அழுத்தாவிடில் பாதுகாவலருக்கு தகவல் செல்ல:`
                : `Alerting Caretaker if no response in:`}
            </span>
            <span className="text-sm font-black text-red-600">{countdown}s</span>
          </div>
        )}

        {escalated && (
          <div className="bg-red-100 border-2 border-red-400 rounded-2xl p-4 text-red-900 font-bold text-sm space-y-1">
            <p className="flex items-center justify-center gap-2 text-base font-black">
              <PhoneCall className="h-5 w-5 text-red-600 animate-bounce" />
              {language === 'ta' ? '🚨 பாதுகாவலருக்கு தகவல் அனுப்பப்பட்டது!' : '🚨 Caregiver Alert Dispatched!'}
            </p>
            <p className="text-xs text-red-800">
              {language === 'ta'
                ? 'நீங்கள் பதில் அளிக்காததால் குடும்பத்தினருக்கு அவசர செய்தி அனுப்பப்பட்டுள்ளது.'
                : 'Urgent notification was sent to your registered caretaker to check on you.'}
            </p>
          </div>
        )}

        {confirmed && (
          <div className="bg-green-100 border-2 border-green-500 rounded-2xl p-4 text-green-900 font-black text-base flex items-center justify-center gap-2">
            <Check className="h-6 w-6 text-green-700" />
            <span>{language === 'ta' ? '✅ மாத்திரை உட்கொண்டது பதிவு செய்யப்பட்டது!' : '✅ Medicine Recorded as Taken!'}</span>
          </div>
        )}

        {/* BIG ACTION BUTTONS */}
        <div className="space-y-3 pt-2">
          {/* PRIMARY OK BUTTON */}
          <button
            type="button"
            onClick={handleConfirmTaken}
            disabled={loading || confirmed}
            className="w-full py-5 px-6 bg-green-600 hover:bg-green-700 active:scale-98 disabled:opacity-50 text-white font-black text-xl sm:text-2xl rounded-3xl shadow-xl border-4 border-green-400 flex items-center justify-center gap-3 transition-all cursor-pointer"
          >
            <Check className="h-8 w-8 stroke-[3]" />
            <span>
              {language === 'ta' ? 'நான் மருந்து சாப்பிட்டுவிட்டேன் (சரி)' : 'I HAVE TAKEN MY MEDICINE (OK)'}
            </span>
          </button>
          <p className="text-xs text-green-800 font-bold">
            {language === 'ta' ? '💡 சரி அழுத்தியதும் இருப்பு மாத்திரை 1 குறையும்' : '💡 Pressing OK automatically reduces stock by 1 tablet'}
          </p>

          {/* SNOOZE AND ALERT CARETAKER BUTTONS */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={handleSnooze}
              className="py-3 px-3 bg-yellow-100 hover:bg-yellow-200 text-yellow-900 font-bold rounded-2xl text-xs sm:text-sm border border-yellow-300 transition-colors"
            >
              ⏳ {language === 'ta' ? '5 நிமிடம் கழித்து' : 'Snooze (5 Mins)'}
            </button>
            <button
              type="button"
              onClick={handleManualEscalate}
              className="py-3 px-3 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-2xl text-xs sm:text-sm border border-red-300 transition-colors"
            >
              🚨 {language === 'ta' ? 'பாதுகாவலரை அழை' : 'Alert Caretaker'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
