// src/riskManager.js
const config = require('./config');
const { supabase } = require('./supabaseClient');

async function checkDailyRisk(userId) {
    const hoy = new Date().toISOString().split('T')[0];

    // Buscar el presupuesto de riesgo de hoy en Supabase
    let { data: budget, error } = await supabase
        .from('risk_budget')
        .select('*')
        .eq('user_id', userId)
        .eq('fecha', hoy)
        .single();

    // Si no existe registro hoy, lo creamos en cero
    if (error && error.code === 'PGRST116') {
        const { data: newBudget } = await supabase
            .from('risk_budget')
            .insert([{ user_id: userId, fecha: hoy, riesgo_usado: 0, trades_perdidos: 0, bloqueado: false }])
            .select()
            .single();
        budget = newBudget;
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
        riesgoDisponible: config.risk.maxDailyDrawdown - budget.riesgo_usado 
    };
}

module.exports = { checkDailyRisk };
