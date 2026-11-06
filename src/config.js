// src/config.js
module.exports = {
    server: {
        location: "ATLANTA_1",
        port: process.env.PORT || 3000
    },
    risk: {
        maxDailyDrawdown: 0.025, // 2.5% máximo de pérdida diaria
        minRiskPerTrade: 0.005, // 0.5% mínimo por trade
        maxRiskPerTrade: 0.02, // 2.0% máximo por trade
        kellyFraction: 0.25, // Usar 25% del Kelly puro
        maxConsecutiveLosses: 2 // Si pierde 2 veces, reduce el lote a la mitad
    },
    killzones: {
        LONDRES: { start: 3, end: 6 }, // Horario EST (Atlanta)
        NUEVA_YORK: { start: 8, end: 11 } // Horario EST (Atlanta)
    },
    quant: {
        minRR: 2.0, // Ratio Riesgo/Beneficio mínimo para disparar
        minEV: 0.15, // Valor Esperado mínimo (15%)
        atrMultiplierSL: 1.5, // Stop Loss = 1.5 * ATR
        montecarloIterations: 10000 // Iteraciones del Monte Carlo
    }
};
