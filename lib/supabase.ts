import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const webStorage = Platform.OS === 'web' && typeof window !== 'undefined' ? {
  getItem: (key: string) => Promise.resolve(window.localStorage.getItem(key)),
  setItem: (key: string, value: string) => { window.localStorage.setItem(key, value); return Promise.resolve(); },
  removeItem: (key: string) => { window.localStorage.removeItem(key); return Promise.resolve(); },
} : undefined;

export const supabase = createClient(
  'https://zaiuinuvhuucqccoejyp.supabase.co',
  'sb_publishable_S6xG8yVmdKT03SljxUKoGg_IppcqHPp',
  {
    auth: {
      persistSession: Platform.OS === 'web',
      storage: webStorage,
    }
  }
);
