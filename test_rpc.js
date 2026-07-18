import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const env = fs.readFileSync('.env', 'utf-8');
const SUPABASE_URL = env.match(/VITE_SUPABASE_URL=['"]?(https?:\/\/[^\s'"]+)['"]?/)[1];
const SUPABASE_ANON_KEY = env.match(/VITE_SUPABASE_ANON_KEY=['"]?([^\s'"]+)['"]?/)[1];

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.rpc('admin_get_referrals');
  console.log('Error:', error);
  console.log('Data:', data);
}
run();
