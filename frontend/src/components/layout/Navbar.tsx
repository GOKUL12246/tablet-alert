import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../contexts/LanguageContext';
import { LanguageSelector } from '../accessibility/LanguageSelector';
import { Pill, PhoneCall, HelpCircle, LogOut, User as UserIcon, ShieldAlert } from 'lucide-react';

export interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const { language, t } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getEmergencyContact = () => {
    return user?.emergency_contact || '+91 98401 99999';
  };

  return (
    <>
      {/* WCAG Skip to Main Content Link */}
      <a href="#main-content" className="skip-link">
        Skip to main content / முதன்மை பகுதிக்கு செல்லவும்
      </a>

      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Left: Brand Logo & Title */}
            <div className="flex items-center gap-3">
              {onToggleSidebar && (
                <button
                  type="button"
                  onClick={onToggleSidebar}
                  aria-label="Toggle navigation menu"
                  className="p-2.5 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 lg:hidden focus:ring-2 focus:ring-primary-500"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              )}

              <Link to="/" className="flex items-center gap-3 group">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary-600 to-accent flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
                  <Pill className="w-7 h-7 transform -rotate-45" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl sm:text-2xl font-black tracking-tight text-gray-900">
                      MEDISAKHI <span className="text-primary-600">AI</span>
                    </span>
                    <span className="text-xs bg-primary-100 text-primary-800 font-bold px-2 py-0.5 rounded-full border border-primary-200">
                      தமிழ் • EN
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 hidden sm:block">
                    {language === 'ta'
                      ? 'உங்கள் மருந்து • உங்கள் மொழி • உங்கள் பாதுகாப்பு'
                      : 'Your Medicine. Your Language. Your Safety.'}
                  </p>
                </div>
              </Link>
            </div>

            {/* Right: Quick Assistance, Language Switcher, Profile */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Emergency Call Button for Patients */}
              {isAuthenticated && user?.role === 'patient' && (
                <a
                  href={`tel:${getEmergencyContact()}`}
                  aria-label="Call emergency caregiver"
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-md text-sm active:scale-95 transition-all focus:ring-4 focus:ring-amber-300"
                >
                  <PhoneCall className="w-4 h-4 sm:w-5 sm:h-5 animate-bounce" />
                  <span className="hidden md:inline">
                    {language === 'ta' ? 'பராமரிப்பாளர் அழைப்பு' : 'Call Caregiver'}
                  </span>
                </a>
              )}

              {/* Language Selector */}
              <LanguageSelector variant="inline" />

              {/* Help Link */}
              <Link
                to="/help"
                aria-label="Help and Support"
                className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors focus:ring-2 focus:ring-primary-400"
              >
                <HelpCircle className="w-6 h-6" />
              </Link>

              {/* User menu or Sign In */}
              {isAuthenticated && user ? (
                <div className="flex items-center gap-2 border-l pl-3 border-gray-200">
                  <div className="hidden lg:flex flex-col text-right">
                    <span className="text-sm font-bold text-gray-800 leading-tight">
                      {user.full_name}
                    </span>
                    <span className="text-xs text-gray-500 capitalize">
                      {user.role.replace('_', ' ')}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    title="Sign Out"
                    aria-label="Sign out"
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors focus:ring-2 focus:ring-red-400"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl text-sm shadow-sm transition-colors"
                >
                  {t('auth.login')}
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Navbar;
