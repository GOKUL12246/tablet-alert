import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Globe } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface LanguageSelectorProps {
  variant?: 'inline' | 'floating' | 'dropdown';
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'inline',
  className,
}) => {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'ta' ? 'en' : 'ta');
  };

  if (variant === 'floating') {
    return (
      <div className={cn('fixed top-4 right-4 z-50 shadow-xl rounded-full', className)}>
        <button
          onClick={toggleLanguage}
          aria-label="Toggle language between Tamil and English"
          className="flex items-center gap-2.5 px-4 py-2.5 bg-white border-2 border-primary-500 rounded-full font-bold text-gray-900 shadow-lg hover:bg-primary-50 active:scale-95 transition-all text-sm md:text-base focus:ring-4 focus:ring-primary-300"
        >
          <Globe className="w-5 h-5 text-primary-600 animate-pulse" />
          <span>{language === 'ta' ? 'English (EN)' : 'தமிழ் (TA)'}</span>
        </button>
      </div>
    );
  }

  return (
    <div className={cn('inline-flex rounded-xl p-1 bg-gray-100 border border-gray-200 shadow-inner', className)}>
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={cn(
          'px-4 py-2 text-sm md:text-base font-semibold rounded-lg transition-all',
          language === 'en'
            ? 'bg-white text-primary-700 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        )}
      >
        English
      </button>
      <button
        type="button"
        onClick={() => setLanguage('ta')}
        className={cn(
          'px-4 py-2 text-sm md:text-base font-semibold rounded-lg transition-all',
          language === 'ta'
            ? 'bg-primary-600 text-white shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        )}
      >
        தமிழ்
      </button>
    </div>
  );
};

export default LanguageSelector;
