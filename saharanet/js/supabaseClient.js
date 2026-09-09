// ============================================
// Update the two values below from Supabase: Project Settings -> API
// Note: this "anon key" is designed to be exposed in browser code,
// actual protection comes from the RLS policies in supabase_setup.sql
// ============================================
const SUPABASE_URL = "";
const SUPABASE_ANON_KEY = "";
supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
