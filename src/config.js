// src/config.js
module.exports = {
    server: {
        location: "ATLANTA_1",
        port: process.env.PORT || 3000
    },
    // 🔥 CAPITAL REAL (Ajusta a los USD que te deposite el bróker)
    account: {
        balance: 55, // <-- AQUÍ PON TUS $55 USD
        currency: "USD"
    },
    risk: {
        maxDailyDrawdown: 0.02, // 2% máximo de pérdida diaria
        minRiskPerTrade: 0.005, // 0.5% mínimo por trade
        maxRiskPerTrade: 0.01, // 1% máximo por trade (Súper conservador)
        kellyFraction: 0.25, // 25% del Kelly puro
        maxConsecutiveLosses: 2 // Si pierde 2 veces, reduce el lote a la mitad
    },
    killzones: {
        LONDRES: { start: 3, end: 6 }, // Horario EST (Atlanta)
        NUEVA_YORK: { start: 8, end: 11 } // Horario EST (Atlanta)
    },
    quant: {
        minRR: 2.0, // Ratio Riesgo/Beneficio mínimo
        minEV: 0.15, // EV mínimo (15%)
        atrMultiplierSL: 1.5, // Stop Loss = 1.5 * ATR
        montecarloIterations: 10000
    }
};
