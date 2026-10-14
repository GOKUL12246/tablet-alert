import React, { useEffect, useState } from 'react';
import { ArrowLeft, AlertTriangle, CheckCircle, Phone, Check, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { caregiversAPI } from '../../lib/api';
import { t } from '../../lib/i18n';
import toast from 'react-hot-toast';

export default function CaregiverAlerts() {
  const { language } = useLanguage();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acknowledgedMsg, setAcknowledgedMsg] = useState(false);
  const [resolveNotes, setResolveNotes] = useState<Record<string, string>>({});

  const fetchAlerts = async () => {
    try {
      const res = await caregiversAPI.alerts();
      setAlerts(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleAcknowledge = async (alertId: string) => {
    try {
      await caregiversAPI.acknowledge(alertId);
      setAcknowledgedMsg(true);
      toast.success(language === 'ta' ? 'எச்சரிக்கை ஏற்றுக்கொள்ளப்பட்டது' : 'Alert acknowledged');
      fetchAlerts();
    } catch {
      toast.error(t('common.error', language));
    }
  };

  const handleResolve = async (alertId: string) => {
    const notes = resolveNotes[alertId] || 'Caregiver checked on patient and resolved alert.';
    try {
      await caregiversAPI.resolve(alertId, notes);
      toast.success(language === 'ta' ? 'எச்சரிக்கை தீர்க்கப்பட்டது' : 'Alert resolved');
      fetchAlerts();
    } catch {
      toast.error(t('common.error', language));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-2">
          <Link to="/caregiver/dashboard" className="flex items-center gap-2 text-blue-600 font-bold hover:underline">
            <ArrowLeft className="h-5 w-5" />
            {t('common.back', language)}
          </Link>
        </div>

        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">
            {language === 'ta' ? '🚨 மருந்து எச்சரிக்கைகள்' : '🚨 Missed Dose & Assistance Alerts'}
          </h1>
          <p className="text-gray-500 mt-1">
            {language === 'ta'
              ? 'நோயாளி மருந்தை உறுதிப்படுத்தாத போது குடும்பத்தினருக்கு அனுப்பப்படும் எச்சரிக்கைகள்'
              : 'Actionable alerts triggered when patient does not acknowledge scheduled reminders'}
          </p>
        </div>

        {acknowledgedMsg && (
          <div data-testid="alert-acknowledged-msg" className="p-4 bg-green-100 border border-green-300 text-green-900 rounded-2xl flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="font-bold">
              {language === 'ta' ? 'எச்சரிக்கை ஏற்றுக்கொள்ளப்பட்டது!' : 'Alert successfully acknowledged!'}
            </span>
          </div>
        )}

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" />
            </div>
          ) : alerts.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center text-gray-500 border border-gray-200">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <p className="font-bold text-lg">{language === 'ta' ? 'செயலில் எச்சரிக்கைகள் எதுவும் இல்லை' : 'No active alerts right now'}</p>
            </div>
          ) : (
            alerts.map(a => {
              const isOpen = a.status === 'open';
              const isAck = a.status === 'acknowledged';
              return (
                <div
                  key={a.id}
                  data-testid="alert-card"
                  className={`bg-white rounded-3xl p-6 shadow-sm border-2 space-y-4 ${
                    isOpen ? 'border-orange-300' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div>
                      <span className="inline-block px-3 py-1 bg-red-100 text-red-800 text-xs font-black uppercase rounded-full mb-1">
                        {a.alert_type || 'Missed Reminder'}
                      </span>
                      <h3 className="text-xl font-black text-gray-900">{a.patient_name || 'Patient'}</h3>
                      <p className="text-xs text-gray-400">{new Date(a.created_at).toLocaleString()}</p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-black rounded-full uppercase ${
                      isOpen ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {a.status}
                    </span>
                  </div>

                  <p className="text-base font-semibold text-gray-800 bg-orange-50/50 p-4 rounded-2xl border border-orange-100">
                    {language === 'ta' ? a.message_ta : a.message_en}
                  </p>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <a
                      href="tel:+919876543201"
                      className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-sm flex items-center gap-2 shadow"
                    >
                      <Phone className="h-4 w-4" />
                      {language === 'ta' ? 'நோயாளியை அழைக்கவும்' : 'Contact Patient'}
                    </a>

                    {isOpen && (
                      <button
                        type="button"
                        data-testid="acknowledge-btn"
                        onClick={() => handleAcknowledge(a.id)}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow"
                      >
                        {language === 'ta' ? 'ஏற்றுக்கொள்' : 'Acknowledge Alert'}
                      </button>
                    )}

                    {a.status !== 'resolved' && (
                      <button
                        type="button"
                        onClick={() => handleResolve(a.id)}
                        className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl text-sm"
                      >
                        {language === 'ta' ? 'தீர்க்கப்பட்டதாக குறி' : 'Mark Resolved'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
