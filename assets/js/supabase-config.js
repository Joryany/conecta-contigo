

const SUPABASE_URL = "https://nuoicznqhfmvpxzioksp.supabase.co";       // ej: https://abcdefgh.supabase.co
const SUPABASE_ANON_KEY = "sb_publishable_i4gl5oMAA25amITRp9UGdw_8dIjeKcI";

// Cliente único de Supabase, usado por auth.js y emocional.js.
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);