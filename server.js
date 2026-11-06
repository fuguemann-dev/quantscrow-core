const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Carga segura y opcional para evitar crashes si el SDK no está instalado
let MetaApi = null;
try {
    const metaApiSdk = require('metaapi-cloud-sdk');
    MetaApi = metaApiSdk.default || metaApiSdk;
} catch (err) {
    console.warn('⚠️ [QUANTSCROW CORE]: MetaAPI SDK desactivado temporalmente en runtime.');
}

const app = express();
const PORT = process.env.PORT || 8080;

// Configuración de Entorno & Credenciales de Producción
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://dcorrxkkaqulfaerapzj.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;
const metaApiToken = process.env.VITE_META_API_TOKEN || process.env.META_API_TOKEN;

const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;
const api = metaApiToken ? new MetaApi(metaApiToken) : null;

app.use(express.json());
app.use(express.static(__dirname));

// ==========================================================
// 1. MÓDULO DE VALIDACIÓN DE KILLZONES (HORARIO INSTITUCIONAL)
// ==========================================================
function checkKillzone(currentTime = new Date()) {
    const hours = currentTime.getUTCHours();
    const minutes = currentTime.getUTCMinutes();
    const timeDecimal = hours + minutes / 60;

    let activeKillzone = null;

    // London Killzone: 07:00 - 10:00 UTC
    if (timeDecimal >= 7.0 && timeDecimal <= 10.0) {
        activeKillzone = 'LONDON_KILLZONE';
    }
    // New York Killzone: 12:00 - 15:00 UTC
    else if (timeDecimal >= 12.0 && timeDecimal <= 15.0) {
        activeKillzone = 'NEW_YORK_KILLZONE';
    }
    // Asian Range: 00:00 - 03:00 UTC
    else if (timeDecimal >= 0.0 && timeDecimal <= 3.0) {
        activeKillzone = 'ASIAN_RANGE';
    }

    return {
        isInKillzone: activeKillzone !== null,
        activeKillzone: activeKillzone || 'OUTSIDE_KILLZONE'
    };
}

// ==========================================================
// 2. MOTOR CUANTITATIVO: MONTE CARLO & GESTIÓN DE RIESGO
// ==========================================================
app.post('/api/quant/portfolio-simulation', (req, res) => {
    const { 
        winRate = 0.55,          
        riskRewardRatio = 1.5,   
        iterations = 10000,      
        initialBalance = 10000,  
        riskPerTrade = 0.01      
    } = req.body;
    
    let balance = initialBalance;
    let peak = initialBalance;
    let maxDrawdown = 0;
    let winCount = 0;
    let ruinedCount = 0;

    for (let i = 0; i < iterations; i++) {
        const isWin = Math.random() < winRate;
        const riskAmount = balance * riskPerTrade;
        
        if (isWin) {
            balance += riskAmount * riskRewardRatio;
            winCount++;
        } else {
            balance -= riskAmount;
        }

        if (balance > peak) peak = balance;
        const drawdown = (peak - balance) / peak;
        if (drawdown > maxDrawdown) maxDrawdown = drawdown;

        if (balance <= initialBalance * 0.5) {
            ruinedCount++;
        }
    }

    return res.json({
        status: 'SUCCESS',
        model: 'Monte Carlo Financial Simulation',
        metrics: {
            initialBalance,
            finalBalanceEstimated: balance.toFixed(2),
            observedWinRate: ((winCount / iterations) * 100).toFixed(2) + '%',
            maximumDrawdown: (maxDrawdown * 100).toFixed(2) + '%',
            riskOfRuin: ((ruinedCount / iterations) * 100).toFixed(2) + '%',
            totalSimulations: iterations
        }
    });
});

