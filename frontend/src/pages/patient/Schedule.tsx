import React, { useEffect, useState } from 'react';
import { ArrowLeft, Clock, Calendar, CheckCircle, AlertCircle, Plus, Mic, Edit3, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { remindersAPI, medicinesAPI } from '../../lib/api';
import { t } from '../../lib/i18n';
import type { ReminderEvent, Medicine } from '../../types';
import AlarmModal from '../../components/patient/AlarmModal';

export default function Schedule() {
  const { language } = useLanguage();
  const [reminders, setReminders] = useState<ReminderEvent[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [remRes, medRes] = await Promise.all([
          remindersAPI.upcoming(),
          medicinesAPI.list(),
        ]);
        setReminders(remRes.data || []);
        setMedicines(medRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link to="/patient/dashboard" className="flex items-center gap-2 text-blue-600 font-bold hover:underline">
            <ArrowLeft className="h-5 w-5" />
            {t('common.back', language)}
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('medisakhi-trigger-alarm'))}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-700 border border-red-200 rounded-2xl font-bold text-xs hover:bg-red-100 transition-colors shadow-sm"
            >
              <Bell className="h-4 w-4 text-red-600 animate-bounce" />
              {language === 'ta' ? 'அலாரம் ஒலி' : 'Ring Alarm'}
            </button>
            <Link
              to="/patient/voice-assistant"
              className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 text-purple-700 border border-purple-200 rounded-2xl font-bold text-xs hover:bg-purple-100"
            >
              <Mic className="h-4 w-4" />
              {language === 'ta' ? 'குரல் மூலம் நேரம் அமை' : 'Set Time by Voice'}
            </Link>
            <Link
              to="/patient/medicines/add"
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-2xl font-bold text-sm shadow hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              {t('medicine.add', language)}
            </Link>
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">
            {language === 'ta' ? 'மருந்து அட்டவணை' : 'Medicine Schedule'}
          </h1>
          <p className="text-gray-500 mt-1">
            {language === 'ta' ? 'அடுத்த 24 மணி நேரத்திற்கான நினைவூட்டல்கள்' : 'Upcoming doses scheduled for the next 24 hours'}
          </p>
        </div>

        {/* Voice Time Helper Banner */}
        <Link
          to="/patient/voice-assistant"
          className="block bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-3xl p-4 hover:shadow-md transition-all text-left"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-600 text-white rounded-2xl">
              <Mic className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-purple-900 text-sm">
                {language === 'ta' ? '💡 குரல் மூலம் மாத்திரை நேரம் மாற்றலாம்' : '💡 Set or change medicine times using your voice'}
              </h4>
              <p className="text-xs text-purple-700 mt-0.5">
                {language === 'ta'
                  ? 'குரல் உதவியாளரிடம் "காலை 9 மணிக்கு மாத்திரை நேரம் வை" என்று கூறி உடனே மாற்றலாம்!'
                  : 'Say "Set time for Telma at 9:00 AM" in Voice Assistant to update instantly!'}
              </p>
            </div>
          </div>
        </Link>

        {/* Schedule List */}
        <div data-testid="upcoming-reminders" className="space-y-3">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" />
            </div>
          ) : reminders.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center text-gray-500 border border-gray-200">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-lg font-bold">{language === 'ta' ? 'நினைவூட்டல்கள் எதுவும் இல்லை' : 'No upcoming reminders'}</p>
            </div>
          ) : (
            reminders.map(rem => {
              const med = medicines.find(m => m.id === rem.medicine_id);
              const isTaken = rem.status === 'patient_reported_taken';
              const isMissed = rem.status === 'confirmation_not_received';
              const dateObj = new Date(rem.scheduled_datetime);
              const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <div
                  key={rem.id}
                  data-testid="reminder-item"
                  className={`bg-white rounded-3xl p-5 shadow-sm border-2 flex items-center justify-between gap-4 transition-all ${
                    isTaken ? 'border-green-200 bg-green-50/20' : isMissed ? 'border-orange-200 bg-orange-50/20' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                      <Clock className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-2xl font-black text-gray-900 block">{timeStr}</span>
                      <h4 className="text-lg font-bold text-blue-900">{rem.medicine_name || med?.name || 'Medicine'}</h4>
                      <p className="text-xs text-gray-500">{med?.strength || ''} • {med?.food_instructions || 'After food'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {med && (
                      <Link
                        to={`/patient/medicines/${med.id}`}
                        className="px-3 py-2 bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-700 font-bold rounded-xl text-xs flex items-center gap-1 transition-colors"
                        title={language === 'ta' ? 'நேரம் மாற்று' : 'Edit Time'}
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">{language === 'ta' ? 'நேரம் மாற்று' : 'Edit Time'}</span>
                      </Link>
                    )}
                    {isTaken ? (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-800 rounded-xl text-xs font-bold">
                        <CheckCircle className="h-4 w-4" />
                        {language === 'ta' ? 'எடுத்தாயிற்று' : 'Taken'}
                      </span>
                    ) : (
                      <Link
                        to={`/patient/reminders/${rem.id}`}
                        data-testid="confirm-reminder-btn"
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-2xl text-sm shadow transition-colors"
                      >
                        {language === 'ta' ? 'உறுதி செய் ➔' : 'Confirm ➔'}
                      </Link>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      <AlarmModal />
    </div>
  );
}
