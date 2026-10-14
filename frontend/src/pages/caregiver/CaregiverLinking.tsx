import React, { useState } from 'react';
import { ArrowLeft, UserPlus, Check, AlertCircle, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { caregiversAPI } from '../../lib/api';
import { t } from '../../lib/i18n';
import toast from 'react-hot-toast';

export default function CaregiverLinking() {
  const { language } = useLanguage();
  const navigate = useNavigate();

  const [patientEmail, setPatientEmail] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [relationLabel, setRelationLabel] = useState('son');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientEmail.trim() && !patientPhone.trim()) {
      toast.error(language === 'ta' ? 'மின்னஞ்சல் அல்லது தொலைபேசி எண் தேவை' : 'Email or phone number is required');
      return;
    }

    setSubmitting(true);
    try {
      await caregiversAPI.requestLink({
        patient_email: patientEmail.trim() || undefined,
        patient_phone: patientPhone.trim() || undefined,
        relation_label: relationLabel,
        contact_method: 'sms',
      });
      toast.success(language === 'ta' ? 'இணைப்பு கோரிக்கை அனுப்பப்பட்டது!' : 'Linking request sent successfully!');
      navigate('/caregiver/dashboard');
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.detail || t('common.error', language));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex items-center gap-2">
          <Link to="/caregiver/dashboard" className="flex items-center gap-2 text-blue-600 font-bold hover:underline">
            <ArrowLeft className="h-5 w-5" />
            {t('common.back', language)}
          </Link>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
              <UserPlus className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900">
                {language === 'ta' ? 'நோயாளியுடன் இணைப்பை கோரவும்' : 'Request Connection to Patient'}
              </h1>
              <p className="text-gray-500 text-xs">
                {language === 'ta' ? 'நோயாளி ஒப்புதல் அளித்த பிறகே அட்டவணை மற்றும் எச்சரிக்கைகள் தெரியும்' : 'Requires explicit patient consent before accessing records'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                {language === 'ta' ? 'நோயாளியின் மின்னஞ்சல் முகவரி' : 'Patient Email Address'}
              </label>
              <input
                type="email"
                value={patientEmail}
                onChange={e => setPatientEmail(e.target.value)}
                placeholder="e.g. arjun.kumar@example.com"
                className="w-full text-base px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                {language === 'ta' ? 'அல்லது நோயாளியின் தொலைபேசி எண்' : 'Or Patient Phone Number'}
              </label>
              <input
                type="tel"
                value={patientPhone}
                onChange={e => setPatientPhone(e.target.value)}
                placeholder="e.g. +919876543201"
                className="w-full text-base px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                {language === 'ta' ? 'உறவுமுறை' : 'Relationship'}
              </label>
              <select
                value={relationLabel}
                onChange={e => setRelationLabel(e.target.value)}
                className="w-full text-base px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-blue-500 outline-none"
              >
                <option value="son">Son / மகன்</option>
                <option value="daughter">Daughter / மகள்</option>
                <option value="spouse">Spouse / துணைவர்</option>
                <option value="caretaker">Caretaker / பராமரிப்பாளர்</option>
                <option value="nurse">Nurse / செவிலியர்</option>
              </select>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 flex items-start gap-2">
              <ShieldCheck className="h-5 w-5 mt-0.5 flex-shrink-0 text-blue-600" />
              <p>
                {language === 'ta'
                  ? 'தனியுரிமை பாதுகாப்பு: நோயாளியின் ஒப்புதல் இல்லாமல் மருந்து விவரங்கள் பகிரப்படாது.'
                  : 'Privacy Guarantee: No patient prescription details are disclosed until patient verifies consent.'}
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-lg rounded-2xl shadow-lg"
            >
              {submitting ? t('common.loading', language) : (language === 'ta' ? 'இணைப்பு கோரிக்கை அனுப்புக' : 'Send Link Request')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