// ==========================================================
// 3. DISPARADOR AUTOMÁTICO EN MT5 & GESTIÓN DE LOTAJE
// ==========================================================
app.post('/api/trading/execute-order', async (req, res) => {
    const { 
        accountId,       
        symbol,          
        action,          
        balance,         
        riskPerTrade = 0.01, 
        stopLossPips,    
        takeProfitPips,  
        pipValue = 10,
        enforceKillzone = true 
    } = req.body;

    if (!accountId || !symbol || !action || !stopLossPips || !balance) {
        return res.status(400).json({ error: 'Faltan parámetros críticos para el disparo automático.' });
    }

    const killzoneStatus = checkKillzone();
    if (enforceKillzone && !killzoneStatus.isInKillzone) {
        return res.status(400).json({
            status: 'BLOCKED_BY_RISK',
            message: 'Operación bloqueada: Fuera de la Killzone institucional activa.',
            currentStatus: killzoneStatus
        });
    }

    try {
        if (!api) {
            return res.status(500).json({ error: 'MetaAPI Token no inicializado en el servidor.' });
        }

        // Cálculo de lotaje milimétrico (Riesgo / (SL * PipValue))
        const riskAmount = balance * riskPerTrade; 
        let calculatedLotSize = riskAmount / (stopLossPips * pipValue);
        calculatedLotSize = Math.max(0.01, Math.round(calculatedLotSize * 100) / 100);

        const account = await api.metatraderAccountApi.getAccount(accountId);
        const connection = account.getRPCConnection();
        
        if (!connection.isSynchronized()) {
            await connection.connect();
            await connection.waitSynchronized();
        }

        const price = await connection.terminalState.getPrice(symbol);
        const entryPrice = action === 'BUY' ? price.ask : price.bid;

        const slPrice = action === 'BUY' 
            ? entryPrice - (stopLossPips * 0.0001)  
            : entryPrice + (stopLossPips * 0.0001);

        const tpPrice = takeProfitPips 
            ? (action === 'BUY' ? entryPrice + (takeProfitPips * 0.0001) : entryPrice - (takeProfitPips * 0.0001))
            : undefined;

        const orderResult = await connection.createMarketOrder(
            symbol,
            action,
            calculatedLotSize,
            slPrice,
            tpPrice,
            {
                comment: `QCore-${killzoneStatus.activeKillzone}`,
                clientId: 'qcore-' + Date.now()
            }
        );

        return res.json({
            status: 'SUCCESS',
            message: 'Disparo automático ejecutado con éxito bajo filtros institucionales.',
            executionDetails: {
                orderId: orderResult.orderId || orderResult.stringTicket,
                symbol,
                action,
                lots: calculatedLotSize,
                entryPrice,
                stopLoss: slPrice,
                takeProfit: tpPrice || 'N/A',
                riskAssignedUSD: riskAmount.toFixed(2),
                killzone: killzoneStatus.activeKillzone
            }
        });

    } catch (error) {
        console.error('❌ Error en el disparo automático MT5:', error.message);
        return res.status(500).json({ status: 'ERROR', error: error.message });
    }
});

// ==========================================================
// 4. MÓDULO DE GESTIÓN DE RIESGO: BREAKEVEN AUTOMÁTICO
// ==========================================================
app.post('/api/trading/breakeven-check', (req, res) => {
    const { entryPrice, currentPrice, orderType, activationPips, currentStopLoss } = req.body;
    
    if (!entryPrice || !currentPrice || !orderType) {
        return res.status(400).json({ error: 'Faltan parámetros para evaluar Breakeven.' });
    }

    let isEligibleForBE = false;
    let targetStopLoss = currentStopLoss;
    const pipsMoved = orderType === 'BUY' ? (currentPrice - entryPrice) : (entryPrice - currentPrice);

    if (activationPips && pipsMoved >= activationPips) {
        isEligibleForBE = true;
        targetStopLoss = entryPrice; 
    }

    return res.json({
        status: 'SUCCESS',
        breakevenTriggered: isEligibleForBE,
        recommendedStopLoss: targetStopLoss,
        pipsInFavor: pipsMoved.toFixed(5),
        message: isEligibleForBE ? 'Posición protegida en Breakeven.' : 'Pendiente de alcanzar umbral BE.'
    });
});

// Estado del clúster y enrutamiento SPA
app.get('/health', (req, res) => {
    res.status(200).send('OK - Quantscrow Financial Core Operational');
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 [QUANTSCROW CORE]: Sistema Financiero Activo en puerto ${PORT}`);
});
