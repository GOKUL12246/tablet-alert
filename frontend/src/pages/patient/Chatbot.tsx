import { useEffect, useState, useRef } from 'react';
import { Send, Mic, MicOff, Volume2, RefreshCw, HelpCircle } from 'lucide-react';
import { chatbotAPI } from '../../lib/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSpeech } from '../../hooks/useSpeech';
import type { ChatMessage } from '../../types';

const SUGGESTIONS_EN = [
  "What is my next medicine & clock time?",
  "Set time for Telma at 9:00 AM",
  "Read my instructions",
  "I missed a dose. What should I do?",
  "What color is my tablet?",
];
const SUGGESTIONS_TA = [
  "அடுத்த மருந்து & நேரம் என்ன?",
  "காலை 9 மணிக்கு டெல்மா மாத்திரை நேரம் வை",
  "என் வழிமுறைகளைப் படித்துச் சொல்லுங்கள்",
  "நான் மருந்து தவறவிட்டேன். என்ன செய்வது?",
  "என் மாத்திரை என்ன நிறம்?",
];

export default function Chatbot() {
  const { language } = useLanguage();
  const { speak, startListening, stopListening, isListening, transcript, resetTranscript, isSpeaking, isSupported } = useSpeech(language);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: language === 'ta'
        ? 'வணக்கம்! நான் MediFriend. உங்கள் மருந்துகள் பற்றி கேளுங்கள். நான் உங்களுக்கு உதவுகிறேன்.'
        : 'Hello! I am MediFriend, your medicine assistant. Ask me about your registered medicines and reminders.',
      timestamp: new Date().toISOString(),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => Math.random().toString(36).slice(2));
  const [demoMode, setDemoMode] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { if (transcript) setInput(transcript); }, [transcript]);

  async function sendMsg(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: ChatMessage = { role: 'user', content: text.trim(), timestamp: new Date().toISOString() };
    setMessages(m => [...m, userMsg]);
    setInput(''); resetTranscript();
    setLoading(true);
    try {
      const res = await chatbotAPI.sendMessage(text.trim(), language, sessionId);
      const botMsg: ChatMessage = { role: 'assistant', content: res.data.response, timestamp: new Date().toISOString() };
      setMessages(m => [...m, botMsg]);
      setDemoMode(res.data.demo_mode ?? true);
      speak(res.data.response, language);
    } catch {
      const errMsg: ChatMessage = {
        role: 'assistant',
        content: language === 'ta' ? 'மன்னிக்கவும். இப்போது பதில் சொல்ல முடியவில்லை. உங்கள் மருந்தாளரை தொடர்புகொள்ளுங்கள்.' : 'Sorry, I could not process your request. Please contact your pharmacist for medicine questions.',
        timestamp: new Date().toISOString(),
      };
      setMessages(m => [...m, errMsg]);
    } finally { setLoading(false); }
  }

  function handleVoice() {
    if (isListening) {
      stopListening();
      if (transcript.trim()) sendMsg(transcript.trim());
    } else {
      startListening(language, (spokenText) => {
        if (spokenText.trim()) {
          sendMsg(spokenText.trim());
        }
      });
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-2xl mx-auto">
      {/* Header */}
      <header className="bg-white border-b px-4 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="bg-purple-600 rounded-full p-2"><HelpCircle className="h-6 w-6 text-white" /></div>
          <div>
            <h1 className="font-bold text-gray-900 text-lg">MediFriend</h1>
            <p className="text-xs text-gray-500">{language === 'ta' ? 'AI மருந்து உதவியாளர்' : 'AI Medicine Assistant'}</p>
          </div>
        </div>
        {demoMode && (
          <span className="text-xs bg-yellow-100 text-yellow-800 font-semibold px-3 py-1 rounded-full border border-yellow-300">
            Demo Mode
          </span>
        )}
      </header>

      {/* Disclaimer */}
      <div className="bg-blue-50 border-b border-blue-100 px-4 py-2 text-xs text-blue-700">
        {language === 'ta'
          ? '⚠️ MediFriend உங்கள் பதிவு செய்த மருந்துகளை மட்டுமே பயன்படுத்துகிறது. மருத்துவ ஆலோசனைக்கு மருத்துவரை சந்திக்கவும்.'
          : '⚠️ MediFriend uses only your registered medicines. For medical advice, consult your doctor or pharmacist.'}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} data-testid={`chat-message-${msg.role}`}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mr-2 mt-1">
                <HelpCircle className="h-4 w-4 text-purple-600" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-none'}`}>
              <p className="text-base leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-blue-200' : 'text-gray-400'}`}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            {msg.role === 'assistant' && (
              <button onClick={() => speak(msg.content, language)} disabled={isSpeaking}
                className="ml-2 mt-1 text-purple-400 hover:text-purple-600 transition-colors"
                aria-label="Read message aloud">
                <Volume2 className="h-5 w-5" />
              </button>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
              <div className="flex gap-1">
                {[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestion chips */}
      <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
        {(language === 'ta' ? SUGGESTIONS_TA : SUGGESTIONS_EN).map((s, i) => (
          <button key={i} onClick={() => sendMsg(s)}
            className="flex-shrink-0 bg-white border border-gray-200 text-gray-700 text-sm px-3 py-2 rounded-full hover:border-blue-400 hover:text-blue-700 transition-colors whitespace-nowrap">
            {s}
          </button>
        ))}
      </div>

      {/* Input area */}
      <div className="bg-white border-t px-4 py-3 flex gap-2 items-end">
        <textarea
          data-testid="chat-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(input); } }}
          placeholder={language === 'ta' ? 'கேள்வி கேளுங்கள்...' : 'Ask a question...'}
          rows={1}
          className="flex-1 resize-none border-2 border-gray-200 rounded-2xl px-4 py-3 text-base focus:border-blue-400 outline-none"
          aria-label={language === 'ta' ? 'செய்தி உள்ளிடவும்' : 'Type your message'}
        />
        {isSupported && (
          <button onClick={handleVoice}
            className={`p-3 rounded-2xl transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-purple-100 hover:text-purple-600'}`}
            aria-label={isListening ? 'Stop listening' : 'Start voice input'}>
            {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </button>
        )}
        <button onClick={() => sendMsg(input)} disabled={!input.trim() || loading}
          data-testid="chat-send-btn"
          className="p-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-2xl transition-colors"
          aria-label={language === 'ta' ? 'அனுப்பு' : 'Send'}>
          {loading ? <RefreshCw className="h-6 w-6 animate-spin" /> : <Send className="h-6 w-6" />}
        </button>
      </div>
    </div>
  );
}
