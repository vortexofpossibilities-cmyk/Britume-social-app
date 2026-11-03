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

const english = {
  // Settings
  settings: 'Settings',
  themeSaveError: 'Could not save your theme. Please try again.',
  languageSaveError: 'Could not save your language. Please try again.',
  about: 'About BRITUME',
  aboutMessage: 'BRITUME — Vortex of Possibilities.',
  tagline: 'Vortex of Possibilities',
  settingsSubtitle: 'Manage your BRITUME experience.',
  account: 'Account',
  editProfile: 'Edit profile',
  editProfileSubtitle: 'Update your personal information.',
  privacy: 'Privacy',
  privacySubtitle: 'Manage your profile privacy.',
  appearance: 'Appearance',
  darkMode: 'Dark mode',
  darkSelected: 'Dark appearance selected',
  lightSelected: 'Light appearance selected',
  language: 'Language',
  appLanguage: 'App language',
  information: 'Information',
  aboutSubtitle: 'Learn more about BRITUME.',
  signOut: 'Sign out',
  signOutSubtitle: 'Sign out of your account.',
  footerNote: 'Made with possibilities.',
  signOutQuestion: 'Sign out?',
  signOutConfirmation: 'Are you sure you want to sign out?',
  yesSignOut: 'Yes, sign out',
  cancel: 'Cancel',
  chooseLanguage: 'Choose language',
  chooseLanguageSubtitle: 'Select your preferred app language.',
  languageSaved: 'Your language preference is saved on this device.',
  languageFallback:
    'This language is available to select. Some app translations are still being prepared.',

  // Home screen
  homeLoading: 'Loading BRITUME...',
  searchPlaceholder: 'Search people, posts and communities...',
  stories: 'Stories',
  seeAll: 'See all',
  yourStory: 'Your Story',
  shareMoment: 'Share a moment',
  posts: 'Posts',
  tryAgain: 'Try again',
  signInRequired: 'Sign in required',
  signInToLike: 'Please sign in to like posts.',
  likeFailed: 'Like failed',
  signInToSave: 'Please sign in to save posts.',
  saveFailed: 'Save failed',
  sharingUnavailable: 'Sharing unavailable',
  postOptions: 'Post options',
  chooseAction: 'Choose an action.',
  share: 'Share',
  comments: 'Comments',
  couldNotLoadComments: 'Could not load comments.',
  signInToComment: 'Please sign in to comment.',
  commentFailed: 'Comment failed',
  pleaseTryAgain: 'Please try again.',
  noMatchingPosts: 'No matching posts',
  welcomeToBritume: 'Welcome to BRITUME',
  trySearchingElse: 'Try searching for something else.',
  communityStarts:
    'Your community starts here. Use the Create button to share your first post.',
  videos: 'Videos',
  reels: 'Reels',
  discoverPeople: 'Discover people',
  notifications: 'Notifications',
  moreMenu: 'More menu',
  searchFilters: 'Search filters',
  britumeMember: 'BRITUME member',
};

const setswana: Partial<typeof english> = {
  // Settings
  settings: 'Dipeakanyo',
  about: 'Ka ga BRITUME',
  aboutMessage: 'BRITUME — Vortex of Possibilities.',
  tagline: 'Vortex of Possibilities',
  settingsSubtitle: 'Laola tiriso ya gago ya BRITUME.',
  account: 'Akhaonto',
  editProfile: 'Baakanya profaele',
  editProfileSubtitle: 'Baakanya tshedimosetso ya gago.',
  privacy: 'Sephiri',
  appearance: 'Ponalo',
  darkMode: 'Mokgwa wa bosigo',
  language: 'Puo',
  appLanguage: 'Puo ya app',
  information: 'Tshedimosetso',
  signOut: 'Tswa',
  signOutQuestion: 'A o batla go tswa?',
  signOutConfirmation: 'A o tlhomamisa gore o batla go tswa?',
  yesSignOut: 'Ee, tswa',
  cancel: 'Tlogela',
  chooseLanguage: 'Tlhopha puo',
  chooseLanguageSubtitle: 'Tlhopha puo e o e ratang ya app.',
  languageSaved: 'Puo ya gago e bolokilwe mo sesebedisweng seno.',

  // Home screen
  homeLoading: 'BRITUME e a laisa...',
  searchPlaceholder: 'Batla batho, diposo le ditšhaba...',
  stories: 'Dikanegelo',
  seeAll: 'Bona tsotlhe',
  yourStory: 'Kanelo ya gago',
  shareMoment: 'Abelana ka motsotso',
  posts: 'Diposo',
  tryAgain: 'Leka gape',
  signInRequired: 'Tsena mo akhaontong',
  signInToLike: 'Tsena mo akhaontong go rata diposo.',
  likeFailed: 'Go rata ga go a atlega',
  signInToSave: 'Tsena mo akhaontong go boloka diposo.',
  saveFailed: 'Go boloka ga go a atlega',
  sharingUnavailable: 'Go abelana ga go teng',
  postOptions: 'Dikgetho tsa poso',
  chooseAction: 'Tlhopha se o batlang go se dira.',
  share: 'Abelana',
  comments: 'Ditshwaelo',
  couldNotLoadComments: 'Ga go a kgonega go laisa ditshwaelo.',
  signInToComment: 'Tsena mo akhaontong go kwala tshwaelo.',
  commentFailed: 'Tshwaelo ga e a atlega',
  pleaseTryAgain: 'Tsweetswee leka gape.',
  noMatchingPosts: 'Ga go na diposo tse di tshwanang',
  welcomeToBritume: 'O amogetswe mo BRITUME',
  trySearchingElse: 'Leka go batla sengwe se sele.',
  communityStarts:
    'Setšhaba sa gago se simolola fano. Dirisa konopo ya Create go abelana ka poso ya gago ya ntlha.',
  videos: 'Dibidio',
  reels: 'Dikgatiso tse dikhutshwane',
  discoverPeople: 'Batla batho',
  notifications: 'Dikitsiso',
  moreMenu: 'Menu e nngwe',
  searchFilters: 'Dikgetho tsa patlo',
  britumeMember: 'Leloko la BRITUME',
};

const translations: Partial<Record<Language, Partial<typeof english>>> = {
  English: english,
  Setswana: setswana,
};

type TranslationKey = keyof typeof english;

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
        const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);

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
        console.warn('Could not load BRITUME language:', error);

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
      const selectedPack = translations[language] || english;

      return (
        selectedPack[key as TranslationKey] ||
        english[key as TranslationKey] ||
        key
      );
    },
    [language],
  );

  // Setswana is still being translated screen by screen.
  const hasFullTranslation = language === 'English';

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
