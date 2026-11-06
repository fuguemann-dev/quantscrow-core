import { createClient } from '@supabase/supabase-js';

// Q-CORE: Fallback directo a credenciales de producción
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://dcorrxkkaqulfaerapzj.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'PEGA_AQUI_LA_LLAVE_PUBLISHABLE_COPIADA';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("🚨 [QUANTSCROW CORE]: Error crítico en credenciales del clúster.");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
