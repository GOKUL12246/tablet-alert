import React, { useEffect, useState } from 'react';
import { Users, Bell, AlertTriangle, ShieldCheck, HeartHandshake, Phone, ArrowRight, UserPlus, Clock, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../contexts/LanguageContext';
import { caregiversAPI } from '../../lib/api';
import { t } from '../../lib/i18n';

export default function CaregiverDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [patients, setPatients] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [patRes, altRes] = await Promise.all([
          caregiversAPI.patients(),
          caregiversAPI.alerts(),
        ]);
        setPatients(patRes.data || []);
        setAlerts(altRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const openAlerts = alerts.filter(a => a.status === 'open');

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">
              {language === 'ta' ? '👨‍👩‍👧 கவனிப்பாளர் கட்டுப்பாட்டு மையம்' : '👨‍👩‍👧 Caregiver & Family Dashboard'}
            </h1>
            <p className="text-gray-500 mt-1">
              {language === 'ta' ? 'உங்கள் குடும்ப உறுப்பினரின் மருந்து அட்டவணையை கண்காணிக்கவும்' : 'Monitor authorized patient medication adherence and emergency alerts'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/caregiver/link"
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-bold rounded-2xl shadow hover:bg-blue-700 transition-all"
            >
              <UserPlus className="h-5 w-5" />
              {language === 'ta' ? 'புதிய நோயாளியை இணைக்க' : 'Link New Patient'}
            </Link>
            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-2xl border border-red-200 transition-all shadow-xs active:scale-95 cursor-pointer"
              aria-label={language === 'ta' ? 'வெளியேறு (Sign Out)' : 'Sign Out'}
              title={language === 'ta' ? 'கணக்கிலிருந்து வெளியேறு' : 'Sign Out of Account'}
            >
              <LogOut className="h-4 w-4" />
              <span>{language === 'ta' ? 'வெளியேறு' : 'Sign Out'}</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="p-4 bg-blue-100 text-blue-600 rounded-2xl">
              <Users className="h-8 w-8" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">{language === 'ta' ? 'இணைக்கப்பட்ட நோயாளிகள்' : 'Linked Patients'}</p>
              <p className="text-3xl font-black text-gray-900">{patients.length}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="p-4 bg-orange-100 text-orange-600 rounded-2xl">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">{language === 'ta' ? 'செயலில் உள்ள எச்சரிக்கைகள்' : 'Active Alerts'}</p>
              <p className="text-3xl font-black text-orange-600">{openAlerts.length}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="p-4 bg-green-100 text-green-600 rounded-2xl">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">{language === 'ta' ? 'சராசரி உறுதிப்பாடு' : 'Avg Adherence'}</p>
              <p className="text-3xl font-black text-green-600">85%</p>
            </div>
          </div>
        </div>

        {/* Urgent Alerts Banner */}
        {openAlerts.length > 0 && (
          <div className="bg-orange-50 border-2 border-orange-300 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-orange-600 animate-bounce" />
                <h3 className="text-lg font-black text-orange-900">
                  {language === 'ta' ? 'கவனிக்கப்படாத நினைவூட்டல் எச்சரிக்கைகள்!' : 'Unacknowledged Dose Alerts!'}
                </h3>
              </div>
              <Link to="/caregiver/alerts" className="text-sm font-bold text-orange-700 hover:underline">
                {language === 'ta' ? 'அனைத்தையும் காண்க ➔' : 'View All Alerts ➔'}
              </Link>
            </div>
            <div className="space-y-2">
              {openAlerts.slice(0, 2).map(a => (
                <div key={a.id} className="bg-white p-4 rounded-2xl border border-orange-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-gray-900">{a.patient_name || 'Patient'}</span>
                    <p className="text-xs text-gray-500">{language === 'ta' ? a.message_ta : a.message_en}</p>
                  </div>
                  <Link
                    to="/caregiver/alerts"
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs"
                  >
                    {language === 'ta' ? 'நடவடிக்கை எடுக்க' : 'Take Action'}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Linked Patients List */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">
            {language === 'ta' ? 'அங்கீகரிக்கப்பட்ட நோயாளிகள்' : 'Authorized Patients'}
          </h2>
          {patients.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center text-gray-500 border border-gray-200">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="font-bold text-lg">{language === 'ta' ? 'நோயாளிகள் யாரும் இணைக்கப்படவில்லை' : 'No patients linked yet'}</p>
              <Link to="/caregiver/link" className="text-blue-600 font-bold underline mt-2 inline-block">
                {language === 'ta' ? 'நோயாளியுடன் இணைப்பை கோரவும்' : 'Request connection with patient'}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {patients.map(p => (
                <div key={p.relationship_id} data-testid="patient-card" className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{p.patient_name}</h3>
                      <p className="text-xs font-semibold text-blue-600 capitalize">
                        {p.relation_label || 'Family Member'} • {p.contact_method}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">
                      {p.consent_status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 bg-gray-50 p-3 rounded-2xl">
                    <div>
                      <span className="text-gray-400 block">{language === 'ta' ? 'இன்றைய மருந்துகள்' : 'Scheduled Today'}</span>
                      <span className="font-bold text-base text-gray-800">{p.today_scheduled_doses || 2}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">{language === 'ta' ? 'உறுதி செய்யப்பட்டது' : 'Confirmed'}</span>
                      <span className="font-bold text-base text-green-600">{p.today_confirmed_doses || 2}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      to="/patient/schedule"
                      data-testid="view-schedule-btn"
                      className="flex-1 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-center text-xs"
                    >
                      {language === 'ta' ? 'அட்டவணை பார்க்க' : 'View Schedule'}
                    </Link>
                    <a
                      href={`tel:${p.patient_phone || '+919876543201'}`}
                      className="px-4 py-2.5 bg-green-50 hover:bg-green-100 text-green-700 font-bold rounded-xl flex items-center justify-center text-xs"
                    >
                      <Phone className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
