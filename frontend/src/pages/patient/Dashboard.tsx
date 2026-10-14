import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Pill, Clock, Volume2, Phone, CheckCircle, AlertCircle, HelpCircle, Settings, Calendar, Bell, Smartphone, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSpeech } from '../../hooks/useSpeech';
import { remindersAPI, medicinesAPI } from '../../lib/api';
import { t } from '../../lib/i18n';
import type { ReminderEvent, Medicine } from '../../types';
import KeypadSimulatorModal from '../../components/patient/KeypadSimulatorModal';

// Pictogram time-of-day icons
function TimeIcon({ hour }: { hour: number }) {
  if (hour >= 5 && hour < 12) return <span className="text-4xl" aria-label="Morning">🌅</span>;
  if (hour >= 12 && hour < 17) return <span className="text-4xl" aria-label="Afternoon">☀️</span>;
  if (hour >= 17 && hour < 21) return <span className="text-4xl" aria-label="Evening">🌆</span>;
  return <span className="text-4xl" aria-label="Night">🌙</span>;
}

// Tablet color circle
const COLOR_MAP: Record<string, string> = {
  white: 'bg-gray-100 border-gray-400', yellow: 'bg-yellow-300 border-yellow-500',
  pink: 'bg-pink-300 border-pink-500', blue: 'bg-blue-300 border-blue-500',
  orange: 'bg-orange-300 border-orange-500', red: 'bg-red-300 border-red-500',
  green: 'bg-green-300 border-green-500', brown: 'bg-amber-700 border-amber-900',
};
function TabletColor({ color }: { color?: string }) {
  const cls = color ? COLOR_MAP[color.toLowerCase()] || 'bg-gray-200 border-gray-400' : 'bg-gray-200 border-gray-400';
  return <span className={`inline-block w-6 h-6 rounded-full border-2 ${cls}`} aria-label={color ? `${color} tablet` : 'tablet'} />;
}

