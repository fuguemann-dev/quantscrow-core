// src/quantEngine.js
const config = require('./config');

function isKillzoneActive() {
    // return true; // Descomenta para pruebas
    
    const estTime = new Date().toLocaleString("en-US", { timeZone: "America/New_York", hour: 'numeric', hour12: false });
    const hour = parseInt(estTime);
    
    const london = config.killzones.LONDRES;
    const ny = config.killzones.NUEVA_YORK;
    
    return (hour >= london.start && hour < london.end) || (hour >= ny.start && hour < ny.end);
}

function runMonteCarlo(probBase, rd) {
    let wins = 0;
    for (let i = 0; i < config.quant.montecarloIterations; i++) {
        if (Math.random() < probBase) wins++;
    }
    const pFinal = wins / config.quant.montecarloIterations;
    const ev = (pFinal * rd) - (1 - pFinal);
    return { pFinal, ev };
}

function calculateKelly(pFinal, rd) {
    if (rd <= 0) return 0;
    const kellyPuro = pFinal - ((1 - pFinal) / rd);
    let risk = kellyPuro * config.risk.kellyFraction;
    return Math.max(config.risk.minRiskPerTrade, Math.min(risk, config.risk.maxRiskPerTrade));
}

function evaluateSignal({ precioActual, atr, balance, probBase }) {
    if (atr <= 0) return { status: "ABORT", reason: "ATR inválido" };

    const slDist = atr * config.quant.atrMultiplierSL;
    const slTecnico = precioActual - slDist;
    const tpLiquidez = precioActual + (slDist * 2.5); 
    const rd = (tpLiquidez - precioActual) / slDist;

    const { pFinal, ev } = runMonteCarlo(probBase, rd);
    if (ev < config.quant.minEV) {
        return { status: "ABORT", reason: `EV insuficiente (${ev.toFixed(3)})` };
    }

    const riskPct = calculateKelly(pFinal, rd);
    const riskUSD = balance * riskPct;

    const pipsSL = slDist * 10000; 
    let loteCalculado = riskUSD / (pipsSL * 10); 
    
    // 🔥 FILTRO DE SUPERVIVENCIA
    if (loteCalculado < 0.01) {
        const perdidaMinima = 0.01 * (pipsSL * 10);
        const riesgoRealMinimo = perdidaMinima / balance;

        if (riesgoRealMinimo > config.risk.maxRiskPerTrade) {
            return { 
                status: "ABORT", 
                reason: `Riesgo con lote mínimo (${(riesgoRealMinimo*100).toFixed(2)}%) excede el máximo permitido (${(config.risk.maxRiskPerTrade*100)}%).` 
            };
        }
        loteCalculado = 0.01;
    }

    const loteFinal = parseFloat(loteCalculado.toFixed(2));

    return {
        status: "EXECUTE",
        data: { lote: loteFinal, riskUSD, pFinal, ev, rd, slTecnico, tpLiquidez }
    };
}

module.exports = { isKillzoneActive, evaluateSignal };
