// src/quantEngine.js
const config = require('./config');

// 1. Filtro de Tiempo (Killzones en EST/Atlanta)
function isKillzoneActive() {
    // return true; // Descomenta esta línea si quieres probar fuera de horario
    
    const estTime = new Date().toLocaleString("en-US", { timeZone: "America/New_York", hour: 'numeric', hour12: false });
    const hour = parseInt(estTime);
    
    const london = config.killzones.LONDRES;
    const ny = config.killzones.NUEVA_YORK;
    
    return (hour >= london.start && hour < london.end) || (hour >= ny.start && hour < ny.end);
}

// 2. Monte Carlo Adaptativo (Simulación pura de 10,000 iteraciones)
function runMonteCarlo(probBase, rd) {
    let wins = 0;
    for (let i = 0; i < config.quant.montecarloIterations; i++) {
        if (Math.random() < probBase) wins++;
    }
    const pFinal = wins / config.quant.montecarloIterations;
    // El Valor Esperado: (Probabilidad * Ganancia) - (Probabilidad de perder * Pérdida)
    const ev = (pFinal * rd) - (1 - pFinal);
    return { pFinal, ev };
}

// 3. Kelly Criterion Fraccional (Cálculo del tamaño de posición)
function calculateKelly(pFinal, rd) {
    if (rd <= 0) return 0;
    // Fórmula de Kelly puro: W - [(1 - W) / R]
    const kellyPuro = pFinal - ((1 - pFinal) / rd);
    let risk = kellyPuro * config.risk.kellyFraction;
    
    // Acotamos el riesgo según la configuración (0.5% min, 2.0% max)
    return Math.max(config.risk.minRiskPerTrade, Math.min(risk, config.risk.maxRiskPerTrade));
}

// 4. El Cerebro: Evaluar Señal Completa
function evaluateSignal({ precioActual, slTecnico, tpLiquidez, probBase, atr, balance }) {
    
    // Filtro ATR (Si el mercado está muerto, abortar)
    if (atr <= 0) return { status: "ABORT", reason: "ATR inválido o volatilidad cero" };

    // Cálculo de R:R Dinámico
    const slDist = Math.abs(precioActual - slTecnico);
    const tpDist = Math.abs(precioActual - tpLiquidez);
    const rd = tpDist / slDist;

    if (rd < config.quant.minRR) {
        return { status: "ABORT", reason: `R:R demasiado bajo (${rd.toFixed(2)}). Mínimo requerido: ${config.quant.minRR}` };
    }

    // Monte Carlo y EV
    const { pFinal, ev } = runMonteCarlo(probBase, rd);
    if (ev < config.quant.minEV) {
        return { status: "ABORT", reason: `EV insuficiente (${ev.toFixed(3)}). Mínimo requerido: ${config.quant.minEV}` };
    }

    // Cálculo de Riesgo y Lote (Kelly)
    const riskPct = calculateKelly(pFinal, rd);
    const riskUSD = balance * riskPct;
    
    // Lógica de cálculo de lote (Asumiendo Forex estándar de 4 decimales)
    const pipsSL = slDist * 10000; 
    let lote = riskUSD / (pipsSL * 10); // 1 lote estándar = $10 por pip
    
    // Redondeo a microlotes (0.01)
    lote = Math.max(0.01, parseFloat(lote.toFixed(2))); 

    return {
        status: "EXECUTE",
        data: { lote, riskUSD, pFinal, ev, rd, slDist, tpDist }
    };
}

module.exports = { isKillzoneActive, evaluateSignal };
