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
  const [mode, setModeState] = useState<ThemeMode>('light');

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

        setModeState(
          savedMode === 'true' ? 'dark' : 'light',
        );

        const validTheme = THEME_STYLES.some(
          (item) => item.id === savedMaterialTheme,
        );

        setSelectedThemeState(
          validTheme && savedMaterialTheme
            ? savedMaterialTheme
            : DEFAULT_THEME_ID,
        );

        setAccentColourState(
          isValidAccent(savedAccent)
            ? savedAccent
            : DEFAULT_ACCENT,
        );

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
      await AsyncStorage.setItem(
        THEME_MODE_STORAGE_KEY,
        String(nextMode === 'dark'),
      );
    } catch (error) {
      console.warn(
        'Could not save BRITUME display mode:',
        error,
      );
    }
  };

  const toggleTheme = async () => {
    await setMode(mode === 'dark' ? 'light' : 'dark');
  };

  // ------------------------------------------------
  // SELECTED MATERIAL THEME
  // ------------------------------------------------

  const setSelectedTheme = async (themeId: string) => {
    const selected = THEME_STYLES.find(
      (item) => item.id === themeId,
    );

    if (!selected) {
      console.warn(
        `BRITUME theme "${themeId}" was not found.`,
      );
      return;
    }

    setSelectedThemeState(selected.id);

    try {
      await AsyncStorage.setItem(
        MATERIAL_THEME_STORAGE_KEY,
        selected.id,
      );
    } catch (error) {
      console.warn(
        'Could not save BRITUME theme:',
        error,
      );
    }
  };

  // ------------------------------------------------
  // ACCENT COLOUR
  // ------------------------------------------------

  const setAccentColour = async (
    colour: AccentColourId,
  ) => {
    const validColour = ACCENT_COLOURS.find(
      (item) => item.id === colour,
    );

    if (!validColour) return;

    setAccentColourState(colour);

    try {
      await AsyncStorage.setItem(
        ACCENT_COLOUR_STORAGE_KEY,
        colour,
      );
    } catch (error) {
      console.warn(
        'Could not save BRITUME accent colour:',
        error,
      );
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
    const base = mode === 'dark'
      ? darkTheme
      : lightTheme;

    const material = selectedThemeStyle;

    const accent =
      ACCENT_COLOURS.find(
        (item) => item.id === accentColour,
      )?.value ?? lightTheme.blue;

    // Display mode changes the actual surfaces, not only the status bar.
    // Keep the selected material's accent/highlight while switching the
    // main palette to a readable dark or light clay surface set.
    const palette = mode === 'dark'
      ? {
          bg: '#0B1728', panel: '#14263B', panel2: '#1D3550',
          panel3: '#102137', text: '#F4F8FF', muted: '#B3C6DC',
          border: '#35506D', borderStrong: '#57789B',
          shadow: '#050C15', gradient: ['#213D5C', '#14263B', '#0B1728'] as [string, string, string],
        }
      : {
          bg: material.bg, panel: material.panel, panel2: material.panel2,
          panel3: material.panel3, text: material.text, muted: material.muted,
          border: material.border, borderStrong: material.borderStrong,
          shadow: material.shadow, gradient: material.gradient,
        };

    const glass = palette.panel;
    const glassLight = palette.panel2;
    const glassBorder = palette.border;

    const clay = palette.panel;
    const clayBlue = palette.panel2;
    const clayPurple = palette.gradient[0];
    const clayPressed = palette.panel3;

    const glowBlue = material.glow;
    const glowPurple = material.glow;
    const glowGold = material.glow;

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
      highlight: material.highlight,
      gold: material.highlight,
      yellow: material.highlight,

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

      // Claymorphism surfaces
      clay,
      clayBlue,
      clayPurple,
      clayPressed,

      // Glow system
      glow: material.glow,
      glowBlue,
      glowPurple,
      glowGold,

      // Brand aliases
      oilBlue: accent,
      oilGrey: material.muted,
      oilYellow: material.highlight,

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
      availableThemes: THEME_STYLES,
      availableAccentColours: ACCENT_COLOURS,

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
