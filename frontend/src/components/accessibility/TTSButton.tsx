import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useSpeech } from '../../hooks/useSpeech';
import { useLanguage } from '../../contexts/LanguageContext';
import { Language } from '../../types';
import { cn } from '../../lib/utils';

export interface TTSButtonProps {
  text: string;
  language?: Language;
  label?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const TTSButton: React.FC<TTSButtonProps> = ({
  text,
  language,
  label,
  size = 'md',
  className,
}) => {
  const { language: currentLang } = useLanguage();
  const targetLang = language || currentLang;
  const { speak, stopSpeaking, isSpeaking } = useSpeech(targetLang);
  const [playing, setPlaying] = useState<boolean>(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSpeaking || playing) {
      stopSpeaking();
      setPlaying(false);
    } else {
      setPlaying(true);
      speak(text, targetLang).finally(() => setPlaying(false));
    }
  };

  const handleMouseLeave = () => {
    if (isCurrentPlaying) {
      stopSpeaking();
      setPlaying(false);
    }
  };

  const isCurrentPlaying = isSpeaking || playing;

  const sizeClasses = {
    sm: 'p-1.5 text-xs gap-1.5',
    md: 'p-2 text-sm gap-2',
    lg: 'px-4 py-2.5 text-base gap-2.5',
    xl: 'px-6 py-4 text-lg font-bold gap-3 rounded-2xl',
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseLeave={handleMouseLeave}
      onBlur={handleMouseLeave}
      aria-label={
        isCurrentPlaying
          ? 'Stop audio playback'
          : `Play instructions aloud: ${text.slice(0, 50)}...`
      }
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-xl transition-all shadow-sm focus:outline-none focus:ring-4',
        isCurrentPlaying
          ? 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-300 animate-pulse focus:ring-red-300'
          : 'bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200 focus:ring-primary-300',
        sizeClasses[size],
        className
      )}
    >
      {isCurrentPlaying ? (
        <VolumeX className={size === 'xl' ? 'w-6 h-6 text-red-600' : 'w-5 h-5 text-red-600'} />
      ) : (
        <Volume2 className={size === 'xl' ? 'w-6 h-6 text-primary-600' : 'w-5 h-5 text-primary-600'} />
      )}
      {label && <span>{label}</span>}
    </button>
  );
};

export default TTSButton;
