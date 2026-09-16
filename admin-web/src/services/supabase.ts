import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://db.hwwywqxsifzxcnilmcry.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.dummy';

let supabaseClient: SupabaseClient | null = null;

export function getAdminSupabase(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;

  if (SUPABASE_URL && SUPABASE_ANON_KEY && !SUPABASE_ANON_KEY.includes('dummy')) {
    try {
      supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      });
    } catch (e) {
      console.warn('Could not initialize Supabase Realtime client:', e);
    }
  }

  return supabaseClient;
}
