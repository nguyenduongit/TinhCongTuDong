import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const env = fs.readFileSync('.env', 'utf-8');
const SUPABASE_URL = env.match(/VITE_SUPABASE_URL=['"]?(https?:\/\/[^\s'"]+)['"]?/)[1];
const SUPABASE_ANON_KEY = env.match(/VITE_SUPABASE_ANON_KEY=['"]?([^\s'"]+)['"]?/)[1];
const SUPABASE_SERVICE_ROLE = env.match(/VITE_SUPABASE_SERVICE_ROLE_KEY=['"]?([^\s'"]+)['"]?/)?.[1] || SUPABASE_ANON_KEY;
// Using anon key, we cannot run arbitrary SQL, but if the user ran migrations, they are admin.
// Wait, I cannot run SQL using the js client without admin rights, which anon key doesn't have.
