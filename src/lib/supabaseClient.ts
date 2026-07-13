import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

// Check if credentials are set (ignoring placeholders)
export const isSupabaseConfigured =
  supabaseUrl !== '' &&
  supabaseUrl !== 'your_supabase_project_url' &&
  supabaseAnonKey !== '' &&
  supabaseAnonKey !== 'your_supabase_anon_public_key';

// Initialize the client if variables are present, otherwise export null
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

if (!isSupabaseConfigured) {
  console.warn(
    'AZYMAR: Supabase environment variables are missing or set to placeholder values. ' +
    'The app will run in local demo fallback mode using static mock data.'
  );
}
