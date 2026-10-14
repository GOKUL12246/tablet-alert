import React from 'react';
import { ArrowLeft, Shield, Lock, Eye, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { t } from '../../lib/i18n';

export default function PrivacyConsent() {
  const { language } = useLanguage();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2 text-blue-600 font-bold hover:underline">
            <ArrowLeft className="h-5 w-5" />
            {t('common.back', language)}
          </Link>
        </div>

        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold mb-2">
            <Shield className="h-3.5 w-3.5" />
            Healthcare Privacy & Data Protection
          </span>
          <h1 className="text-3xl font-extrabold text-gray-900">
            {language === 'ta' ? 'தனியுரிமை & நோயாளி ஒப்புதல் கொள்கை' : 'Privacy Policy & Patient Consent'}
          </h1>
          <p className="text-gray-500 mt-1">
            {language === 'ta' ? 'உங்கள் மருத்துவத் தரவுகள் எவ்வாறு பாதுகாக்கப்படுகின்றன' : 'How your health and medication data is protected and strictly governed'}
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200 space-y-6 text-sm text-gray-700 leading-relaxed">
          <div className="space-y-2">
            <h3 className="font-bold text-gray-900 text-base">
              {language === 'ta' ? '1. நோயாளி ஒப்புதல் மற்றும் தரவு பாதுகாப்பு' : '1. Explicit Patient Consent'}
            </h3>
            <p>
              {language === 'ta'
                ? 'நோயாளியின் வெளிப்படையான அனுமதி இல்லாமல் குடும்பத்தினருக்கோ அல்லது கவனிப்பாளருக்கோ எந்த மருத்துவ விவரங்களும் பகிரப்படாது.'
                : 'Caregivers and family members never receive access to your medication schedule without explicit patient approval.'}
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-gray-900 text-base">
              {language === 'ta' ? '2. பாதுகாப்பான சர்வர் சேமிப்பு' : '2. Secure Storage & Privacy'}
            </h3>
            <p>
              {language === 'ta'
                ? 'மருந்துச்சீட்டுகள் பொதுவான இணைய முகவரிகளில் சேமிக்கப்படுவதில்லை. அங்கீகரிக்கப்பட்ட JWT பாதுகாப்பு மூலம் மட்டுமே பெற முடியும்.'
                : 'Prescription documents and medical details are stored in protected directories accessible solely through authenticated sessions.'}
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-gray-900 text-base">
              {language === 'ta' ? '3. மருத்துவப் பொறுப்புத் துறப்பு' : '3. Clinical Medical Disclaimer'}
            </h3>
            <p>
              {language === 'ta'
                ? 'MEDISAKHI AI ஒரு மருந்து நினைவூட்டல் மற்றும் உதவித் தளம் மட்டுமே. இது மருத்துவரின் அல்லது மருந்தாளரின் ஆலோசனையை மாற்றாது.'
                : 'MEDISAKHI AI is a medicine assistance and adherence-support platform. It does not independently prescribe, modify doses, or replace healthcare professionals.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
