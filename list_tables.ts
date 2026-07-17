import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://zdpssvuxktbfwcrgdial.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'; // I can't read the env from terminal easily but I can read it from .env
