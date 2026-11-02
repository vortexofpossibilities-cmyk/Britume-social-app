import React, {
createContext,
useContext,
useEffect,
useState,
type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme as lightTheme } from '../themes/theme';

const THEME_STORAGE_KEY = '@britume_settings_dark_mode';

const darkTheme = {
...lightTheme,
bg: '#101B2A',
panel: '#1B2B40',
panel2: '#243A52',
panel3: '#17263A',
text: '#F2F7FF',
muted: '#A9BED3',
liquidText: '#D2E5F8',
border: '#304A65',
borderStrong: '#456482',
glass: 'rgba(27, 43, 64, 0.92)',
glassLight: 'rgba(36, 58, 82, 0.75)',
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

type ThemeMode = 'light' | 'dark';

type ThemeContextType = {
mode: ThemeMode;
isDark: boolean;
theme: typeof lightTheme;
setMode: (mode: ThemeMode) => Promise<void>;
toggleTheme: () => Promise<void>;
};

const ThemeContext = createContext<ThemeContextType | undefined>(
undefined,
);

export function ThemeProvider({ children }: { children: ReactNode }) {
const [mode, setModeState] = useState<ThemeMode>('light');
const [ready, setReady] = useState(false);

useEffect(() => {
let active = true;

async function loadTheme() {
  try {
    const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);

    if (active && saved === 'true') {
      setModeState('dark');
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
  await AsyncStorage.setItem(
    THEME_STORAGE_KEY,
    String(nextMode === 'dark'),
  );
} catch (error) {
  console.warn('Could not save BRITUME theme:', error);
}

};

const toggleTheme = async () => {
await setMode(mode === 'dark' ? 'light' : 'dark');
};

const value: ThemeContextType = {
mode,
isDark: mode === 'dark',
theme: mode === 'dark' ? darkTheme : lightTheme,
setMode,
toggleTheme,
};

if (!ready) {
return null;
}

return (
<ThemeContext.Provider value={value}>
{children}
</ThemeContext.Provider>
);
}

export function useAppTheme() {
const context = useContext(ThemeContext);

if (!context) {
throw new Error(
'useAppTheme must be used inside ThemeProvider.',
);
}

return context;
}
