
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGE_STORAGE_KEY = '@britume_language';

export const supportedLanguages = ['English', 'Setswana'] as const;

export type Language = (typeof supportedLanguages)[number];

const translations = {
  English: {
    settings: 'Settings',
    settingsSubtitle: 'Make BRITUME feel like yours.',
    account: 'ACCOUNT',
    editProfile: 'Edit profile',
    editProfileSubtitle: 'Change your name, username and bio',
    privacy: 'Privacy',
    privacySubtitle: 'Manage your public or private profile',
    appearance: 'APPEARANCE',
    darkMode: 'Dark mode',
    darkSelected: 'Dark appearance selected',
    lightSelected: 'Light appearance selected',
    language: 'LANGUAGE',
    appLanguage: 'App language',
    chooseLanguage: 'Choose language',
    chooseLanguageSubtitle: 'Select your preferred language.',
    information: 'INFORMATION',
    about: 'About BRITUME',
    aboutSubtitle: 'Vortex of Possibilities',
    signOut: 'Sign out',
    signOutSubtitle: 'Sign out of your account',
    signOutQuestion: 'Sign out of BRITUME?',
    signOutConfirmation: 'Are you sure you want to sign out of your account?',
    yesSignOut: 'Yes, sign out',
    cancel: 'Cancel',
    languageSaved: 'Your language preference is saved on this device.',
    languageSaveError: 'Could not save your language preference.',
    themeSaveError: 'Could not save your theme preference. Please try again.',
    aboutMessage: 'BRITUME\nVortex of Possibilities\n\nCreated by Brilliant Tumelo Mere.',
    footerNote: 'Built with possibilities in mind.',
    tagline: 'Vortex of Possibilities',
  },
  Setswana: {
    settings: 'Dithulaganyo',
    settingsSubtitle: 'Dira BRITUME e nne ya gago.',
    account: 'AKHAONTE',
    editProfile: 'Baakanya profaele',
    editProfileSubtitle: 'Fetola leina, username le kitsiso ya gago',
    privacy: 'Sephiri',
    privacySubtitle: 'Laola gore profaele ya gago e bonwe ke mang',
    appearance: 'PONALO',
    darkMode: 'Mokgwa o montsho',
    darkSelected: 'Ponalo e ntsho e tlhophilwe',
    lightSelected: 'Ponalo e e phatsimang e tlhophilwe',
    language: 'PUO',
    appLanguage: 'Puo ya app',
    chooseLanguage: 'Tlhopha puo',
    chooseLanguageSubtitle: 'Tlhopha puo e o e ratang.',
    information: 'TSHEDIMOSETSO',
    about: 'Ka ga BRITUME',
    aboutSubtitle: 'Vortex of Possibilities',
    signOut: 'Tswa',
    signOutSubtitle: 'Tswa mo akhaonteng ya gago',
    signOutQuestion: 'A o batla go tswa mo BRITUME?',
    signOutConfirmation: 'A o tlhomamisegile gore o batla go tswa mo akhaonteng ya gago?',
    yesSignOut: 'Ee, tswa',
    cancel: 'Tlogela',
    languageSaved: 'Puo ya gago e bolokilwe mo mogaleng ono.',
    languageSaveError: 'Ga re a kgona go boloka puo ya gago.',
    themeSaveError: 'Ga re a kgona go boloka ponalo ya gago. Tsweetswee leka gape.',
    aboutMessage: 'BRITUME\nVortex of Possibilities\n\nE tlhamilwe ke Brilliant Tumelo Mere.',
    footerNote: 'E agilwe ka megopolo ya kgonagalo.',
    tagline: 'Vortex of Possibilities',
  },
} as const;

export type TranslationKey = keyof typeof translations.English;

type LanguageContextValue = {
  language: Language;
  ready: boolean;
  setLanguage: (language: Language) => Promise<void>;
  t: (key: TranslationKey) => string;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined,
);

function isSupportedLanguage(value: string | null): value is Language {
  return supportedLanguages.some((item) => item === value);
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('English');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadLanguage() {
      try {
        const savedLanguage = await AsyncStorage.getItem(
          LANGUAGE_STORAGE_KEY,
        );

        if (active && isSupportedLanguage(savedLanguage)) {
          setLanguageState(savedLanguage);
        }
      } catch (error) {
        console.warn('Could not load BRITUME language:', error);
      } finally {
        if (active) setReady(true);
      }
    }

    void loadLanguage();

    return () => {
      active = false;
    };
  }, []);

  const setLanguage = async (nextLanguage: Language) => {
    setLanguageState(nextLanguage);

    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    } catch (error) {
      console.warn('Could not save BRITUME language:', error);
      throw error;
    }
  };

  const t = (key: TranslationKey) => translations[language][key];

  if (!ready) {
    return null;
  }

  return (
    <LanguageContext.Provider
      value={{ language, ready, setLanguage, t }}
    >
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
