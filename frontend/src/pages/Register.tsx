import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Pill, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../lib/i18n';

const ROLES = [
  { value: 'patient', labelEn: 'Patient', labelTa: 'நோயாளி', desc: 'I want to manage my medicines' },
  { value: 'caregiver', labelEn: 'Caregiver / Family', labelTa: 'கவனிப்பாளர் / குடும்பம்', desc: 'I look after someone who takes medicines' },
  { value: 'healthcare_professional', labelEn: 'Healthcare Professional', labelTa: 'சுகாதார நிபுணர்', desc: 'I am a doctor, nurse, or pharmacist' },
];

export default function Register() {
  const { register } = useAuth();
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();

  const [form, setForm] = useState({ full_name: '', email: '', phone_number: '', password: '', role: 'patient' });
  const [showPw, setShowPw] = useState(false);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function set(field: string, val: string) { setForm(f => ({ ...f, [field]: val })); }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!consent) { setError(language === 'ta' ? 'தனியுரிமை விதிமுறைகளை ஒப்புக்கொள்ளுங்கள்' : 'Please accept the privacy terms'); return; }
    if (form.password.length < 8) { setError(language === 'ta' ? 'கடவுச்சொல் குறைந்தது 8 எழுத்துகள் இருக்க வேண்டும்' : 'Password must be at least 8 characters'); return; }
    setError(''); setLoading(true);
    try {
      await register({ ...form, role: form.role as any, language });
      navigate(form.role === 'patient' ? '/patient/dashboard' : form.role === 'caregiver' ? '/caregiver/dashboard' : '/healthcare-professional/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.detail || t('common.error', language));
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex flex-col items-center justify-center px-4 py-12">
      <div className="flex gap-2 mb-6">
        <button onClick={() => setLanguage('en')} className={`px-4 py-2 rounded-lg text-sm font-semibold border-2 ${language === 'en' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-600 border-blue-300'}`}>English</button>
        <button onClick={() => setLanguage('ta')} className={`px-4 py-2 rounded-lg text-sm font-semibold border-2 ${language === 'ta' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-600 border-blue-300'}`}>தமிழ்</button>
      </div>

      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex bg-green-600 rounded-2xl p-4 mb-4"><Pill className="h-10 w-10 text-white" /></div>
          <h1 className="text-3xl font-extrabold text-gray-900">MEDISAKHI AI</h1>
          <p className="text-gray-500 mt-1">{language === 'ta' ? 'புதிய கணக்கு உருவாக்கவும்' : 'Create your account'}</p>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('auth.register', language)}</h2>

          {error && (
            <div role="alert" className="flex items-start gap-3 bg-red-50 border-2 border-red-300 rounded-xl p-4 mb-6">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Role selector */}
            <div className="mb-5">
              <p className="block text-sm font-semibold text-gray-700 mb-2">{language === 'ta' ? 'நீங்கள் யார்?' : 'I am a...'}</p>
              <div className="space-y-2">
                {ROLES.map(r => (
                  <label key={r.value} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${form.role === r.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                    <input type="radio" name="role" value={r.value} checked={form.role === r.value} onChange={e => set('role', e.target.value)} className="accent-blue-600" />
                    <span>
                      <span className="font-semibold text-gray-800">{language === 'ta' ? r.labelTa : r.labelEn}</span>
                      <span className="block text-xs text-gray-500">{r.desc}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Fields */}
            {[
              { id: 'full_name', label: t('auth.full_name', language), type: 'text', autocomplete: 'name', placeholder: language === 'ta' ? 'உங்கள் முழு பெயர்' : 'Your full name' },
              { id: 'email', label: t('auth.email', language), type: 'email', autocomplete: 'email', placeholder: 'you@email.com' },
              { id: 'phone_number', label: t('auth.phone', language), type: 'tel', autocomplete: 'tel', placeholder: '+91 98765 43210' },
            ].map(f => (
              <div key={f.id} className="mb-4">
                <label htmlFor={f.id} className="block text-sm font-semibold text-gray-700 mb-1">{f.label}</label>
                <input id={f.id} type={f.type} autoComplete={f.autocomplete} placeholder={f.placeholder}
                  value={(form as any)[f.id]} onChange={e => set(f.id, e.target.value)}
                  required={f.id !== 'phone_number'}
                  className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-colors" />
              </div>
            ))}

            <div className="mb-6">
              <label htmlFor="reg-password" className="block text-sm font-semibold text-gray-700 mb-1">{t('auth.password', language)}</label>
              <div className="relative">
                <input id="reg-password" type={showPw ? 'text' : 'password'} autoComplete="new-password" required minLength={8}
                  value={form.password} onChange={e => set('password', e.target.value)}
                  className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none pr-12 transition-colors" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  aria-label={showPw ? 'Hide password' : 'Show password'}>
                  {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">{language === 'ta' ? 'குறைந்தது 8 எழுத்துகள்' : 'Minimum 8 characters'}</p>
            </div>

            {/* Consent */}
            <label className="flex items-start gap-3 mb-6 cursor-pointer">
              <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)}
                className="mt-1 w-5 h-5 accent-blue-600 rounded" />
              <span className="text-sm text-gray-600">
                {language === 'ta'
                  ? 'நான் தனியுரிமை கொள்கையை படித்து ஒப்புக்கொள்கிறேன். என் தரவு பாதுகாப்பாக பயன்படுத்தப்படும்.'
                  : 'I have read and agree to the privacy policy. My data will be used only to support my medicine management.'}
                {' '}<Link to="/privacy" className="text-blue-600 underline">{language === 'ta' ? 'படிக்கவும்' : 'Read policy'}</Link>
              </span>
            </label>

            <button type="submit" disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold py-4 rounded-2xl text-xl shadow-md transition-colors focus-visible:ring-4 focus-visible:ring-green-300">
              {loading ? t('common.loading', language) : (language === 'ta' ? 'கணக்கு உருவாக்கு' : 'Create Account')}
            </button>
          </form>

          <p className="text-center mt-6 text-gray-600">
            {language === 'ta' ? 'ஏற்கனவே கணக்கு உள்ளதா?' : 'Already have an account?'}{' '}
            <Link to="/login" className="text-blue-600 font-semibold hover:underline">{t('auth.login', language)}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
