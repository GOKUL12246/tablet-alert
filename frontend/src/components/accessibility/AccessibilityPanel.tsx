import React from 'react';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { AccessibilityMode } from '../../types';
import { Eye, Volume2, Move, Brain, Mic, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export const AccessibilityPanel: React.FC = () => {
  const { preferences, updatePreferences, setMode } = useAccessibility();
  const { language } = useLanguage();

  const modes: {
    id: AccessibilityMode;
    titleEn: string;
    titleTa: string;
    descEn: string;
    descTa: string;
  }[] = [
    {
      id: 'standard',
      titleEn: 'Standard Mode',
      titleTa: 'வழக்கமான முறை',
      descEn: 'Default layout with balanced text and clean visuals',
      descTa: 'சமநிலையான எழுத்துக்கள் கொண்ட இயல்பான வடிவமைப்பு',
    },
    {
      id: 'easy',
      titleEn: 'Easy / Senior Citizen Mode',
      titleTa: 'எளிய / முதியோர் முறை',
      descEn: 'Bigger touch buttons, larger text, simplified navigation',
      descTa: 'மிகப் பெரிய பொத்தான்கள், எளிய வழிநடத்தல்',
    },
    {
      id: 'voice',
      titleEn: 'Voice-First Mode',
      titleTa: 'குரல் வழி முறை',
      descEn: 'Automatic spoken reminders, audible prompts for all screens',
      descTa: 'தானியங்கி குரல் நினைவூட்டல் மற்றும் ஒலி வழிகாட்டல்',
    },
    {
      id: 'high_contrast',
      titleEn: 'High Contrast Mode',
      titleTa: 'அதிக மாறுபட்ட வண்ணம்',
      descEn: 'Maximum color contrast for visual clarity',
      descTa: 'பார்வை தெளிவுக்கான அதிக மாறுபட்ட வண்ணம்',
    },
    {
      id: 'large_text',
      titleEn: 'Large Text Mode',
      titleTa: 'பெரிய எழுத்துரு முறை',
      descEn: 'Significantly enlarged fonts across the entire app',
      descTa: 'அனைத்து பக்கங்களிலும் மிக பெரிய எழுத்துக்கள்',
    },
    {
      id: 'reduced_motion',
      titleEn: 'Reduced Motion',
      titleTa: 'குறைந்த அசைவு முறை',
      descEn: 'Eliminate animations and transitions for vestibulary comfort',
      descTa: 'தலைச்சுற்றலைத் தவிர்க்க அசைவுகளை நீக்குதல்',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Mode Presets */}
      <div>
        <h4 className="text-lg font-bold text-gray-900 mb-3">
          {language === 'ta' ? 'அணுகல்தன்மை முன்கூட்டிய முறைகள்' : 'Preset Accessibility Profiles'}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {modes.map((m) => {
            const isSelected = preferences.mode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                className={cn(
                  'text-left p-4 rounded-xl border-2 transition-all flex items-start justify-between',
                  isSelected
                    ? 'border-primary-600 bg-primary-50 ring-2 ring-primary-300'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                )}
              >
                <div>
                  <div className="font-bold text-gray-900">
                    {language === 'ta' ? m.titleTa : m.titleEn}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {language === 'ta' ? m.descTa : m.descEn}
                  </div>
                </div>
                {isSelected && <Check className="w-5 h-5 text-primary-600 flex-shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Disability-Specific Accommodations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Visual Impairment */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Eye className="w-5 h-5 text-indigo-600" />
              <span>{language === 'ta' ? 'பார்வை குறைபாடு உதவி' : 'Visual Impairments'}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-2 text-sm">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="font-medium text-gray-800">
                {language === 'ta' ? 'அதிக மாறுபட்ட வண்ணம் (High Contrast)' : 'High Contrast Theme'}
              </span>
              <input
                type="checkbox"
                checked={preferences.high_contrast}
                onChange={(e) => updatePreferences({ high_contrast: e.target.checked })}
                className="w-5 h-5 rounded text-primary-600 focus:ring-primary-500"
              />
            </label>

            <div>
              <div className="flex justify-between font-medium text-gray-800 mb-1">
                <span>{language === 'ta' ? 'எழுத்து அளவு' : 'Font Size Multiplier'}</span>
                <span className="font-bold">{Math.round(preferences.font_size_multiplier * 100)}%</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="1.5"
                step="0.1"
                value={preferences.font_size_multiplier}
                onChange={(e) =>
                  updatePreferences({ font_size_multiplier: parseFloat(e.target.value) })
                }
                className="w-full accent-primary-600 cursor-pointer"
              />
            </div>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="font-medium text-gray-800">
                {language === 'ta' ? 'திரை வாசிப்பான் உகந்ததாக்குதல்' : 'Screen Reader Optimizations'}
              </span>
              <input
                type="checkbox"
                checked={preferences.screen_reader_mode}
                onChange={(e) => updatePreferences({ screen_reader_mode: e.target.checked })}
                className="w-5 h-5 rounded text-primary-600 focus:ring-primary-500"
              />
            </label>
          </CardContent>
        </Card>

        {/* Audio / Speech Assistant */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Volume2 className="w-5 h-5 text-emerald-600" />
              <span>{language === 'ta' ? 'குரல் & ஒலி வழிகாட்டல்' : 'Audio & Speech Assist'}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-2 text-sm">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="font-medium text-gray-800">
                {language === 'ta' ? 'தானியங்கி குரல் வாசிப்பு (TTS)' : 'Automatic Voice Readout'}
              </span>
              <input
                type="checkbox"
                checked={preferences.tts_enabled}
                onChange={(e) => updatePreferences({ tts_enabled: e.target.checked })}
                className="w-5 h-5 rounded text-primary-600 focus:ring-primary-500"
              />
            </label>

            <div>
              <div className="flex justify-between font-medium text-gray-800 mb-1">
                <span>{language === 'ta' ? 'குரல் வேகம்' : 'Speech Speed Rate'}</span>
                <span className="font-bold">{preferences.tts_rate}x</span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.3"
                step="0.1"
                value={preferences.tts_rate}
                onChange={(e) => updatePreferences({ tts_rate: parseFloat(e.target.value) })}
                className="w-full accent-primary-600 cursor-pointer"
              />
            </div>
          </CardContent>
        </Card>

        {/* Motor / Mobility */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Move className="w-5 h-5 text-amber-600" />
              <span>{language === 'ta' ? 'அசைவு மற்றும் தொடு பொத்தான்கள்' : 'Mobility & Touch'}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-2 text-sm">
            <p className="text-gray-600">
              {language === 'ta'
                ? 'அனைத்து முக்கிய பொத்தான்களும் குறைந்தது 80px உயரத்தில் வடிவமைக்கப்பட்டுள்ளன. நடுக்கம் உள்ள பயனர்களுக்கு தொடுதல் மிக எளிது.'
                : 'Primary action targets are sized to min 80px height for tremors or limited hand mobility. Drag-and-drop is fully optional.'}
            </p>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="font-medium text-gray-800">
                {language === 'ta' ? 'அசைவுகளைக் குறைத்தல் (Reduced Motion)' : 'Reduced Motion'}
              </span>
              <input
                type="checkbox"
                checked={preferences.reduced_motion}
                onChange={(e) => updatePreferences({ reduced_motion: e.target.checked })}
                className="w-5 h-5 rounded text-primary-600 focus:ring-primary-500"
              />
            </label>
          </CardContent>
        </Card>

        {/* Cognitive & Senior Assist */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Brain className="w-5 h-5 text-purple-600" />
              <span>{language === 'ta' ? 'அறிவாற்றல் & முதியோர் உதவி' : 'Cognitive & Non-Literate Assist'}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-2 text-sm text-gray-600">
            <p>
              {language === 'ta'
                ? 'காலை 🌅, மதியம் ☀️, மாலை 🌆, இரவு 🌙 படக்குறியீடுகள் மற்றும் மாத்திரை நிறங்கள் (வெள்ளை, மஞ்சள், இளஞ்சிவப்பு) எப்போதும் காட்டப்படும்.'
                : 'Universal sun/moon time pictograms, meal symbols, and physical pill color/shape icons are displayed on all cards to guide non-literate patients.'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AccessibilityPanel;
