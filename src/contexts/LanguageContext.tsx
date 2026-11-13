
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  english,
  type TranslationKey,
} from '../i18n/translations';

const LANGUAGE_STORAGE_KEY = '@britume_app_language';

// BRITUME temporarily supports English only.
export const supportedLanguages = ['English'] as const;

export type Language = 'English';

type LanguageContextType = {
  language: Language;
  setLanguage: (language: Language) => Promise<void>;
  t: (key: TranslationKey | string) => string;
  isLanguageReady: boolean;
  hasFullTranslation: boolean;
};

const LanguageContext = createContext<
  LanguageContextType | undefined
>(undefined);

export function LanguageProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [language] = useState<Language>('English');
  const [isLanguageReady, setIsLanguageReady] = useState(false);

  // Always reset any previously selected language to English.
  useEffect(() => {
    let active = true;

    async function loadLanguage() {
      try {
        await AsyncStorage.setItem(
          LANGUAGE_STORAGE_KEY,
          'English',
        );
      } catch (error) {
        console.warn(
          'Could not save BRITUME language:',
          error,
        );
      } finally {
        if (active) {
          setIsLanguageReady(true);
        }
      }
    }

    void loadLanguage();

    return () => {
      active = false;
    };
  }, []);

  // Keep the existing context API for compatibility.
  const setLanguage = useCallback(
    async (nextLanguage: Language) => {
      if (nextLanguage !== 'English') {
        throw new Error(
          'BRITUME currently supports English only.',
        );
      }

      await AsyncStorage.setItem(
        LANGUAGE_STORAGE_KEY,
        'English',
      );
    },
    [],
  );

  // All app translations temporarily use English.
  const t = useCallback(
    (key: TranslationKey | string): string => {
      return english[key as TranslationKey] || key;
    },
    [],
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      isLanguageReady,
      hasFullTranslation: true,
    }),
    [
      language,
      setLanguage,
      t,
      isLanguageReady,
    ],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error(
      'useLanguage must be used inside LanguageProvider.',
    );
  }

  return context;
}
