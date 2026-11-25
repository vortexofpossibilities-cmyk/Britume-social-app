import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { theme as lightTheme } from '../themes/theme';

import {
  THEME_STYLES,
  DEFAULT_THEME_ID,
  getThemeStyle,
  type ThemeStyle,
} from '../theme/themeDefinitions';

// --------------------------------------------------
// STORAGE
// --------------------------------------------------

const THEME_MODE_STORAGE_KEY = '@britume_settings_dark_mode';
const MATERIAL_THEME_STORAGE_KEY = '@britume_material_theme';
const ACCENT_COLOUR_STORAGE_KEY = '@britume_accent_colour';

// --------------------------------------------------
// TYPES
// --------------------------------------------------

export type ThemeMode = 'light' | 'dark';

export type AccentColourId =
  | 'blue'
  | 'teal'
  | 'peach'
  | 'mint'
  | 'pink'
  | 'purple'
  | 'gold'
  | 'red'
  | 'orange'
  | 'white';

export type AccentColour = {
  id: AccentColourId;
  name: string;
  value: string;
};

export const ACCENT_COLOURS: AccentColour[] = [
  { id: 'blue', name: 'Ocean Blue', value: '#168BFF' },
  { id: 'teal', name: 'Teal', value: '#4ED4C2' },
  { id: 'peach', name: 'Peach', value: '#FFB5A7' },
  { id: 'mint', name: 'Mint', value: '#20B878' },
  { id: 'pink', name: 'Pink', value: '#FF8FAB' },
  { id: 'purple', name: 'Purple', value: '#8C83FF' },
  { id: 'gold', name: 'Gold', value: '#FFD447' },
  { id: 'red', name: 'Red', value: '#FF5252' },
  { id: 'orange', name: 'Orange', value: '#FF963D' },
  { id: 'white', name: 'White', value: '#FFFFFF' },
];

export type ExtendedTheme = typeof lightTheme & {
  materialStyle: ThemeStyle;
  material: string;

  backgroundGradient: ThemeStyle['gradient'];
  backgroundType: ThemeStyle['backgroundType'];

  shape: ThemeStyle['shape'];
  texture: string;
  lighting: string;
  depth: number;
  motion: string;

  cardRadius: number;
  cardBorderWidth: number;

  glow: string;
  accent: string;

  highlight: string;

  glass: string;
  glassLight: string;
  glassBorder: string;

  clay: string;
  clayBlue: string;
  clayPurple: string;
  clayPressed: string;

  oilBlue: string;
  oilGrey: string;
  oilYellow: string;

  glowBlue: string;
  glowPurple: string;
  glowGold: string;
};

type ThemeContextType = {
  mode: ThemeMode;
  isDark: boolean;
  theme: ExtendedTheme;

  selectedTheme: string;
  selectedThemeStyle: ThemeStyle;

  accentColour: AccentColourId;
  availableThemes: ThemeStyle[];
  availableAccentColours: AccentColour[];

  setMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;

  setSelectedTheme: (themeId: string) => Promise<void>;
  setAccentColour: (colour: AccentColourId) => Promise<void>;
};

// --------------------------------------------------
// DARK BASE THEME
// --------------------------------------------------

const darkTheme: typeof lightTheme = {
  ...lightTheme,

  bg: '#101B2A',
  panel: '#1B2B40',
  panel2: '#243A52',
  panel3: '#17263A',

  text: '#F2F7FF',
  muted: '#A9BED3',
  liquidText: '#D2E5F8',
  textLight: '#FFFFFF',

  border: '#304A65',
  borderStrong: '#456482',

  glass: 'rgba(27, 43, 64, 0.92)',
  glassLight: 'rgba(36, 58, 82, 0.75)',
  glassBorder: 'rgba(120, 170, 220, 0.25)',

  clay: '#1B2B40',
  clayBlue: '#243A52',
  clayPurple: '#302D50',
  clayPressed: '#304A65',

  shadow: '#080F19',
  shadowDark: '#080F19',
  shadowLight: '#304A65',

  milky: '#1B2B40',
  milkySoft: '#17263A',
};

// --------------------------------------------------
// DEFAULT SETTINGS
// --------------------------------------------------

const DEFAULT_ACCENT: AccentColourId = 'blue';
const OFFICIAL_ACCENT: AccentColour = { id: 'blue', name: 'BRITUME Electric Blue', value: '#087BFF' };

function isValidAccent(
  value: string | null,
): value is AccentColourId {
  return ACCENT_COLOURS.some((item) => item.id === value);
}

