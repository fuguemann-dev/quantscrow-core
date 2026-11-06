import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Credenciales oficiales de producción - Quantscrow Core
const SUPABASE_URL = 'https://dcorrxkkaqulfaerapzj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_QaxKjlt_ney1BKCRGSm-4w_KEEXk-Rp';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("[QUANTSCROW CORE]: Error crítico en credenciales del clúster.");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
