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

// Inicialización segura y a prueba de fallos de MetaAPI
let api = null;
try {
    if (MetaApi && typeof MetaApi === 'function') {
        api = metaApiToken ? new MetaApi(metaApiToken) : null;
    } else if (MetaApi && MetaApi.default && typeof MetaApi.default === 'function') {
        api = metaApiToken ? new MetaApi.default(metaApiToken) : null;
    }
} catch (e) {
    console.warn('⚠️ [QUANTSCROW CORE]: MetaAPI inicializado en modo offline/seguro.');
}

app.use(express.json());
app.use(express.static(__dirname));

// ==========================================================
// 1. MÓDULO DE VALIDACIÓN DE KILLZONES (HORARIO INSTITUCIONAL)
// ==========================================================
function checkKillzone(currentTime = new Date()) {
    const hours = currentTime.getUTCHours();
    const minutes = currentTime.getUTCMinutes();
    const timeDecimal = hours + minutes / 60;
    
    const isLondon = timeDecimal >= 7.0 && timeDecimal < 10.0;
    const isNewYork = timeDecimal >= 12.0 && timeDecimal < 15.0;
    const isAsian = timeDecimal >= 0.0 && timeDecimal < 3.0;

    let activeKillzone = null;
    if (isLondon) activeKillzone = 'LONDON_KILLZONE';
    else if (isNewYork) activeKillzone = 'NEW_YORK_KILLZONE';
    else if (isAsian) activeKillzone = 'ASIAN_RANGE';

    return {
        active: activeKillzone !== null,
        session: activeKillzone || 'OUTSIDE_KILLZONE'
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
    } = req.body || {};

    let balance = initialBalance;
    let peak = initialBalance;
    let maxDrawdown = 0;
    let wins = 0;
    let losses = 0;

    for (let i = 0; i < iterations; i++) {
        const isWin = Math.random() < winRate;
        const riskAmount = balance * riskPerTrade;

        if (isWin) {
            balance += riskAmount * riskRewardRatio;
            wins++;
        } else {
            balance -= riskAmount;
            losses++;
        }

        if (balance > peak) {
            peak = balance;
        }

        const drawdown = (peak - balance) / peak;
        if (drawdown > maxDrawdown) {
            maxDrawdown = drawdown;
        }

        if (balance <= 0) {
            balance = 0;
            break;
        }
    }

    res.json({
        success: true,
        simulation: {
            iterations,
            finalBalance: Number(balance.toFixed(2)),
            netProfit: Number((balance - initialBalance).toFixed(2)),
            maxDrawdownPercent: Number((maxDrawdown * 100).toFixed(2)),
            winRateActual: Number(((wins / (wins + (wins + losses > 0 ? losses : 1))) * 100).toFixed(2))
        }
    });
});

// Ruta principal de estatus del núcleo
app.get('/api/status', (req, res) => {
    const killzone = checkKillzone();
    res.json({
        system: 'Quantscrow Core',
        status: 'ONLINE',
        mode: api ? 'INSTITUTIONAL_LIVE' : 'OFFLINE_SAFE',
        killzone,
        timestamp: new Date().toISOString()
    });
});

// Health check para DigitalOcean App Platform
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Inicialización del servidor
app.listen(PORT, () => {
    console.log(`🚀 [QUANTSCROW CORE]: Servidor ejecutándose en el puerto ${PORT}`);
})
