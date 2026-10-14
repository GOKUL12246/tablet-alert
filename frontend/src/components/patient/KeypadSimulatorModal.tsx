import React, { useState } from 'react';
import { X, Send, Smartphone, Check, AlertCircle, PhoneCall, RefreshCw } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { webhooksAPI, remindersAPI } from '../../lib/api';
import { stopSpeaking } from '../../lib/speechUtils';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  patientPhone?: string;
}

export default function KeypadSimulatorModal({ isOpen, onClose, patientPhone = '+919876500001' }: Props) {
  const { language } = useLanguage();

  const handleClose = () => {
    stopSpeaking();
    onClose();
  };
  const [screenText, setScreenText] = useState(
    'MEDISAKHI ALARM:\nTime to take Telmisartan (Telma) 40mg.\nColor: Pink, Shape: Oval.\nPress ANY button (1, 5, 9, OK) when eaten.\nPress 2 for help.'
  );
  const [lastPressed, setLastPressed] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleKeyPress = async (key: string) => {
    setLastPressed(key);
    setLoading(true);
    setStatusMsg(null);

    try {
      const res = await webhooksAPI.simulateKeypadSms(patientPhone, key);
      const action = res.data.action;

      if (action === 'confirmed') {
        setScreenText(
          `✅ SMS SENT: Key '${key}'\nMEDISAKHI: Thank you! Dose recorded as taken.\nNo alert sent to caretaker.`
        );
        setStatusMsg(
          language === 'ta'
            ? `✅ நீங்கள் '${key}' பொத்தானை அழுத்தியதால் மாத்திரை உட்கொண்டது உறுதி செய்யப்பட்டது!`
            : `✅ You pressed '${key}'. Dose confirmed as taken on your keypad phone!`
        );
        toast.success(
          language === 'ta'
            ? `விசைப்பலகை போன் உறுதி: மாத்திரை எடுக்கப்பட்டது!`
            : `Keypad phone: Dose confirmed as taken!`
        );
      } else if (action === 'help_requested') {
        setScreenText(
          `🚨 SMS SENT: Key '2' (Help)\nMEDISAKHI: Assistance request sent to your caretaker!`
        );
        setStatusMsg(
          language === 'ta'
            ? '🚨 உதவி கோரிக்கை பாதுகாவலருக்கு அனுப்பப்பட்டது!'
            : '🚨 Assistance request sent to caretaker!'
        );
      } else {
        setScreenText(`MEDISAKHI: ${res.data.message || 'Key processed'}`);
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Simulation error');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateNoButton = async () => {
    setLoading(true);
    try {
      const activeRes = await remindersAPI.getActiveAlarm();
      if (activeRes.data?.reminder_id) {
        await remindersAPI.escalateCaretaker(activeRes.data.reminder_id);
      }
      setScreenText(
        '⚠️ NO BUTTON CLICKED WITHIN TIME.\n🚨 Alert message sent to registered Caretaker!'
      );
      setStatusMsg(
        language === 'ta'
          ? '🚨 எந்த பொத்தானும் அழுத்தப்படாததால் பாதுகாவலருக்கு எச்சரிக்கை அனுப்பப்பட்டது!'
          : '🚨 No button pressed! Urgent alert message sent to Caretaker!'
      );
      toast.error('Caretaker alert sent!');
    } catch {
      toast.error('Failed to trigger alert');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-sm bg-gray-900 rounded-[40px] shadow-2xl border-4 border-gray-700 p-6 text-center space-y-4">
        {/* Phone Speaker & Close */}
        <div className="flex items-center justify-between px-2">
          <div className="w-16 h-1.5 bg-gray-700 rounded-full mx-auto" />
          <button onClick={handleClose} className="text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="text-left">
          <span className="text-[10px] font-black uppercase text-green-400 tracking-wider">
            {language === 'ta' ? '📱 விசைப்பலகை போன் மாதிரி' : '📱 Keypad Phone Simulator'}
          </span>
          <p className="text-xs text-gray-400">
            {language === 'ta' ? 'எந்த எண்ணை அழுத்தினாலும் மருந்து உறுதி செய்யப்படும்' : 'Press any button to confirm dose taken'}
          </p>
        </div>

        {/* Vintage Monochrome Phone Screen */}
        <div className="bg-[#8fa382] border-4 border-[#5b6e51] rounded-2xl p-4 font-mono text-left shadow-inner min-h-[130px] flex flex-col justify-between">
          <p className="text-xs font-bold text-[#1a2e12] whitespace-pre-line leading-relaxed">
            {screenText}
          </p>
          {loading && (
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#1a2e12] mt-2">
              <RefreshCw className="h-3 w-3 animate-spin" />
              <span>Transmitting SMS...</span>
            </div>
          )}
        </div>

        {statusMsg && (
          <div className="bg-gray-800 border border-gray-700 p-2.5 rounded-xl text-xs font-bold text-green-300">
            {statusMsg}
          </div>
        )}

        {/* Vintage Keypad Grid */}
        <div className="grid grid-cols-3 gap-2.5 pt-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((k) => (
            <button
              key={k}
              type="button"
              disabled={loading}
              onClick={() => handleKeyPress(k)}
              className={`h-12 rounded-2xl font-black text-lg shadow transition-all active:scale-95 ${
                k === '2'
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-600'
              }`}
            >
              {k}
              {k === '2' && <span className="block text-[8px] font-normal leading-none">HELP</span>}
            </button>
          ))}
        </div>

        {/* Big Green OK / Taken Button */}
        <div className="pt-1 space-y-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => handleKeyPress('OK')}
            className="w-full py-3.5 bg-green-600 hover:bg-green-500 text-white font-black rounded-2xl text-base shadow flex items-center justify-center gap-2"
          >
            <Check className="h-5 w-5 stroke-[3]" />
            <span>{language === 'ta' ? 'சரி / எடுத்துக்கொண்டேன் (OK)' : 'CLICK ANY KEY / OK (TAKEN)'}</span>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={handleSimulateNoButton}
            className="w-full py-2 bg-red-950/80 hover:bg-red-900 text-red-300 text-xs font-bold rounded-xl border border-red-800 transition-colors"
          >
            🚨 {language === 'ta' ? 'பொத்தான் அழுத்தவில்லை (எச்சரிக்கை சோதனை)' : 'No Button Pressed (Test Caretaker Alert)'}
          </button>
        </div>
      </div>
    </div>
  );
}
