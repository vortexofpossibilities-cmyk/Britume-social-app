
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createClient,
  type SupportedStorage,
} from '@supabase/supabase-js';

const rawUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();

const url = rawUrl?.replace(/\/+$/, '');

const validUrl = Boolean(
  url &&
  /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url) &&
  !url.includes('YOUR_PROJECT')
);

const validKey = Boolean(
  key &&
  key !== 'YOUR_SUPABASE_PUBLISHABLE_KEY' &&
  key !== 'YOUR_SUPABASE_ANON_KEY' &&
  !key.includes('YOUR_')
);

export const supabaseConfigured = Boolean(validUrl && validKey);

const storage: SupportedStorage = {
  getItem: (storageKey) => AsyncStorage.getItem(storageKey),
  setItem: (storageKey, value) =>
    AsyncStorage.setItem(storageKey, value),
  removeItem: (storageKey) => AsyncStorage.removeItem(storageKey),
};

export const supabase = supabaseConfigured
  ? createClient(url!, key!, {
      auth: {
        storage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;
