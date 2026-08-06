/**
 * Supabase client — single shared instance for all frontend persistence.
 * Uses VITE_ prefixed environment variables loaded by Vite.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    '[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY. Chat persistence will be disabled.'
  );
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '');
