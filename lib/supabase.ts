import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://zaiuinuvhuucqccoejyp.supabase.co',
  'sb_publishable_S6xG8yVmdKT03SljxUKoGg_IppcqHPp',
  { auth: { persistSession: false } }
);
