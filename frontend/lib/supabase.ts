import { createClient } from '@supabase/supabase-js';

// Public anon key: safe in the browser. Row-level security limits what it can read.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
);
