
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
  translationPacks,
  type TranslationKey,
  type TranslationPack,
} from '../i18n/translations';

const LANGUAGE_STORAGE_KEY = '@britume_app_language';

export const supportedLanguages = [
  'English',
  'Setswana',
  'Afrikaans',
  'Albanian',
  'Amharic',
  'Arabic',
  'Armenian',
  'Azerbaijani',
  'Basque',
  'Belarusian',
  'Bengali',
  'Bosnian',
  'Bulgarian',
  'Burmese',
  'Catalan',
  'Cebuano',
  'Chinese (Simplified)',
  'Chinese (Traditional)',
  'Corsican',
  'Croatian',
  'Czech',
  'Danish',
  'Dutch',
  'Estonian',
  'Filipino',
  'Finnish',
  'French',
  'Frisian',
  'Galician',
  'Georgian',
  'German',
  'Greek',
  'Gujarati',
  'Haitian Creole',
  'Hausa',
  'Hawaiian',
  'Hebrew',
  'Hindi',
  'Hmong',
  'Hungarian',
  'Icelandic',
  'Igbo',
  'Indonesian',
  'Irish',
  'Italian',
  'Japanese',
  'Javanese',
  'Kannada',
  'Kazakh',
  'Khmer',
  'Kinyarwanda',
  'Korean',
  'Kurdish',
  'Kyrgyz',
  'Lao',
  'Latin',
  'Latvian',
  'Lithuanian',
  'Luxembourgish',
  'Macedonian',
  'Malagasy',
  'Malay',
  'Malayalam',
  'Maltese',
  'Maori',
  'Marathi',
  'Mongolian',
  'Nepali',
  'Norwegian',
  'Odia',
  'Pashto',
  'Persian',
  'Polish',
  'Portuguese',
  'Punjabi',
  'Romanian',
  'Russian',
  'Samoan',
  'Scots Gaelic',
  'Serbian',
  'Sesotho',
  'Shona',
  'Sindhi',
  'Sinhala',
  'Slovak',
  'Slovenian',
  'Somali',
  'Spanish',
  'Sundanese',
  'Swahili',
  'Swedish',
  'Tajik',
  'Tamil',
  'Tatar',
  'Telugu',
  'Thai',
  'Tigrinya',
  'Tongan',
  'Turkish',
  'Turkmen',
  'Ukrainian',
  'Urdu',
  'Uyghur',
  'Uzbek',
  'Vietnamese',
  'Welsh',
  'Xhosa',
  'Yiddish',
  'Yoruba',
  'Zulu',
] as const;

export type Language = (typeof supportedLanguages)[number];

