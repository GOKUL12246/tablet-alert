import React, { useState } from 'react';
import { ArrowLeft, Check, Eye, Volume2, Move, HelpCircle, SunMedium, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import { t } from '../../lib/i18n';
import toast from 'react-hot-toast';

export default function AccessibilitySettings() {
  const { language } = useLanguage();
  const { preferences, updatePreferences } = useAccessibility();

  const [mode, setMode] = useState(preferences.mode);
  const [highContrast, setHighContrast] = useState(preferences.high_contrast);
  const [largeText, setLargeText] = useState(preferences.font_size_multiplier > 1);
  const [reducedMotion, setReducedMotion] = useState(preferences.reduced_motion);
  const [ttsEnabled, setTtsEnabled] = useState(preferences.tts_enabled);

  const handleSave = async () => {
    try {
      await updatePreferences({
        mode,
        high_contrast: highContrast,
        font_size_multiplier: largeText ? 1.25 : 1.0,
        reduced_motion: reducedMotion,
        tts_enabled: ttsEnabled,
      });
      toast.success(language === 'ta' ? 'அணுகல் அமைப்புகள் சேமிக்கப்பட்டன!' : 'Accessibility settings saved!');
    } catch {
      toast.error(t('common.error', language));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-2">
          <Link to="/patient/dashboard" className="flex items-center gap-2 text-blue-600 font-bold hover:underline">
            <ArrowLeft className="h-5 w-5" />
            {t('common.back', language)}
          </Link>
        </div>

        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">
            {language === 'ta' ? '♿ அணுகல்தன்மை அமைப்புகள்' : '♿ Accessibility & Assistive Modes'}
          </h1>
          <p className="text-gray-500 mt-1">
            {language === 'ta'
              ? 'பார்வை, கேட்டல், இயக்கம் அல்லது நினைவக தேவைகளுக்கு ஏற்ப செயலியை மாற்றியமைக்கவும்.'
              : 'Customize the display, speech, and contrast for visual, hearing, motor, or cognitive needs.'}
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200 space-y-6">
          {/* Assistive Modes */}
          <div className="space-y-3">
            <h3 className="font-extrabold text-gray-800 text-lg">
              {language === 'ta' ? 'முதன்மை பயன்முறை' : 'Preset Accessibility Mode'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { id: 'standard', titleEn: 'Standard Mode', titleTa: 'வழக்கமான முறை', desc: 'Default layout' },
                { id: 'easy', titleEn: 'Easy / Non-Literate Mode', titleTa: 'எளிய முறை (படங்கள்)', desc: 'Large pictograms, minimal reading' },
                { id: 'high_contrast', titleEn: 'High Contrast Mode', titleTa: 'அதிக மாறுபட்ட முறை', desc: 'Maximum contrast for low vision' },
                { id: 'large_text', titleEn: 'Large Text Mode', titleTa: 'பெரிய எழுத்துக்கள்', desc: '25% larger text across the app' },
                { id: 'reduced_motion', titleEn: 'Reduced Motion', titleTa: 'குறைந்த இயக்கம்', desc: 'Minimizes animations' },
                { id: 'voice', titleEn: 'Voice Guided Mode', titleTa: 'குரல் வழி முறை', desc: 'Auto-reads instructions out loud' },
              ].map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setMode(m.id as any);
                    if (m.id === 'high_contrast') setHighContrast(true);
                    if (m.id === 'large_text') setLargeText(true);
                    if (m.id === 'reduced_motion') setReducedMotion(true);
                    if (m.id === 'voice') setTtsEnabled(true);
                  }}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    mode === m.id ? 'border-blue-600 bg-blue-50/50 scale-[1.02]' : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <p className="font-bold text-gray-900">{language === 'ta' ? m.titleTa : m.titleEn}</p>
                  <p className="text-xs text-gray-500 mt-1">{m.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Granular Toggles */}
          <div className="space-y-4 pt-6 border-t border-gray-100">
            <h3 className="font-extrabold text-gray-800 text-lg">
              {language === 'ta' ? 'கூடுதல் விருப்பங்கள்' : 'Granular Options'}
            </h3>

            <label className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl cursor-pointer">
              <span className="font-bold text-gray-800">
                {language === 'ta' ? 'அதிக மாறுபட்ட நிறங்கள் (High Contrast)' : 'High Contrast Theme'}
              </span>
              <input
                type="checkbox"
                checked={highContrast}
                onChange={e => setHighContrast(e.target.checked)}
                className="w-6 h-6 text-blue-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl cursor-pointer">
              <span className="font-bold text-gray-800">
                {language === 'ta' ? 'பெரிய எழுத்துரு (Large Text)' : 'Extra Large Fonts'}
              </span>
              <input
                type="checkbox"
                checked={largeText}
                onChange={e => setLargeText(e.target.checked)}
                className="w-6 h-6 text-blue-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl cursor-pointer">
              <span className="font-bold text-gray-800">
                {language === 'ta' ? 'குரல் வாசிப்பு தானாக இயங்குதல் (Auto-TTS)' : 'Auto-play Voice Instructions'}
              </span>
              <input
                type="checkbox"
                checked={ttsEnabled}
                onChange={e => setTtsEnabled(e.target.checked)}
                className="w-6 h-6 text-blue-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl cursor-pointer">
              <span className="font-bold text-gray-800">
                {language === 'ta' ? 'அசைவூட்டங்களை குறைக்கவும் (Reduced Motion)' : 'Reduced Motion'}
              </span>
              <input
                type="checkbox"
                checked={reducedMotion}
                onChange={e => setReducedMotion(e.target.checked)}
                className="w-6 h-6 text-blue-600 rounded"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-lg rounded-2xl shadow-lg transition-transform hover:scale-[1.01]"
          >
            {language === 'ta' ? 'அமைப்புகளை சேமிக்கவும்' : 'Save Accessibility Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
}
