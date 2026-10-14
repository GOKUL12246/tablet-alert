import { useState, useEffect, useCallback, useRef } from 'react';
import { Language } from '../types';
import {
  speakText,
  stopSpeaking as stopTTS,
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
} from '../lib/speechUtils';

// TypeScript declaration for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export const useSpeech = (defaultLang: Language = 'en') => {
  const [transcript, setTranscript] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const latestTranscriptRef = useRef<string>('');
  const onSpeechEndRef = useRef<((text: string) => void) | undefined>(undefined);
  const isSupported = isSpeechRecognitionSupported() && isSpeechSynthesisSupported();

  useEffect(() => {
    if (!isSpeechRecognitionSupported()) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = defaultLang === 'ta' ? 'ta-IN' : 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: any) => {
      let current = '';
      for (let i = 0; i < event.results.length; ++i) {
        current += event.results[i][0].transcript;
      }
      latestTranscriptRef.current = current;
      setTranscript(current);
    };

    recognition.onerror = (e: any) => {
      console.warn('Speech recognition error:', e.error);
      setIsListening(false);
      setError(e.error || 'Speech recognition error');
    };

    recognition.onend = () => {
      setIsListening(false);
      const text = latestTranscriptRef.current.trim();
      if (text && onSpeechEndRef.current) {
        const cb = onSpeechEndRef.current;
        // avoid double calling
        onSpeechEndRef.current = undefined;
        cb(text);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch {
        // ignore
      }
    };
  }, [defaultLang]);

  const speak = useCallback(
    async (text: string, lang?: Language, rate: number = 0.95) => {
      if (!isSpeechSynthesisSupported()) {
        setError('Text-to-speech is not supported on this browser.');
        return;
      }
      setIsSpeaking(true);
      try {
        await speakText(text, {
          language: lang || defaultLang,
          rate,
          onStart: () => setIsSpeaking(true),
          onEnd: () => setIsSpeaking(false),
          onError: (err) => {
            console.error(err);
            setIsSpeaking(false);
          },
        });
      } catch (err: any) {
        setError(err?.message || 'Error playing speech');
        setIsSpeaking(false);
      }
    },
    [defaultLang]
  );

  const stopSpeaking = useCallback(() => {
    stopTTS();
    setIsSpeaking(false);
  }, []);

  const startListening = useCallback(
    (lang?: Language, onEnd?: (text: string) => void) => {
      if (!recognitionRef.current) {
        setError('Speech recognition not available.');
        return;
      }
      try {
        if (lang) {
          recognitionRef.current.lang = lang === 'ta' ? 'ta-IN' : 'en-US';
        }
        onSpeechEndRef.current = onEnd;
        latestTranscriptRef.current = '';
        setTranscript('');
        setError(null);
        recognitionRef.current.start();
      } catch (e: any) {
        console.warn('Error starting speech recognition:', e);
      }
    },
    []
  );

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
    const text = latestTranscriptRef.current.trim();
    if (text && onSpeechEndRef.current) {
      const cb = onSpeechEndRef.current;
      onSpeechEndRef.current = undefined;
      cb(text);
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return {
    transcript,
    isListening,
    isSpeaking,
    isSupported,
    error,
    speak,
    stopSpeaking,
    startListening,
    stopListening,
    resetTranscript,
  };
};

export default useSpeech;