type LanguageContextType = {
  language: Language;
  setLanguage: (language: Language) => Promise<void>;
  t: (key: TranslationKey | string) => string;
  isLanguageReady: boolean;
  hasFullTranslation: boolean;
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

function detectDeviceLanguage(): Language {
  try {
    const locale =
      Intl.DateTimeFormat().resolvedOptions().locale || 'en';

    const parts = locale.split(/[-_]/);
    const code = parts[0].toLowerCase();
    const region = parts[1]?.toUpperCase();

    if (code === 'zh') {
      return region === 'TW' || region === 'HK'
        ? 'Chinese (Traditional)'
        : 'Chinese (Simplified)';
    }

    const languageByCode: Record<string, Language> = {
      en: 'English',
      tn: 'Setswana',
      af: 'Afrikaans',
      sq: 'Albanian',
      am: 'Amharic',
      ar: 'Arabic',
      hy: 'Armenian',
      az: 'Azerbaijani',
      eu: 'Basque',
      be: 'Belarusian',
      bn: 'Bengali',
      bs: 'Bosnian',
      bg: 'Bulgarian',
      my: 'Burmese',
      ca: 'Catalan',
      ceb: 'Cebuano',
      hr: 'Croatian',
      cs: 'Czech',
      da: 'Danish',
      nl: 'Dutch',
      et: 'Estonian',
      fil: 'Filipino',
      fi: 'Finnish',
      fr: 'French',
      gl: 'Galician',
      ka: 'Georgian',
      de: 'German',
      el: 'Greek',
      gu: 'Gujarati',
      ha: 'Hausa',
      he: 'Hebrew',
      hi: 'Hindi',
      hu: 'Hungarian',
      is: 'Icelandic',
      ig: 'Igbo',
      id: 'Indonesian',
      ga: 'Irish',
      it: 'Italian',
      ja: 'Japanese',
      jv: 'Javanese',
      kn: 'Kannada',
      kk: 'Kazakh',
      km: 'Khmer',
      rw: 'Kinyarwanda',
      ko: 'Korean',
      ky: 'Kyrgyz',
      lo: 'Lao',
      lv: 'Latvian',
      lt: 'Lithuanian',
      mk: 'Macedonian',
      mg: 'Malagasy',
      ms: 'Malay',
      ml: 'Malayalam',
      mt: 'Maltese',
      mr: 'Marathi',
      mn: 'Mongolian',
      ne: 'Nepali',
      no: 'Norwegian',
      ps: 'Pashto',
      fa: 'Persian',
      pl: 'Polish',
      pt: 'Portuguese',
      pa: 'Punjabi',
      ro: 'Romanian',
      ru: 'Russian',
      sr: 'Serbian',
      st: 'Sesotho',
      sn: 'Shona',
      sd: 'Sindhi',
      si: 'Sinhala',
      sk: 'Slovak',
      sl: 'Slovenian',
      so: 'Somali',
      es: 'Spanish',
      su: 'Sundanese',
      sw: 'Swahili',
      sv: 'Swedish',
      ta: 'Tamil',
      te: 'Telugu',
      th: 'Thai',
      ti: 'Tigrinya',
      tr: 'Turkish',
      tk: 'Turkmen',
      uk: 'Ukrainian',
      ur: 'Urdu',
      ug: 'Uyghur',
      uz: 'Uzbek',
      vi: 'Vietnamese',
      cy: 'Welsh',
      xh: 'Xhosa',
      yi: 'Yiddish',
      yo: 'Yoruba',
      zu: 'Zulu',
    };

    return languageByCode[code] || 'English';
  } catch {
    return 'English';
  }
}

export function LanguageProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [language, setLanguageState] = useState<Language>('English');
  const [isLanguageReady, setIsLanguageReady] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadLanguage() {
      try {
        const saved = await AsyncStorage.getItem(
          LANGUAGE_STORAGE_KEY,
        );

        const initialLanguage =
          saved && supportedLanguages.includes(saved as Language)
            ? (saved as Language)
            : detectDeviceLanguage();

        if (active) {
          setLanguageState(initialLanguage);
        }

        if (!saved) {
          await AsyncStorage.setItem(
            LANGUAGE_STORAGE_KEY,
            initialLanguage,
          );
        }
      } catch (error) {
        console.warn(
          'Could not load BRITUME language:',
          error,
        );

        if (active) {
          setLanguageState(detectDeviceLanguage());
        }
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

  const setLanguage = useCallback(
    async (nextLanguage: Language) => {
      if (!supportedLanguages.includes(nextLanguage)) {
        throw new Error('Unsupported BRITUME language.');
      }

      await AsyncStorage.setItem(
        LANGUAGE_STORAGE_KEY,
        nextLanguage,
      );

      setLanguageState(nextLanguage);
    },
    [],
  );

  const t = useCallback(
    (key: TranslationKey | string): string => {
      const selectedPack: TranslationPack =
        translationPacks[language] || {};

      return (
        selectedPack[key as TranslationKey] ||
        english[key as TranslationKey] ||
        key
      );
    },
    [language],
  );

  const selectedPack = translationPacks[language] || {};

  const hasFullTranslation =
    Object.keys(selectedPack).length ===
    Object.keys(english).length;

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      isLanguageReady,
      hasFullTranslation,
    }),
    [
      language,
      setLanguage,
      t,
      isLanguageReady,
      hasFullTranslation,
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