export default function PatientDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const { speak, stopSpeaking, isSpeaking } = useSpeech(language);

  const [upcoming, setUpcoming] = useState<ReminderEvent[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayStats, setTodayStats] = useState({ total: 0, confirmed: 0, pending: 0 });
  const [isKeypadOpen, setIsKeypadOpen] = useState(false);

  function triggerLiveAlarm() {
    window.dispatchEvent(new CustomEvent('medisakhi-trigger-alarm'));
  }

  useEffect(() => {
    async function load() {
      try {
        const [rem, med] = await Promise.all([remindersAPI.upcoming(), medicinesAPI.list()]);
        setUpcoming(rem.data);
        setMedicines(med.data);
        const today = new Date().toDateString();
        const todayRem = rem.data.filter((r: ReminderEvent) => new Date(r.scheduled_datetime).toDateString() === today);
        setTodayStats({
          total: todayRem.length,
          confirmed: todayRem.filter((r: ReminderEvent) => r.status === 'patient_reported_taken').length,
          pending: todayRem.filter((r: ReminderEvent) => ['scheduled', 'sent', 'delivered'].includes(r.status)).length,
        });
      } catch { /* handled gracefully */ }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const nextReminder = upcoming[0];
  const nextMedicine = nextReminder ? medicines.find(m => m.id === nextReminder.medicine_id) : medicines[0];
  const greeting = language === 'ta' ? `வணக்கம், ${user?.full_name?.split(' ')[0]}!` : `Hello, ${user?.full_name?.split(' ')[0]}!`;

  function speakNextReminder() {
    if (!nextMedicine) return;
    const timeStr = nextReminder
      ? new Date(nextReminder.scheduled_datetime).toLocaleTimeString(language === 'ta' ? 'ta-IN' : 'en-US', { hour: '2-digit', minute: '2-digit' })
      : '08:00 AM';
    const colorDesc = nextMedicine.color ? (language === 'ta' ? `${nextMedicine.color} நிற` : `${nextMedicine.color} colored`) : '';
    const shapeDesc = nextMedicine.shape ? (language === 'ta' ? `${nextMedicine.shape} வடிவ` : `${nextMedicine.shape} shape`) : '';
    const foodDesc = nextMedicine.food_instructions ? (language === 'ta' ? `உணவுக்குப் பின்` : `after food`) : '';

    const msg = language === 'ta'
      ? `${greeting} குறிக்கப்பட்ட நேரம் ${timeStr}. உங்கள் மருந்து ${nextMedicine.name} ${nextMedicine.strength}. ${colorDesc} ${shapeDesc} மாத்திரை. ${foodDesc}.`
      : `${greeting} The set clock time is ${timeStr}. Your scheduled medicine is ${nextMedicine.name} ${nextMedicine.strength}. It is a ${colorDesc} ${shapeDesc} tablet. Please take it ${foodDesc}.`;
    speak(msg, language);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Skip Link */}
      <a href="#main-content" className="skip-link">Skip to main content</a>

      {/* Top Bar */}
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 rounded-xl p-2"><Pill className="h-6 w-6 text-white" /></div>
            <span className="font-bold text-blue-900 text-lg hidden sm:block">MEDISAKHI AI</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Language toggle — always visible */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1" role="group" aria-label="Language">
              <button onClick={() => setLanguage('en')} data-testid="lang-en"
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${language === 'en' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
                aria-pressed={language === 'en'}>EN</button>
              <button onClick={() => setLanguage('ta')} data-testid="lang-ta"
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${language === 'ta' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
                aria-pressed={language === 'ta'}>தமிழ்</button>
            </div>
            <Link to="/patient/accessibility" aria-label="Accessibility Settings">
              <Settings className="h-6 w-6 text-gray-500 hover:text-blue-600" />
            </Link>
            <Link to="/help" aria-label="Help">
              <HelpCircle className="h-6 w-6 text-gray-500 hover:text-blue-600" />
            </Link>

            {/* Sign Out Button */}
            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl border border-red-200 transition-all shadow-xs active:scale-95 cursor-pointer ml-1"
              aria-label={language === 'ta' ? 'வெளியேறு (Sign Out)' : 'Sign Out'}
              title={language === 'ta' ? 'கணக்கிலிருந்து வெளியேறு' : 'Sign Out of Account'}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">{language === 'ta' ? 'வெளியேறு' : 'Sign Out'}</span>
            </button>
          </div>
        </div>
      </header>

      <main id="main-content" className="max-w-5xl mx-auto px-4 py-6">
        {/* Greeting */}
        <div className="mb-6">
          <h1 data-testid="dashboard-greeting" className="text-3xl font-extrabold text-gray-900">{greeting}</h1>
          <p className="text-gray-500 text-lg">
            {language === 'ta' ? 'இன்றைய மருந்து அட்டவணை' : "Today's medicine schedule"}
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: language === 'ta' ? 'மொத்தம்' : 'Total', val: todayStats.total, color: 'blue' },
            { label: language === 'ta' ? 'உறுதிப்படுத்தல்' : 'Confirmed', val: todayStats.confirmed, color: 'green' },
            { label: language === 'ta' ? 'நிலுவையில்' : 'Pending', val: todayStats.pending, color: 'orange' },
          ].map(s => (
            <div key={s.label} className={`bg-white rounded-2xl p-4 text-center shadow-sm border-2 border-${s.color}-100`}>
              <p className={`text-3xl font-black text-${s.color}-600`}>{s.val}</p>
              <p className="text-sm text-gray-600 font-medium">{s.label}</p>
            </div>
          ))}
        </div>

        {/* AUTOMATIC SPEAKING ALARM & KEYPAD MOBILE ACTION BAR */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={triggerLiveAlarm}
            className="p-5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-3xl shadow-lg flex items-center justify-between text-left transition-transform hover:scale-[1.02] active:scale-98 border-2 border-red-300"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-2xl">
                <Bell className="h-8 w-8 animate-bounce text-white" />
              </div>
              <div>
                <span className="text-lg font-black block">
                  {language === 'ta' ? '🔔 நேரலை அலாரம் சோதனை' : '🔔 TEST SPEAKING ALARM'}
                </span>
                <p className="text-xs text-red-100 font-medium">
                  {language === 'ta'
                    ? 'தானாக மாத்திரை விவரங்களைப் பேசும் அலாரம்'
                    : 'Auto-speaks tablet details + OK button'}
                </p>
              </div>
            </div>
            <span className="text-xs font-black bg-white text-red-700 px-3 py-1.5 rounded-full uppercase shadow">
              {language === 'ta' ? 'அலாரம்' : 'ALARM'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIsKeypadOpen(true)}
            className="p-5 bg-gradient-to-r from-slate-800 to-gray-900 hover:from-slate-900 hover:to-black text-white rounded-3xl shadow-lg flex items-center justify-between text-left transition-transform hover:scale-[1.02] active:scale-98 border-2 border-gray-600"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/10 rounded-2xl">
                <Smartphone className="h-8 w-8 text-green-400" />
              </div>
              <div>
                <span className="text-lg font-black block">
                  {language === 'ta' ? '📱 விசைப்பலகை போன் மாதிரி' : '📱 KEYPAD PHONE DEMO'}
                </span>
                <p className="text-xs text-gray-300 font-medium">
                  {language === 'ta'
                    ? 'எந்த பொத்தானை அழுத்தினாலும் மாத்திரை உறுதி'
                    : 'Press any button to confirm or alert caretaker'}
                </p>
              </div>
            </div>
            <span className="text-xs font-black bg-green-500 text-gray-950 px-3 py-1.5 rounded-full uppercase shadow">
              {language === 'ta' ? 'போன்' : 'KEYPAD'}
            </span>
          </button>
        </div>

        {/* 4 BIG ACTION BUTTONS */}
        <section aria-labelledby="actions-heading" className="mb-6">
          <h2 id="actions-heading" className="sr-only">{language === 'ta' ? 'முக்கிய செயல்கள்' : 'Main Actions'}</h2>
          <div className="grid grid-cols-2 gap-4">
            {/* MY MEDICINES */}
            <Link data-testid="btn-my-medicines" to="/patient/medicines"
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-3xl p-6 flex flex-col items-center justify-center gap-3 shadow-lg transition-transform hover:scale-105 focus-visible:ring-4 focus-visible:ring-blue-300 min-h-[140px]"
              aria-label={t('dashboard.my_medicines', language)}>
              <Pill className="h-10 w-10" />
              <span className="text-xl font-extrabold text-center leading-tight">{t('dashboard.my_medicines', language)}</span>
            </Link>
            {/* MY NEXT REMINDER */}
            <Link to={nextReminder ? `/patient/reminders/${nextReminder.id}` : '/patient/schedule'}
              className="bg-green-600 hover:bg-green-700 text-white rounded-3xl p-6 flex flex-col items-center justify-center gap-3 shadow-lg transition-transform hover:scale-105 focus-visible:ring-4 focus-visible:ring-green-300 min-h-[140px]"
              aria-label={t('dashboard.next_reminder_btn', language)}>
              <Clock className="h-10 w-10" />
              <span className="text-xl font-extrabold text-center leading-tight">{t('dashboard.next_reminder_btn', language)}</span>
            </Link>
            {/* HEAR MY INSTRUCTIONS */}
            <button
              onClick={() => {
                if (isSpeaking) {
                  stopSpeaking();
                } else {
                  speakNextReminder();
                }
              }}
              onMouseLeave={() => {
                if (isSpeaking) stopSpeaking();
              }}
              onBlur={() => {
                if (isSpeaking) stopSpeaking();
              }}
              data-testid="tts-btn"
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-3xl p-6 flex flex-col items-center justify-center gap-3 shadow-lg transition-transform hover:scale-105 focus-visible:ring-4 focus-visible:ring-purple-300 min-h-[140px]"
              aria-label={t('dashboard.hear_instructions', language)}>
              <Volume2 className={`h-10 w-10 ${isSpeaking ? 'animate-pulse text-amber-300' : ''}`} />
              <span className="text-xl font-extrabold text-center leading-tight">
                {isSpeaking ? (language === 'ta' ? '🛑 நிறுத்து' : '🛑 STOP') : t('dashboard.hear_instructions', language)}
              </span>
            </button>
            {/* CALL MY CAREGIVER */}
            <Link to="/patient/chatbot"
              className="bg-orange-500 hover:bg-orange-600 text-white rounded-3xl p-6 flex flex-col items-center justify-center gap-3 shadow-lg transition-transform hover:scale-105 focus-visible:ring-4 focus-visible:ring-orange-300 min-h-[140px]"
              aria-label={t('dashboard.call_caregiver', language)}>
              <Phone className="h-10 w-10" />
              <span className="text-xl font-extrabold text-center leading-tight">{t('dashboard.call_caregiver', language)}</span>
            </Link>
          </div>
        </section>

        {/* Next Medicine Card */}
        {nextMedicine && nextReminder && (
          <section aria-labelledby="next-med-heading" className="mb-6">
            <h2 id="next-med-heading" className="text-xl font-bold text-gray-800 mb-3">
              {language === 'ta' ? '⏭️ அடுத்த மருந்து' : '⏭️ Next Medicine'}
            </h2>
            <div className="bg-white rounded-3xl shadow-md border-2 border-blue-100 p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1">
                  {/* Time with pictogram */}
                  <div className="flex items-center gap-3 mb-3">
                    <TimeIcon hour={new Date(nextReminder.scheduled_datetime).getHours()} />
                    <div>
                      <p className="text-2xl font-black text-gray-900">
                        {new Date(nextReminder.scheduled_datetime).toLocaleTimeString(language === 'ta' ? 'ta-IN' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-sm text-gray-500">
                        {language === 'ta' ? 'நினைவூட்டல் நேரம்' : 'Reminder time'}
                      </p>
                    </div>
                  </div>

                  {/* Medicine Name */}
                  <h3 className="text-2xl font-extrabold text-blue-900 mb-1">{nextMedicine.name}</h3>
                  <p className="text-lg text-gray-600 mb-3">{nextMedicine.strength} — {nextMedicine.dosage_form}</p>

                  {/* Visual identifiers */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {nextMedicine.color && (
                      <span className="flex items-center gap-1 bg-gray-100 rounded-full px-3 py-1 text-sm">
                        <TabletColor color={nextMedicine.color} />
                        <span className="font-medium capitalize">{nextMedicine.color}</span>
                      </span>
                    )}
                    {nextMedicine.shape && (
                      <span className="bg-gray-100 rounded-full px-3 py-1 text-sm font-medium capitalize">{nextMedicine.shape}</span>
                    )}
                    {nextMedicine.food_instructions && (
                      <span className="bg-green-100 text-green-800 rounded-full px-3 py-1 text-sm font-medium">
                        {nextMedicine.food_instructions.toLowerCase().includes('after') ? '🍽️ After food' : nextMedicine.food_instructions.toLowerCase().includes('before') ? '🍽️ Before food' : `🍽️ ${nextMedicine.food_instructions}`}
                      </span>
                    )}
                    {nextMedicine.remaining_tablets !== undefined && (
                      <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-black border ${
                        nextMedicine.remaining_tablets <= (nextMedicine.low_stock_threshold || 10)
                          ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      }`}>
                        📦 {language === 'ta'
                          ? `இருப்பு: ${nextMedicine.remaining_tablets} / ${nextMedicine.total_tablets || 30}`
                          : `Stock: ${nextMedicine.remaining_tablets} / ${nextMedicine.total_tablets || 30}`}
                      </span>
                    )}
                  </div>

                  {nextMedicine.special_instructions && (
                    <p className="text-sm text-gray-600 bg-blue-50 rounded-xl p-3 border border-blue-100">
                      📋 {nextMedicine.special_instructions}
                    </p>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 mt-5 flex-wrap">
                <Link to={`/patient/reminders/${nextReminder.id}`}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-extrabold py-4 rounded-2xl text-center text-lg shadow transition-colors focus-visible:ring-4 focus-visible:ring-green-300"
                  aria-label={t('reminder.taken', language)}>
                  ✅ {t('reminder.taken', language)}
                </Link>
                <button onClick={speakNextReminder}
                  className="bg-purple-100 hover:bg-purple-200 text-purple-700 font-bold py-4 px-5 rounded-2xl transition-colors focus-visible:ring-4 focus-visible:ring-purple-300"
                  aria-label={t('reminder.play_audio', language)}>
                  <Volume2 className="h-6 w-6" />
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Today's Schedule */}
        <section aria-labelledby="schedule-heading">
          <h2 id="schedule-heading" className="text-xl font-bold text-gray-800 mb-3">
            {language === 'ta' ? '📅 இன்றைய அட்டவணை' : "📅 Today's Schedule"}
          </h2>
          {loading ? (
            <div className="text-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-4 border-blue-600 mx-auto" /></div>
          ) : upcoming.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-gray-500 shadow-sm">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-lg">{language === 'ta' ? 'இன்று மருந்துகள் இல்லை' : 'No medicines scheduled today'}</p>
              <Link to="/patient/medicines/add" className="mt-4 inline-block text-blue-600 font-semibold hover:underline">
                + {t('medicine.add', language)}
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.slice(0, 6).map(rem => {
                const med = medicines.find(m => m.id === rem.medicine_id);
                const isConfirmed = rem.status === 'patient_reported_taken';
                const isMissed = rem.status === 'confirmation_not_received';
                return (
                  <Link key={rem.id} to={`/patient/reminders/${rem.id}`}
                    data-testid="reminder-item"
                    className={`flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border-2 hover:shadow-md transition-shadow ${isConfirmed ? 'border-green-200' : isMissed ? 'border-orange-200' : 'border-gray-100'}`}>
                    <div className="flex-shrink-0">
                      <TimeIcon hour={new Date(rem.scheduled_datetime).getHours()} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-lg truncate">{med?.name || 'Medicine'}</p>
                      <p className="text-sm text-gray-500">{med?.strength} · {new Date(rem.scheduled_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      {med?.color && (
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <div className="flex items-center gap-1">
                            <TabletColor color={med.color} />
                            <span className="text-xs text-gray-500 capitalize">{med.color} {med.shape}</span>
                          </div>
                          {med.remaining_tablets !== undefined && (
                            <span className={`text-[11px] font-black px-2 py-0.5 rounded-md ${
                              med.remaining_tablets <= (med.low_stock_threshold || 10)
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            }`}>
                              📦 {med.remaining_tablets} {language === 'ta' ? 'மாத்திரைகள்' : 'left'}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      {isConfirmed ? (
                        <CheckCircle className="h-8 w-8 text-green-500" aria-label="Confirmed" />
                      ) : isMissed ? (
                        <AlertCircle className="h-8 w-8 text-orange-500" aria-label="Missed" />
                      ) : (
                        <Clock className="h-8 w-8 text-blue-400" aria-label="Scheduled" />
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Nav Links */}
        <nav className="grid grid-cols-3 gap-3 mt-6" aria-label="Patient navigation">
          {[
            { to: '/patient/schedule', icon: <Calendar className="h-5 w-5" />, label: language === 'ta' ? 'அட்டவணை' : 'Schedule' },
            { to: '/patient/chatbot', icon: <HelpCircle className="h-5 w-5" />, label: 'MediFriend' },
            { to: '/patient/history', icon: <CheckCircle className="h-5 w-5" />, label: language === 'ta' ? 'வரலாறு' : 'History' },
            { to: '/patient/voice', icon: <Volume2 className="h-5 w-5" />, label: language === 'ta' ? 'குரல்' : 'Voice' },
            { to: '/patient/medicines', icon: <Pill className="h-5 w-5" />, label: language === 'ta' ? 'மருந்துகள்' : 'Medicines' },
            { to: '/patient/accessibility', icon: <Settings className="h-5 w-5" />, label: language === 'ta' ? 'அமைப்புகள்' : 'Settings' },
          ].map(l => (
            <Link key={l.to} to={l.to}
              className="flex flex-col items-center gap-1 bg-white rounded-2xl p-3 shadow-sm hover:shadow-md border border-gray-100 text-gray-600 hover:text-blue-600 transition-colors">
              {l.icon}
              <span className="text-xs font-medium text-center">{l.label}</span>
            </Link>
          ))}
        </nav>
      </main>

      {/* Floating Help button */}
      <Link to="/help"
        className="fixed bottom-6 right-6 bg-orange-500 hover:bg-orange-600 text-white rounded-full p-4 shadow-xl z-50 transition-transform hover:scale-110 focus-visible:ring-4 focus-visible:ring-orange-300"
        aria-label={t('common.help', language)}>
        <HelpCircle className="h-7 w-7" />
      </Link>

      {/* Keypad Phone Simulator Modal */}
      <KeypadSimulatorModal
        isOpen={isKeypadOpen}
        onClose={() => setIsKeypadOpen(false)}
        patientPhone={user?.phone_number || '+919876500001'}
      />
    </div>
  );
}
