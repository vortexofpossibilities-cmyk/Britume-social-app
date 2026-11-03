
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createClient,
  type SupportedStorage,
} from '@supabase/supabase-js';

const rawUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();

// Accept both the project URL and a URL ending in /rest/v1/
const url = rawUrl
  ?.replace(/\/rest\/v1\/?$/i, '')
  .replace(/\/+$/, '');

const validUrl = Boolean(
  url &&
  /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url) &&
  !url.includes('YOUR_PROJECT')
);

const validKey = Boolean(
  key &&
  !key.includes('YOUR_') &&
  key !== 'YOUR_SUPABASE_PUBLISHABLE_KEY' &&
  key !== 'YOUR_SUPABASE_ANON_KEY'
);

export const supabaseConfigured = Boolean(validUrl && validKey);

const storage: SupportedStorage = {
  getItem: storageKey => AsyncStorage.getItem(storageKey),
  setItem: (storageKey, value) =>
    AsyncStorage.setItem(storageKey, value),
  removeItem: storageKey => AsyncStorage.removeItem(storageKey),
};

export const supabase = supabaseConfigured
  ? createClient(url!, key!, {
      auth: {
        storage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;