// --------------------------------------------------
// CONTEXT
// --------------------------------------------------

const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined,
);

// --------------------------------------------------
// PROVIDER
// --------------------------------------------------

export function ThemeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [mode, setModeState] = useState<ThemeMode>('dark');

  const [selectedTheme, setSelectedThemeState] =
    useState<string>(DEFAULT_THEME_ID);

  const [accentColour, setAccentColourState] =
    useState<AccentColourId>(DEFAULT_ACCENT);

  const [ready, setReady] = useState(false);

  // ------------------------------------------------
  // LOAD SAVED SETTINGS
  // ------------------------------------------------

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      try {
        const [
          savedMode,
          savedMaterialTheme,
          savedAccent,
        ] = await Promise.all([
          AsyncStorage.getItem(THEME_MODE_STORAGE_KEY),
          AsyncStorage.getItem(MATERIAL_THEME_STORAGE_KEY),
          AsyncStorage.getItem(ACCENT_COLOUR_STORAGE_KEY),
        ]);

        if (!active) return;

        // Restore the user's saved appearance. Support the older boolean
        // storage values as well as the newer explicit mode names.
        setModeState(savedMode === 'light' || savedMode === 'false' ? 'light' : 'dark');

        const validTheme = THEME_STYLES.some(
          (item) => item.id === savedMaterialTheme,
        );

        setSelectedThemeState(DEFAULT_THEME_ID);

        setAccentColourState(DEFAULT_ACCENT);

        if (!validTheme) {
          await AsyncStorage.setItem(
            MATERIAL_THEME_STORAGE_KEY,
            DEFAULT_THEME_ID,
          );
        }
      } catch (error) {
        console.warn(
          'Could not load BRITUME theme settings:',
          error,
        );
      } finally {
        if (active) {
          setReady(true);
        }
      }
    }

    loadSettings();

    return () => {
      active = false;
    };
  }, []);

  // ------------------------------------------------
  // LIGHT / DARK MODE
  // ------------------------------------------------

  const setMode = async (nextMode: ThemeMode) => {
    setModeState(nextMode);
    try {
      await AsyncStorage.setItem(THEME_MODE_STORAGE_KEY, nextMode);
    } catch (error) {
      console.warn('Could not save BRITUME display mode:', error);
    }
  };

  const toggleTheme = async () => {
    await setMode(mode === 'dark' ? 'light' : 'dark');
  };

  // ------------------------------------------------
  // SELECTED MATERIAL THEME
  // ------------------------------------------------

  const setSelectedTheme = async (_themeId: string) => {
    setSelectedThemeState(DEFAULT_THEME_ID);
    try {
      await AsyncStorage.setItem(MATERIAL_THEME_STORAGE_KEY, DEFAULT_THEME_ID);
    } catch (error) {
      console.warn('Could not save BRITUME theme:', error);
    }
  };

  // ------------------------------------------------
  // ACCENT COLOUR
  // ------------------------------------------------

  const setAccentColour = async (_colour: AccentColourId) => {
    setAccentColourState(DEFAULT_ACCENT);
    try {
      await AsyncStorage.setItem(ACCENT_COLOUR_STORAGE_KEY, DEFAULT_ACCENT);
    } catch (error) {
      console.warn('Could not save BRITUME accent colour:', error);
    }
  };

  // ------------------------------------------------
  // SELECTED THEME STYLE
  // ------------------------------------------------

  const selectedThemeStyle = useMemo(
    () => getThemeStyle(selectedTheme),
    [selectedTheme],
  );

  // ------------------------------------------------
  // BUILD COMPLETE ACTIVE THEME
  // ------------------------------------------------

  const activeTheme = useMemo<ExtendedTheme>(() => {
    const base = mode === 'dark' ? darkTheme : lightTheme;
    const material = getThemeStyle(DEFAULT_THEME_ID);
    const accent = '#087BFF';

    // Deep sculpted clay surfaces in both modes, with a softer daylight
    // palette for light mode and high-contrast recessed shadows for dark.
    const palette = mode === 'dark'
      ? {
          bg: '#050914', panel: '#0B1425', panel2: '#13243B',
          panel3: '#071020', text: '#F5F8FF', muted: '#AABBD3',
          border: 'rgba(31,125,255,0.42)', borderStrong: '#D9A83E',
          shadow: '#02050B', gradient: ['#17345A', '#0B1425', '#050914'] as [string, string, string],
        }
      : {
          bg: '#E8EEF7', panel: '#F4F7FC', panel2: '#E3EAF5',
          panel3: '#DCE5F1', text: '#17263D', muted: '#61738C',
          border: 'rgba(8,91,190,0.20)', borderStrong: '#A97822',
          shadow: '#AAB8CB', gradient: ['#FFFFFF', '#E8EEF7', '#DCE6F2'] as [string, string, string],
        };

    const glass = palette.panel;
    const glassLight = palette.panel2;
    const glassBorder = palette.border;

    const clay = palette.panel;
    const clayBlue = palette.panel2;
    const clayPurple = palette.gradient[0];
    const clayPressed = palette.panel3;

    const glowBlue = mode === 'dark' ? 'rgba(8,123,255,0.48)' : 'rgba(8,123,255,0.22)';
    const glowPurple = mode === 'dark' ? 'rgba(8,123,255,0.20)' : 'rgba(8,123,255,0.10)';
    const glowGold = mode === 'dark' ? 'rgba(217,168,62,0.38)' : 'rgba(169,120,34,0.20)';

    return {
      ...base,

      // Main surfaces
      bg: palette.bg,
      panel: palette.panel,
      panel2: palette.panel2,
      panel3: palette.panel3,

      // Text
      text: palette.text,
      muted: palette.muted,

      // Brand and accent
      cyan: accent,
      blue: accent,
      blueLight: accent,
      blueDark: accent,
      accent,

      // Theme-specific highlights
      highlight: mode === 'dark' ? '#F1C66B' : '#A97822',
      gold: mode === 'dark' ? '#D9A83E' : '#A97822',
      yellow: mode === 'dark' ? '#F1C66B' : '#B88935',

      // Borders and shadows
      border: palette.border,
      borderStrong: palette.borderStrong,
      shadow: palette.shadow,
      shadowDark: material.shadow,
      shadowLight: material.highlight,

      // Glass system
      glass,
      glassLight,
      glassBorder,

      // Claymorphism surfaces and deliberately deep, sculpted shadows.
      clay,
      clayBlue,
      clayPurple,
      clayPressed,
      clayShadow: {
        shadowColor: mode === 'dark' ? '#000000' : '#9AA9BC',
        shadowOffset: { width: 5, height: 6 },
        shadowOpacity: mode === 'dark' ? 0.42 : 0.28,
        shadowRadius: 10,
        elevation: 6,
        borderWidth: 1,
        borderColor: palette.border,
      },
      clayRaised: {
        shadowColor: mode === 'dark' ? '#000000' : '#9AA9BC',
        shadowOffset: { width: 7, height: 8 },
        shadowOpacity: mode === 'dark' ? 0.48 : 0.30,
        shadowRadius: 13,
        elevation: 8,
        borderWidth: 1,
        borderColor: palette.border,
      },
      clayPressedStyle: {
        shadowColor: mode === 'dark' ? '#000000' : '#9AA9BC',
        shadowOffset: { width: 1, height: 2 },
        shadowOpacity: mode === 'dark' ? 0.30 : 0.18,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: palette.borderStrong,
      },

      // Glow system
      glow: glowBlue,
      glowBlue,
      glowPurple,
      glowGold,

      // Brand aliases
      oilBlue: accent,
      oilGrey: material.muted,
      oilYellow: mode === 'dark' ? '#D9A83E' : '#A97822',

      // Material theme metadata
      materialStyle: material,
      material: material.material,

      backgroundGradient: palette.gradient,
      backgroundType: material.backgroundType,

      shape: material.shape,
      texture: material.texture,
      lighting: material.lighting,
      depth: material.depth,
      motion: material.motion,

      cardRadius: material.radius,
      cardBorderWidth: material.borderWidth,
    };
  }, [
    mode,
    selectedThemeStyle,
    accentColour,
  ]);

  // ------------------------------------------------
  // CONTEXT VALUE
  // ------------------------------------------------

  const value = useMemo<ThemeContextType>(
    () => ({
      mode,
      isDark: mode === 'dark',
      theme: activeTheme,

      selectedTheme,
      selectedThemeStyle,

      accentColour,
      availableThemes: [getThemeStyle(DEFAULT_THEME_ID)],
      availableAccentColours: [OFFICIAL_ACCENT],

      setMode,
      toggleTheme,
      setSelectedTheme,
      setAccentColour,
    }),
    [
      mode,
      activeTheme,
      selectedTheme,
      selectedThemeStyle,
      accentColour,
    ],
  );

  if (!ready) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// --------------------------------------------------
// HOOK
// --------------------------------------------------

export function useAppTheme(): ThemeContextType {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      'useAppTheme must be used inside ThemeProvider.',
    );
  }

  return context;
}
