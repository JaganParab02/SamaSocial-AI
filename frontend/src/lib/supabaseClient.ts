/**
 * Supabase client — single shared instance for all frontend persistence.
 * Uses VITE_ prefixed environment variables loaded by Vite.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    '[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY. Chat persistence will be disabled. (Try restarting the Vite dev server!)'
  );
}

// Fallback to dummy values so the app doesn't crash on boot if .env isn't loaded yet.
export const supabase = createClient(
  supabaseUrl || 'https://dummy.supabase.co',
  supabaseKey || 'dummy-key'
);

