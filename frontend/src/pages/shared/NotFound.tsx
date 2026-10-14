import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { t } from '../../lib/i18n';

export default function NotFound() {
  const { language } = useLanguage();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-sm border border-gray-200 space-y-4">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-black text-gray-900">404</h1>
        <p className="text-gray-500 font-semibold">
          {language === 'ta' ? 'பக்கம் கிடைக்கவில்லை' : 'Page Not Found'}
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('common.back', language)}
        </Link>
      </div>
    </div>
  );
}
