import React, { createContext, useContext, useState, useEffect } from 'react';
import { AccessibilityPreferences, AccessibilityMode } from '../types';

interface AccessibilityContextType {
  preferences: AccessibilityPreferences;
  updatePreferences: (newPrefs: Partial<AccessibilityPreferences>) => void;
  setMode: (mode: AccessibilityMode) => void;
}

const defaultPreferences: AccessibilityPreferences = {
  mode: 'standard',
  font_size_multiplier: 1.0,
  high_contrast: false,
  reduced_motion: false,
  screen_reader_mode: false,
  tts_enabled: true,
  tts_language: 'en',
  tts_rate: 0.9,
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(() => {
    try {
      const saved = localStorage.getItem('medisakhi_a11y');
      return saved ? { ...defaultPreferences, ...JSON.parse(saved) } : defaultPreferences;
    } catch {
      return defaultPreferences;
    }
  });

  const applyDomChanges = (prefs: AccessibilityPreferences) => {
    const body = document.body;

    if (prefs.high_contrast || prefs.mode === 'high_contrast') {
      body.classList.add('high-contrast');
    } else {
      body.classList.remove('high-contrast');
    }

    if (prefs.font_size_multiplier > 1.1 || prefs.mode === 'large_text' || prefs.mode === 'easy') {
      body.classList.add('large-text');
    } else {
      body.classList.remove('large-text');
    }

    if (prefs.reduced_motion || prefs.mode === 'reduced_motion') {
      body.classList.add('reduced-motion');
    } else {
      body.classList.remove('reduced-motion');
    }
  };

  useEffect(() => {
    applyDomChanges(preferences);
    try {
      localStorage.setItem('medisakhi_a11y', JSON.stringify(preferences));
    } catch (e) {
      console.error('Failed to save accessibility preferences', e);
    }
  }, [preferences]);

  const updatePreferences = (newPrefs: Partial<AccessibilityPreferences>) => {
    setPreferences((prev) => {
      const updated = { ...prev, ...newPrefs };
      return updated;
    });
  };

  const setMode = (mode: AccessibilityMode) => {
    let updated: Partial<AccessibilityPreferences> = { mode };
    switch (mode) {
      case 'easy':
        updated = {
          mode,
          font_size_multiplier: 1.25,
          tts_enabled: true,
          high_contrast: false,
          reduced_motion: false,
        };
        break;
      case 'voice':
        updated = {
          mode,
          tts_enabled: true,
          font_size_multiplier: 1.1,
          screen_reader_mode: true,
        };
        break;
      case 'high_contrast':
        updated = {
          mode,
          high_contrast: true,
          font_size_multiplier: 1.1,
        };
        break;
      case 'large_text':
        updated = {
          mode,
          font_size_multiplier: 1.35,
          high_contrast: false,
        };
        break;
      case 'reduced_motion':
        updated = {
          mode,
          reduced_motion: true,
        };
        break;
      case 'standard':
      default:
        updated = {
          mode: 'standard',
          font_size_multiplier: 1.0,
          high_contrast: false,
          reduced_motion: false,
          screen_reader_mode: false,
        };
        break;
    }
    updatePreferences(updated);
  };

  return (
    <AccessibilityContext.Provider value={{ preferences, updatePreferences, setMode }}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};
