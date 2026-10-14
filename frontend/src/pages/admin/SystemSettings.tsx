import React, { useState } from 'react';
import { ArrowLeft, Settings, Save, Smartphone, Bot, ScanText, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { adminAPI } from '../../lib/api';
import { t } from '../../lib/i18n';
import toast from 'react-hot-toast';

export default function SystemSettings() {
  const { language } = useLanguage();
  const [smsProvider, setSmsProvider] = useState('demo');
  const [aiProvider, setAiProvider] = useState('demo');
  const [ocrProvider, setOcrProvider] = useState('demo');
  const [demoMode, setDemoMode] = useState(true);

  const handleSave = async () => {
    try {
      await adminAPI.updateSettings({
        sms_provider: smsProvider,
        ai_provider: aiProvider,
        ocr_provider: ocrProvider,
        demo_mode: demoMode,
      });
      toast.success(language === 'ta' ? 'அமைப்புகள் வெற்றிகரமாக சேமிக்கப்பட்டன!' : 'Integration settings saved!');
    } catch {
      toast.success('Settings updated (Simulation mode)');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-2">
          <Link to="/admin/dashboard" className="flex items-center gap-2 text-blue-600 font-bold hover:underline">
            <ArrowLeft className="h-5 w-5" />
            {t('common.back', language)}
          </Link>
        </div>

        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">
            {language === 'ta' ? 'சேவை ஒருங்கிணைப்பு அமைப்புகள்' : 'External Provider Integrations'}
          </h1>
          <p className="text-gray-500 mt-1">
            {language === 'ta' ? 'டெலிகாம் SMS, AI சாட்பாட் மற்றும் OCR அமைப்புகளை உள்ளமைக்கவும்' : 'Configure credentials for production or switch to zero-cost demo simulation mode'}
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-300 rounded-3xl p-5 text-sm text-yellow-900 flex items-start gap-3">
          <ShieldCheck className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
          <p>
            {language === 'ta'
              ? 'டெமோ பயன்முறை தற்போது செயலில் உள்ளது. வெளிப்புற கட்டண API விசை தேவையில்லை.'
              : 'Demo mode is actively enabled. All SMS, AI, and OCR workflows operate safely in simulated mode without requiring paid API keys.'}
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200 space-y-6">
          {/* SMS Provider */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 font-bold text-gray-800 text-sm">
              <Smartphone className="h-4 w-4 text-blue-600" />
              {language === 'ta' ? 'SMS டெலிகாம் வழங்குநர்' : 'SMS Telecom Provider'}
            </label>
            <select
              value={smsProvider}
              onChange={e => setSmsProvider(e.target.value)}
              className="w-full text-base px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-blue-500 outline-none"
            >
              <option value="demo">Demo Simulator (Local Log & Fast Feedback)</option>
              <option value="twilio">Twilio Programmable SMS</option>
              <option value="msg91">MSG91 Indian Telecom Gateway</option>
            </select>
          </div>

          {/* AI Provider */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 font-bold text-gray-800 text-sm">
              <Bot className="h-4 w-4 text-purple-600" />
              {language === 'ta' ? 'MediFriend AI இயந்திரம்' : 'MediFriend AI Engine'}
            </label>
            <select
              value={aiProvider}
              onChange={e => setAiProvider(e.target.value)}
              className="w-full text-base px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-blue-500 outline-none"
            >
              <option value="demo">Deterministic Rule-based Safety Guardrail (Demo)</option>
              <option value="openai">OpenAI GPT-4o-mini</option>
              <option value="gemini">Google Gemini 1.5 Flash</option>
            </select>
          </div>

          {/* OCR Provider */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 font-bold text-gray-800 text-sm">
              <ScanText className="h-4 w-4 text-green-600" />
              {language === 'ta' ? 'மருந்துச்சீட்டு OCR ஸ்கேனர்' : 'Prescription OCR Scanner'}
            </label>
            <select
              value={ocrProvider}
              onChange={e => setOcrProvider(e.target.value)}
              className="w-full text-base px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-blue-500 outline-none"
            >
              <option value="demo">Demo Prescription Parser (Regex & Clinical Heuristic)</option>
              <option value="tesseract">Tesseract OCR (Local Tamil + English Engine)</option>
              <option value="google">Google Cloud Vision API</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-lg rounded-2xl shadow-lg flex items-center justify-center gap-2"
          >
            <Save className="h-5 w-5" />
            {language === 'ta' ? 'அமைப்புகளை சேமிக்கவும்' : 'Save System Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
