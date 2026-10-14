import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Pill, Clock, ShieldCheck, AlertTriangle, Trash2, Edit3, Volume2, Plus, Check, RefreshCw, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSpeech } from '../../hooks/useSpeech';
import { medicinesAPI } from '../../lib/api';
import { t } from '../../lib/i18n';
import toast from 'react-hot-toast';
import type { Medicine } from '../../types';

export default function MedicineDetail() {
  const { logout } = useAuth();
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();
  const { speak, stopSpeaking, isSpeaking } = useSpeech(language);
  const navigate = useNavigate();

  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [reminderTimes, setReminderTimes] = useState<string[]>(['08:00']);
  const [loading, setLoading] = useState(true);
  const [discontinuing, setDiscontinuing] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [refilling, setRefilling] = useState(false);

  const handleRefill = async (qty: number = 30) => {
    if (!id || !medicine) return;
    setRefilling(true);
    try {
      const res = await medicinesAPI.refill(id, qty);
      setMedicine(res.data);
      const msg = language === 'ta'
        ? `${qty} மாத்திரைகள் இருப்பில் சேர்க்கப்பட்டன! புதிய இருப்பு: ${res.data.remaining_tablets}`
        : `Successfully added ${qty} tablets! New available stock: ${res.data.remaining_tablets}`;
      toast.success(msg);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.detail || 'Failed to refill tablets');
    } finally {
      setRefilling(false);
    }
  };

  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const [medRes, schedRes] = await Promise.all([
          medicinesAPI.get(id),
          medicinesAPI.getSchedule(id).catch(() => ({ data: [] })),
        ]);
        setMedicine(medRes.data);
        if (schedRes.data && schedRes.data.length > 0 && schedRes.data[0].reminder_times?.length > 0) {
          setReminderTimes(schedRes.data[0].reminder_times);
        }
      } catch (err) {
        console.error(err);
        toast.error(t('common.error', language));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, language]);

  const handleDiscontinue = async () => {
    if (!id || !window.confirm(language === 'ta' ? 'இந்த மருந்தை நிறுத்த விரும்புகிறீர்களா?' : 'Are you sure you want to discontinue this medicine?')) {
      return;
    }
    setDiscontinuing(true);
    try {
      await medicinesAPI.discontinue(id);
      toast.success(language === 'ta' ? 'மருந்து நிறுத்தப்பட்டது' : 'Medicine discontinued');
      navigate('/patient/medicines');
    } catch {
      toast.error(t('common.error', language));
    } finally {
      setDiscontinuing(false);
    }
  };

  const handleAddTime = () => {
    setReminderTimes(prev => [...prev, '12:00']);
  };

  const handleRemoveTime = (index: number) => {
    if (reminderTimes.length > 1) {
      setReminderTimes(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleTimeChange = (index: number, val: string) => {
    setReminderTimes(prev => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };

  const setTimeToNextMinute = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 1);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    setReminderTimes([`${hh}:${mm}`]);
    toast.success(language === 'ta' ? `அலாரம் நேரம் ${hh}:${mm} (+1 நிமிடம்) என மாற்றப்பட்டது. சேமிக்கவும்.` : `Alarm set to ${hh}:${mm} (+1 min). Click Save below!`);
  };

  const handlePresetTime = (val: string) => {
    if (!reminderTimes.includes(val)) {
      setReminderTimes(prev => [...prev, val]);
    }
  };

  const handleSaveTimes = async () => {
    if (!medicine || !id) return;
    setSavingSchedule(true);
    try {
      await medicinesAPI.setSchedule(id, reminderTimes);
      const msg = language === 'ta'
        ? `${medicine.name} மாத்திரையின் நினைவூட்டல் நேரம் வெற்றிகரமாக சேமிக்கப்பட்டது!`
        : `Reminder clock time for ${medicine.name} saved successfully!`;
      toast.success(msg);
      speak(msg, language);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.detail || 'Failed to save schedule');
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleSpeak = () => {
    if (!medicine) return;
    if (isSpeaking) {
      stopSpeaking();
      return;
    }
    const timesSpoken = reminderTimes.map(t => {
      const [h, m] = t.split(':').map(Number);
      const period = h < 12 ? (language === 'ta' ? 'காலை' : 'AM') : (language === 'ta' ? 'இரவு' : 'PM');
      const hr = h % 12 || 12;
      return language === 'ta' ? `${period} ${hr}:${m < 10 ? '0' : ''}${m}` : `${hr}:${m < 10 ? '0' : ''}${m} ${period}`;
    }).join(', ');

    const text = language === 'ta'
      ? `${medicine.name} ${medicine.strength}. நேரம்: ${timesSpoken}. ${medicine.food_instructions || ''}. ${medicine.special_instructions || ''}`
      : `${medicine.name} ${medicine.strength}. Scheduled at: ${timesSpoken}. Food instructions: ${medicine.food_instructions || ''}. ${medicine.special_instructions || ''}`;
    speak(text, language);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!medicine) {
    return (
      <div className="min-h-screen p-8 text-center">
        <p className="text-gray-500">{language === 'ta' ? 'மருந்து கிடைக்கவில்லை' : 'Medicine not found'}</p>
        <Link to="/patient/medicines" className="text-blue-600 font-bold mt-4 inline-block">
          ← {t('common.back', language)}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link to="/patient/medicines" className="flex items-center gap-2 text-blue-600 font-bold hover:underline">
            <ArrowLeft className="h-5 w-5" />
            {t('common.back', language)}
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSpeak}
              onMouseLeave={() => { if (isSpeaking) stopSpeaking(); }}
              onBlur={() => { if (isSpeaking) stopSpeaking(); }}
              className="flex items-center gap-2 bg-purple-100 hover:bg-purple-200 text-purple-700 font-bold px-4 py-2 rounded-2xl transition-colors cursor-pointer"
            >
              <Volume2 className={`h-5 w-5 ${isSpeaking ? 'animate-pulse text-amber-600' : ''}`} />
              {isSpeaking ? (language === 'ta' ? '🛑 நிறுத்து' : '🛑 Stop') : (language === 'ta' ? 'குரலில் கேள்' : 'Hear Instructions')}
            </button>
            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-2xl border border-red-200 transition-all shadow-xs active:scale-95 cursor-pointer"
              aria-label={language === 'ta' ? 'வெளியேறு (Sign Out)' : 'Sign Out'}
              title={language === 'ta' ? 'கணக்கிலிருந்து வெளியேறு' : 'Sign Out of Account'}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">{language === 'ta' ? 'வெளியேறு' : 'Sign Out'}</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 sm:p-8 space-y-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase mb-2 ${
                medicine.verification_status === 'verified' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {medicine.verification_status}
              </span>
              <h1 className="text-3xl font-extrabold text-gray-900">{medicine.name}</h1>
              {medicine.brand_name && (
                <p className="text-lg text-gray-500 font-medium">{medicine.brand_name}</p>
              )}
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-blue-600">{medicine.strength}</span>
              <p className="text-sm text-gray-500 capitalize">{medicine.dosage_form}</p>
            </div>
          </div>

          {/* Visual Identifiers */}
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <h3 className="font-bold text-gray-700 text-sm mb-3">
              {language === 'ta' ? '🔍 தோற்ற அடையாளம்' : '🔍 Visual Appearance'}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div className="bg-white p-3 rounded-xl border border-gray-200">
                <span className="text-gray-400 block text-xs">{language === 'ta' ? 'நிறம்' : 'Color'}</span>
                <span className="font-bold capitalize">{medicine.color || 'white'}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-gray-200">
                <span className="text-gray-400 block text-xs">{language === 'ta' ? 'வடிவம்' : 'Shape'}</span>
                <span className="font-bold capitalize">{medicine.shape || 'round'}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-gray-200">
                <span className="text-gray-400 block text-xs">{language === 'ta' ? 'அளவு' : 'Size'}</span>
                <span className="font-bold">{medicine.size_description || 'medium'}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-gray-200">
                <span className="text-gray-400 block text-xs">{language === 'ta' ? 'அட்டை' : 'Packaging'}</span>
                <span className="font-bold">{medicine.packaging_color || 'blister'}</span>
              </div>
            </div>
          </div>

          {/* TABLET STOCK & INVENTORY MANAGEMENT */}
          <div className="bg-emerald-50/70 border-2 border-emerald-200 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📦</span>
                <div>
                  <h3 className="text-lg font-black text-emerald-950">
                    {language === 'ta' ? 'மாத்திரை இருப்பு மேலாண்மை' : 'Tablet Stock & Inventory'}
                  </h3>
                  <p className="text-xs text-emerald-800">
                    {language === 'ta'
                      ? 'ஒவ்வொரு முறை அலாரத்தை உறுதிப்படுத்தும் போது இருப்பு 1 குறையும்'
                      : 'Stock decreases by 1 each time an alarm dose is confirmed'}
                  </p>
                </div>
              </div>

              {/* Refill Quick Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={refilling}
                  onClick={() => handleRefill(10)}
                  className="flex items-center gap-1 text-xs font-bold bg-white text-emerald-800 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-300 transition-all disabled:opacity-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  +10 {language === 'ta' ? 'சேர்' : 'Tablets'}
                </button>
                <button
                  type="button"
                  disabled={refilling}
                  onClick={() => handleRefill(30)}
                  className="flex items-center gap-1 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl shadow-xs transition-all disabled:opacity-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  +30 {language === 'ta' ? 'அட்டை (1 Strip)' : 'Strip (30)'}
                </button>
              </div>
            </div>

            {/* Stock Count & Progress Bar */}
            <div className="bg-white p-4 rounded-2xl border border-emerald-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-700">
                  {language === 'ta' ? 'தற்போதைய இருப்பு:' : 'Remaining Stock:'}
                </span>
                <span className="text-xl font-black text-emerald-900">
                  {medicine.remaining_tablets !== undefined ? medicine.remaining_tablets : 30}
                  <span className="text-xs font-semibold text-gray-500 ml-1">
                    / {medicine.total_tablets || 30} {language === 'ta' ? 'மாத்திரைகள்' : 'tablets'}
                  </span>
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${
                    (medicine.remaining_tablets !== undefined ? medicine.remaining_tablets : 30) <= (medicine.low_stock_threshold || 10)
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(
                        0,
                        (((medicine.remaining_tablets !== undefined ? medicine.remaining_tablets : 30) /
                          (medicine.total_tablets || 30)) *
                          100)
                      )
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Low stock alert callout */}
            {(medicine.remaining_tablets !== undefined ? medicine.remaining_tablets : 30) <= (medicine.low_stock_threshold || 10) ? (
              <div className="bg-amber-100 border border-amber-300 rounded-2xl p-3 flex items-start gap-2.5 text-amber-900 text-xs font-bold">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-black text-sm">
                    {language === 'ta'
                      ? '⚠️ குறைந்த இருப்பு எச்சரிக்கை செயலில் உள்ளது!'
                      : '⚠️ Low Stock Alert Active!'}
                  </p>
                  <p className="font-normal mt-0.5">
                    {language === 'ta'
                      ? `இருப்பு 10 அல்லது அதற்குக் குறைவாக உள்ளதால், பராமரிப்பாளருக்கு தினசரி ஒருமுறை மின்னஞ்சல் மற்றும் குறுஞ்செய்தி அனுப்பப்படுகிறது. தயவுசெய்து புதிய அட்டையை வாங்கி மேலே உள்ள 'சேர்' பொத்தானை அழுத்தவும்.`
                      : `Available stock is 10 or fewer tablets. An automated low-stock alert is sent to your registered caretaker once daily. Please refill when you purchase new medicine.`}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-emerald-800 font-medium">
                ✅ {language === 'ta'
                  ? 'போதுமான அளவு மாத்திரைகள் இருப்பில் உள்ளன. 10 மாத்திரைகள் வரும் போது பராமரிப்பாளருக்கு எச்சரிக்கை செய்யப்படும்.'
                  : 'Adequate tablet stock available. Caretaker alert triggers when 10 or fewer remain.'}
              </p>
            )}
          </div>

          {/* DEDICATED REMINDER CLOCK TIME SECTION */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-6 w-6 text-blue-600" />
                <h3 className="text-lg font-black text-blue-950">
                  {language === 'ta' ? '⏰ மருந்து நினைவூட்டல் நேரம்' : '⏰ Scheduled Clock Times'}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={setTimeToNextMinute}
                  className="text-xs font-bold bg-green-100 hover:bg-green-200 text-green-800 px-3 py-1.5 rounded-xl border border-green-300 transition"
                >
                  ⏱️ {language === 'ta' ? '+1 நிமிடம்' : '+1 Min Test'}
                </button>
                <button
                  type="button"
                  onClick={handleAddTime}
                  className="flex items-center gap-1 text-xs font-bold bg-white text-blue-700 px-3 py-1.5 rounded-xl border border-blue-300 hover:bg-blue-100"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {language === 'ta' ? 'நேரம் சேர்' : 'Add Time'}
                </button>
              </div>
            </div>

            <p className="text-xs text-blue-800">
              {language === 'ta'
                ? 'இந்த மாத்திரையை எடுத்துக்கொள்ள வேண்டிய நேரத்தை அமைத்து சேமிக்கவும்.'
                : 'Set or change the exact clock times when you should take this tablet.'}
            </p>

            {/* Time Pickers */}
            <div className="space-y-3">
              {reminderTimes.map((timeVal, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="flex-1 bg-white border border-blue-300 rounded-2xl px-4 py-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500">
                      {language === 'ta' ? `நேரம் ${idx + 1}` : `Time #${idx + 1}`}
                    </span>
                    <input
                      type="time"
                      value={timeVal}
                      onChange={e => handleTimeChange(idx, e.target.value)}
                      className="text-lg font-black text-gray-900 bg-transparent outline-none cursor-pointer"
                    />
                  </div>
                  {reminderTimes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTime(idx)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-xl"
                      aria-label="Remove time"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Quick Presets */}
            <div>
              <span className="text-xs font-bold text-blue-800 block mb-1.5">
                {language === 'ta' ? 'விரைவு முன்னமைவுகள்:' : 'Quick Presets:'}
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  { val: '08:00', labelEn: '🌅 Morning (08:00 AM)', labelTa: '🌅 காலை (08:00 AM)' },
                  { val: '13:00', labelEn: '☀️ Afternoon (01:00 PM)', labelTa: '☀️ மதியம் (01:00 PM)' },
                  { val: '20:30', labelEn: '🌙 Night (08:30 PM)', labelTa: '🌙 இரவு (08:30 PM)' },
                ].map((preset) => (
                  <button
                    key={preset.val}
                    type="button"
                    onClick={() => handlePresetTime(preset.val)}
                    className="text-xs font-bold px-3 py-1.5 bg-white hover:bg-blue-100 text-blue-700 rounded-xl border border-blue-200 transition-colors"
                  >
                    {language === 'ta' ? preset.labelTa : preset.labelEn}
                  </button>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <button
              type="button"
              onClick={handleSaveTimes}
              disabled={savingSchedule}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black text-base rounded-2xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-98"
            >
              {savingSchedule ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span>{language === 'ta' ? 'சேமிக்கிறது...' : 'Saving Schedule...'}</span>
                </>
              ) : (
                <>
                  <Check className="h-5 w-5" />
                  <span>{language === 'ta' ? '💾 நேரத்தைச் சேமி' : '💾 Save Clock Time'}</span>
                </>
              )}
            </button>
          </div>

          {/* Instructions */}
          <div className="space-y-3">
            <h3 className="font-bold text-gray-800">
              {language === 'ta' ? '📋 வழிமுறைகள்' : '📋 Prescribed Instructions'}
            </h3>
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-blue-900">
              <p className="font-semibold">
                🍽️ {medicine.food_instructions || 'Take after food'}
              </p>
              {medicine.special_instructions && (
                <p className="mt-2 text-sm">{medicine.special_instructions}</p>
              )}
            </div>
          </div>

          {medicine.warning_info && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-900 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0 text-amber-600" />
              <div>
                <p className="font-bold text-sm">{language === 'ta' ? 'எச்சரிக்கை' : 'Safety Warning'}</p>
                <p className="text-sm">{medicine.warning_info}</p>
              </div>
            </div>
          )}

          {/* Doctor & Pharmacy */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600 pt-4 border-t border-gray-100">
            <div>
              <span className="text-gray-400 block">{language === 'ta' ? 'மருத்துவர்' : 'Prescribed By'}</span>
              <span className="font-semibold">{medicine.prescriber_name || '—'}</span>
            </div>
            <div>
              <span className="text-gray-400 block">{language === 'ta' ? 'மருந்தகம்' : 'Pharmacy'}</span>
              <span className="font-semibold">{medicine.pharmacy_name || '—'}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-6 border-t border-gray-100 flex gap-4">
            <Link
              to="/patient/prescriptions/upload"
              className="flex-1 py-3 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-2xl text-center transition-colors"
            >
              📄 {language === 'ta' ? 'மருந்துச்சீட்டு பதிவேற்று' : 'Upload Prescription'}
            </Link>
            {medicine.is_active && (
              <button
                type="button"
                disabled={discontinuing}
                onClick={handleDiscontinue}
                className="py-3 px-6 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-2xl flex items-center gap-2 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                {language === 'ta' ? 'நிறுத்து' : 'Discontinue'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
