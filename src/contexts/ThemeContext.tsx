import React, {
createContext,
useContext,
useEffect,
useMemo,
useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme as lightTheme } from '../themes/theme';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = '@britume_theme_mode';

const darkTheme = {
...lightTheme,
bg: '#101B2A',
panel: '#1B2B40',
panel2: '#243A52',
panel3: '#17263A',
text: '#F2F7FF',
muted: '#A9BED3',
liquidText: '#D4E5F5',
textLight: '#FFFFFF',
glass: 'rgba(27, 43, 64, 0.92)',
glassLight: 'rgba(36, 58, 82, 0.75)',
glassBorder: 'rgba(100, 174, 255, 0.25)',
border: '#304A65',
borderStrong: '#42617F',
clay: '#1B2B40',
clayBlue: '#243A52',
clayPurple: '#302D50',
clayPressed: '#304A65',
shadow: '#080F19',
shadowDark: '#080F19',
shadowLight: '#30445C',
milky: '#1B2B40',
milkySoft: '#17263A',
oilGrey: '#A9BED3',
clayShadow: {
shadowColor: '#000000',
shadowOffset: { width: 5, height: 6 },
shadowOpacity: 0.28,
shadowRadius: 12,
elevation: 7,
},
clayRaised: {
shadowColor: '#000000',
shadowOffset: { width: 4, height: 5 },
shadowOpacity: 0.25,
shadowRadius: 9,
elevation: 5,
},
clayPressedStyle: {
shadowColor: '#000000',
shadowOffset: { width: 2, height: 2 },
shadowOpacity: 0.18,
shadowRadius: 4,
elevation: 2,
},
};

type AppTheme = typeof lightTheme;

type ThemeContextValue = {
mode: ThemeMode;
theme: AppTheme;
isDark: boolean;
setMode: (mode: ThemeMode) => Promise<void>;
toggleTheme: () => Promise<void>;
ready: boolean;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
const [mode, setModeState] = useState<ThemeMode>('light');
const [ready, setReady] = useState(false);

useEffect(() => {
let active = true;

async function loadTheme() {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);

    if (active && (saved === 'light' || saved === 'dark')) {
      setModeState(saved);
    }
  } catch (error) {
    console.warn('Could not load BRITUME theme:', error);
  } finally {
    if (active) setReady(true);
  }
}

loadTheme();

return () => {
  active = false;
};

}, []);

const setMode = async (nextMode: ThemeMode) => {
setModeState(nextMode);

try {
  await AsyncStorage.setItem(STORAGE_KEY, nextMode);
} catch (error) {
  console.warn('Could not save BRITUME theme:', error);
}

};

const toggleTheme = async () => {
await setMode(mode === 'light' ? 'dark' : 'light');
};

const value = useMemo(
() => ({
mode,
theme: mode === 'dark' ? darkTheme : lightTheme,
isDark: mode === 'dark',
setMode,
toggleTheme,
ready,
}),
[mode, ready],
);

return (
<ThemeContext.Provider value={value}>
{children}
</ThemeContext.Provider>
);
}

export function useTheme() {
const context = useContext(ThemeContext);

if (!context) {
throw new Error('useTheme must be used inside ThemeProvider');
}

return context;
  }
