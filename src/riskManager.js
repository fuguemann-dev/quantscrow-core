// src/riskManager.js
const config = require('./config');
const { supabase } = require('./supabaseClient');

async function checkDailyRisk(userId) {
    const hoy = new Date().toISOString().split('T')[0];

    try {
        // Buscar el presupuesto de riesgo de hoy
        let { data: budget, error } = await supabase
            .from('risk_budget')
            .select('*')
            .eq('user_id', userId)
            .eq('fecha', hoy)
            .single();

        // Si no existe (error PGRST116) o viene null, lo creamos
        if (!budget || (error && error.code === 'PGRST116')) {
            const { data: newBudget, error: insertError } = await supabase
                .from('risk_budget')
                .insert([{ user_id: userId, fecha: hoy, riesgo_usado: 0, trades_perdidos: 0, bloqueado: false }])
                .select()
                .single();
            
            if (insertError) throw new Error(insertError.message);
            budget = newBudget;
        }

        // Validar que budget exista antes de leerlo (Blindaje)
        if (!budget) {
            return { canTrade: true, factorLote: 1.0, reason: "Sin registro previo, iniciando en cero." };
        }

        // Si el sistema ya se bloqueó hoy, abortar
        if (budget.bloqueado) {
            return { canTrade: false, reason: "Kill Switch Activado: Límite diario alcanzado." };
        }

        // Si hay racha de pérdidas, reducir el lote a la mitad
        let factorLote = 1.0;
        if (budget.trades_perdidos >= config.risk.maxConsecutiveLosses) {
            factorLote = 0.5; 
        }

        return { 
            canTrade: true, 
            factorLote, 
            riesgoDisponible: config.maxDailyDrawdown - (budget.riesgo_usado || 0)
        };

    } catch (error) {
        console.error("Error en riskManager:", error.message);
        // Si falla Supabase, por seguridad dejamos pasar el trade con lote mínimo
        return { canTrade: true, factorLote: 0.5 }; 
    }
}

module.exports = { checkDailyRisk }
