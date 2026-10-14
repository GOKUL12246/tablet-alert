import React from 'react';
import { ArrowLeft, HelpCircle, Phone, Smartphone, Mic, HeartHandshake } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { t } from '../../lib/i18n';

export default function HelpSupport() {
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
          <h1 className="text-3xl font-extrabold text-gray-900">
            {language === 'ta' ? 'உதவி மற்றும் வழிகாட்டல்' : 'Help & Support Center'}
          </h1>
          <p className="text-gray-500 mt-1">
            {language === 'ta' ? 'செயலியை எளிதாக பயன்படுத்துவதற்கான குறிப்புகள்' : 'Guides for elderly users, family escalation, and keypad phone SMS'}
          </p>
        </div>

        {/* Keypad Phone Guide */}
        <div className="bg-blue-900 text-white rounded-3xl p-6 sm:p-8 space-y-4 shadow-lg">
          <div className="flex items-center gap-3">
            <Smartphone className="h-8 w-8 text-blue-300" />
            <h2 className="text-xl font-bold">
              {language === 'ta' ? '📱 கீபேட் போன் SMS பயன்பாட்டு வழிகாட்டி' : '📱 Basic Keypad Phone SMS Guide'}
            </h2>
          </div>
          <p className="text-blue-100 text-sm leading-relaxed">
            {language === 'ta'
              ? 'ஸ்மார்ட்போன் மற்றும் இணையம் இல்லாவிட்டாலும், உங்கள் சாதாரண போனில் SMS நினைவூட்டல் வரும்.'
              : 'Elderly family members with basic keypad phones receive automated SMS reminders at scheduled times:'}
          </p>
          <div className="bg-blue-950 p-4 rounded-2xl font-mono text-xs text-green-300 space-y-2">
            <p>1️⃣ <b>Reply 1</b> ➔ {language === 'ta' ? 'மருந்து எடுத்துக்கொண்டேன் என உறுதி செய்யப்படும்' : 'Confirms medicine taken'}</p>
            <p>2️⃣ <b>Reply 2</b> ➔ {language === 'ta' ? 'உடனடியாக குடும்பத்தினருக்கு உதவி எச்சரிக்கை அனுப்பப்படும்' : 'Triggers immediate emergency help request to caregiver'}</p>
          </div>
        </div>

        {/* Voice Assistant Guide */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <Mic className="h-6 w-6 text-purple-600" />
            <h3 className="font-bold text-gray-900 text-lg">
              {language === 'ta' ? '🎤 குரல் கட்டளைகள்' : '🎤 Voice Commands in Tamil & English'}
            </h3>
          </div>
          <ul className="text-sm text-gray-600 space-y-2 pl-4 list-disc">
            <li>"என்னுடைய அடுத்த மருந்து எப்போது?" (When is my next reminder?)</li>
            <li>"என் வழிமுறைகளைப் படித்துச் சொல்லுங்கள்" (Read my prescription instructions)</li>
            <li>"எனக்கு உதவி வேண்டும்" (I need help - alerts caregiver)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
