import React, { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Pill, Eye, EyeOff, AlertCircle, User, ShieldCheck, Stethoscope, UserCog, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../lib/i18n';

export default function Login() {
  const { login } = useAuth();
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const performLogin = async (targetEmail: string, targetPass: string) => {
    setError('');
    setLoading(true);
    try {
      const user = await login(targetEmail, targetPass);
      if (user.role === 'patient') navigate('/patient/dashboard');
      else if (user.role === 'caregiver') navigate('/caregiver/dashboard');
      else if (user.role === 'healthcare_professional') navigate('/healthcare-professional/dashboard');
      else if (user.role === 'admin') navigate('/admin/dashboard');
      else navigate('/');
    } catch (err: any) {
      setError(err?.response?.data?.detail || (language === 'ta' ? 'உள்நுழைவு தோல்வியடைந்தது. விவரங்களை சரிபார்க்கவும்.' : 'Login failed. Please check credentials.'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError(language === 'ta' ? 'மின்னஞ்சல் மற்றும் கடவுச்சொல் தேவை' : 'Email and password are required');
      return;
    }
    performLogin(email, password);
  };

  const handleQuickLogin = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
    performLogin(roleEmail, rolePass);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Top Navbar Header */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between mb-6">
        <Link to="/" className="flex items-center gap-2.5 text-blue-900 group">
          <div className="bg-blue-600 rounded-2xl p-2.5 shadow-md shadow-blue-200 group-hover:bg-blue-700 transition">
            <Pill className="h-6 w-6 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight block">MEDISAKHI AI</span>
            <span className="text-xs text-blue-600 font-semibold tracking-wider uppercase block">
              {language === 'ta' ? 'மருந்து உதவி தளம்' : 'Smart Medicine Platform'}
            </span>
          </div>
        </Link>

        {/* Language Selector */}
        <div className="flex bg-white p-1 rounded-2xl border border-gray-200 shadow-sm" role="group">
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              language === 'en' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => setLanguage('ta')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              language === 'ta' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            தமிழ்
          </button>
        </div>
      </div>

      <div className="max-w-md w-full mx-auto">
        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 p-8 sm:p-10">
          <div className="mb-6">
            <h2 className="text-2xl font-black text-slate-900">
              {language === 'ta' ? 'கணக்கில் உள்நுழையவும்' : 'Sign in to your account'}
            </h2>
            <p className="text-sm text-slate-500 mt-1 font-medium">
              {language === 'ta'
                ? 'உங்கள் மருந்து நினைவூட்டல்கள் மற்றும் பாதுகாப்பைக் கண்காணிக்கவும்'
                : 'Monitor verified prescription schedules & family safety alerts'}
            </p>
          </div>

          {/* Quick 1-Click Role Login Panel */}
          <div className="mb-6 bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <p className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2.5 flex items-center justify-between">
              <span>{language === 'ta' ? '⚡ 1-கிளிக் சோதனை உள்நுழைவு' : '⚡ 1-CLICK INSTANT LOGIN'}</span>
              <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">Showcase Ready</span>
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('arjun.kumar@example.com', 'password123')}
                disabled={loading}
                className="p-2.5 bg-white hover:bg-blue-50 hover:border-blue-300 border border-slate-200 rounded-xl text-left transition flex items-center gap-2.5 group shadow-xs"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs flex-shrink-0 group-hover:scale-105 transition">
                  <User className="w-4 h-4" />
                </div>
                <div className="overflow-hidden">
                  <span className="block text-xs font-bold text-slate-900 truncate">
                    {language === 'ta' ? 'நோயாளி' : 'Patient'}
                  </span>
                  <span className="block text-[11px] text-slate-500 truncate">Arjun Kumar</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('ananya.kumar@example.com', 'password123')}
                disabled={loading}
                className="p-2.5 bg-white hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 rounded-xl text-left transition flex items-center gap-2.5 group shadow-xs"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs flex-shrink-0 group-hover:scale-105 transition">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="overflow-hidden">
                  <span className="block text-xs font-bold text-slate-900 truncate">
                    {language === 'ta' ? 'பாதுகாவலர்' : 'Caregiver'}
                  </span>
                  <span className="block text-[11px] text-slate-500 truncate">Ananya Kumar</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('dr.ramesh@medisakhi.ai', 'password123')}
                disabled={loading}
                className="p-2.5 bg-white hover:bg-indigo-50 hover:border-indigo-300 border border-slate-200 rounded-xl text-left transition flex items-center gap-2.5 group shadow-xs"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs flex-shrink-0 group-hover:scale-105 transition">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <div className="overflow-hidden">
                  <span className="block text-xs font-bold text-slate-900 truncate">
                    {language === 'ta' ? 'மருத்துவர்' : 'Doctor'}
                  </span>
                  <span className="block text-[11px] text-slate-500 truncate">Dr. Ramesh</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin@medisakhi.ai', 'password123')}
                disabled={loading}
                className="p-2.5 bg-white hover:bg-purple-50 hover:border-purple-300 border border-slate-200 rounded-xl text-left transition flex items-center gap-2.5 group shadow-xs"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs flex-shrink-0 group-hover:scale-105 transition">
                  <UserCog className="w-4 h-4" />
                </div>
                <div className="overflow-hidden">
                  <span className="block text-xs font-bold text-slate-900 truncate">
                    {language === 'ta' ? 'நிர்வாகி' : 'Admin'}
                  </span>
                  <span className="block text-[11px] text-slate-500 truncate">System</span>
                </div>
              </button>
            </div>
          </div>

          {error && (
            <div role="alert" className="flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-2xl p-4 mb-6 animate-fadeIn">
              <AlertCircle className="h-5 w-5 text-rose-500 mt-0.5 flex-shrink-0" />
              <p className="text-rose-700 text-sm font-semibold">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
                {t('auth.email', language)}
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-base placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-medium"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-xs font-black uppercase tracking-wider text-slate-600">
                  {t('auth.password', language)}
                </label>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-base placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-medium pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-black py-4 rounded-2xl text-base shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 group active:scale-[0.99]"
            >
              <span>{loading ? (language === 'ta' ? 'உள்நுழைகிறது...' : 'Signing in...') : t('auth.login', language)}</span>
              {!loading && <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition" />}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500 font-medium">
              {language === 'ta' ? 'புதிய கணக்கு தொடங்க வேண்டுமா?' : "Don't have an account?"}{' '}
              <Link to="/register" className="text-blue-600 font-black hover:underline ml-1">
                {t('auth.register', language)}
              </Link>
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-xs text-slate-400 font-medium">
          MEDISAKHI AI &bull; {language === 'ta' ? 'உங்கள் மருந்து. உங்கள் மொழி. உங்கள் பாதுகாப்பு.' : 'Your Medicine. Your Language. Your Safety.'}
        </div>
      </div>
    </div>
  );
}
