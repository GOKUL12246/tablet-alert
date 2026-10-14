import React, { useState } from 'react';
import { ArrowLeft, Mic, MicOff, Volume2, RefreshCw, Send, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSpeech } from '../../hooks/useSpeech';
import { chatbotAPI } from '../../lib/api';
import { t } from '../../lib/i18n';

export default function VoiceAssistant() {
  const { language, setLanguage } = useLanguage();
  const { speak, startListening, stopListening, isListening, transcript, resetTranscript, isSpeaking } = useSpeech(language);

  const [response, setResponse] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [textInput, setTextInput] = useState('');

  const processQuery = async (query: string) => {
    if (!query.trim()) return;
    setProcessing(true);
    try {
      const res = await chatbotAPI.sendMessage(query, language);
      const answer = res.data.response;
      setResponse(answer);
      // Automatically speak the answer back to the user
      speak(answer, language);
    } catch {
      const fallback = language === 'ta'
        ? 'மன்னிக்கவும். உங்கள் குரல் கட்டளையை செயல்படுத்த முடியவில்லை. மீண்டும் பேசவும்.'
        : 'Sorry, I could not process your voice command. Please speak again.';
      setResponse(fallback);
      speak(fallback, language);
    } finally {
      setProcessing(false);
    }
  };

  const handleMicToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      setResponse(null);
      // Pass callback to automatically process when user stops speaking!
      startListening(language, (spokenText) => {
        if (spokenText.trim()) {
          processQuery(spokenText);
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
      <div className="max-w-xl mx-auto space-y-6 text-center">
        {/* Navigation & Language Selector */}
        <div className="flex items-center justify-between">
          <Link to="/patient/dashboard" className="flex items-center gap-2 text-blue-600 font-bold hover:underline">
            <ArrowLeft className="h-5 w-5" />
            {t('common.back', language)}
          </Link>
          <div className="flex gap-2">
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${language === 'en' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700'}`}
            >
              English
            </button>
            <button
              onClick={() => setLanguage('ta')}
              className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${language === 'ta' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700'}`}
            >
              தமிழ்
            </button>
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center justify-center gap-2">
            <span>🎤</span>
            <span>{language === 'ta' ? 'குரல் உதவியாளர்' : 'Voice Assistant'}</span>
          </h1>
          <p className="text-gray-600 mt-2 text-base font-medium">
            {language === 'ta'
              ? 'மைக் பொத்தானை அழுத்தி பேசவும். உங்கள் குரல் கேட்டவுடன் தானாகவே பதிலளிக்கும்.'
              : 'Tap the microphone and speak. MediFriend will respond and speak aloud.'}
          </p>
        </div>

        {/* Large Accessible Microphone Button */}
        <div className="py-6">
          <button
            type="button"
            onClick={handleMicToggle}
            aria-label={isListening ? 'Stop listening' : 'Start speaking'}
            className={`w-40 h-40 rounded-full mx-auto flex flex-col items-center justify-center shadow-2xl transition-all duration-300 select-none ${
              isListening
                ? 'bg-red-500 text-white ring-8 ring-red-300 animate-pulse scale-105'
                : 'bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white hover:scale-105 active:scale-95'
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="h-16 w-16" />
                <span className="text-xs font-bold tracking-wider uppercase mt-1 animate-ping">
                  {language === 'ta' ? 'கேட்கிறது' : 'Listening'}
                </span>
              </>
            ) : (
              <>
                <Mic className="h-16 w-16" />
                <span className="text-xs font-bold tracking-wider uppercase mt-1">
                  {language === 'ta' ? 'பேச தட்டவும்' : 'Tap to speak'}
                </span>
              </>
            )}
          </button>
          
          <p className="text-sm font-extrabold text-gray-600 mt-4">
            {isListening
              ? (language === 'ta' ? '👂 உங்கள் குரலைக் கேட்கிறது... பேசி முடித்ததும் தானாக பதிலளிக்கும்' : '👂 Listening to your voice... stop speaking to get answer')
              : (language === 'ta' ? '👆 மைக் தட்டி பேசவும்' : '👆 Tap microphone to start')}
          </p>
        </div>

        {/* Live Spoken Transcript */}
        {transcript && (
          <div className="bg-white rounded-3xl p-5 border-2 border-blue-200 text-left shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-blue-600 uppercase tracking-wide">
                {language === 'ta' ? 'நீங்கள் கூறியது (You said):' : 'Voice recognized:'}
              </span>
              <button
                type="button"
                onClick={() => resetTranscript()}
                className="text-xs text-gray-400 hover:text-gray-600 underline font-semibold"
              >
                {language === 'ta' ? 'அழி' : 'Clear'}
              </button>
            </div>
            <p className="text-xl font-bold text-gray-900">{transcript}</p>
            
            {/* Quick action button to trigger answer immediately */}
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => processQuery(transcript)}
                disabled={processing}
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-2xl flex items-center justify-center gap-2 shadow"
              >
                <Send className="h-4 w-4" />
                {language === 'ta' ? 'இப்போதே பதில் பெறு' : 'Get Answer Now'}
              </button>
            </div>
          </div>
        )}

        {/* Processing Spinner */}
        {processing && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-center gap-3 text-blue-700 font-bold">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
            <span className="text-base">{language === 'ta' ? 'பதிலளிக்க தயாராகிறது...' : 'Processing answer & preparing speech...'}</span>
          </div>
        )}

        {/* MediFriend Spoken Response Box */}
        {response && (
          <div className="bg-purple-50 rounded-3xl p-6 border-2 border-purple-300 text-left shadow-lg space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-black text-purple-800 uppercase tracking-wider">
                <Sparkles className="h-4 w-4 text-purple-600" />
                MediFriend Voice Response
              </span>
              <button
                type="button"
                onClick={() => speak(response, language)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-200 hover:bg-purple-300 text-purple-900 rounded-xl font-bold text-xs transition-colors"
                aria-label="Replay speech"
              >
                <Volume2 className="h-4 w-4" />
                {isSpeaking ? (language === 'ta' ? 'பேசுகிறது...' : 'Speaking...') : (language === 'ta' ? 'மீண்டும் கேள்' : 'Replay Voice')}
              </button>
            </div>
            <p className="text-lg font-bold text-gray-900 leading-relaxed whitespace-pre-line">{response}</p>
          </div>
        )}

        {/* Quick Voice Prompt Chips with Time Setting */}
        <div className="space-y-2 pt-2">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            {language === 'ta' ? 'குரல் உதாரணங்கள் (தட்டிப் பார்க்கவும்):' : 'Sample Voice Queries (Tap to try):'}
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              { en: 'What time is it & my next dose?', ta: 'மணி என்ன, அடுத்த மருந்து எப்போது?' },
              { en: 'Set time for Telma at 9:00 AM', ta: 'காலை 9 மணிக்கு டெல்மா மாத்திரை நேரம் வை' },
              { en: 'Change time to 8:30 AM', ta: 'நேரத்தை 08:30 மணிக்கு மாற்று' },
              { en: 'What color is my tablet?', ta: 'என் மாத்திரை என்ன நிறம்?' },
              { en: 'Read my medicine instructions', ta: 'என் மருந்து வழிமுறைகள் என்ன?' },
            ].map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => processQuery(language === 'ta' ? chip.ta : chip.en)}
                className="px-4 py-2.5 bg-white hover:bg-blue-50 text-blue-800 text-xs sm:text-sm font-bold rounded-2xl border-2 border-blue-200 shadow-sm transition-all hover:scale-105 active:scale-95 text-left"
              >
                💬 {language === 'ta' ? chip.ta : chip.en}
              </button>
            ))}
          </div>
        </div>

        {/* Fallback Text Input */}
        <div className="pt-6 border-t border-gray-200">
          <p className="text-xs font-bold text-gray-400 mb-2">
            {language === 'ta' ? 'அல்லது தட்டச்சு செய்யவும்:' : 'Or type your question:'}
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  processQuery(textInput);
                  setTextInput('');
                }
              }}
              placeholder={language === 'ta' ? 'எ.கா. காலை 9 மணிக்கு மாத்திரை நேரம் வை' : 'e.g. Set time for Telma at 9:00 AM'}
              className="flex-1 px-4 py-3 rounded-2xl border-2 border-gray-300 outline-none text-base focus:border-blue-500"
            />
            <button
              type="button"
              onClick={() => { processQuery(textInput); setTextInput(''); }}
              disabled={!textInput.trim() || processing}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black rounded-2xl transition-colors"
            >
              ➔
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
