import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rmmaiihigwapdkbjhejz.supabase.co';
const supabaseKey = 'sb_publishable_GOxK6iSFpLiQxCDZb9XwNQ_8pmBjXdn';

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);