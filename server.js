// server.js
const express = require('express');
const path = require('path');
const cron = require('node-cron');
const config = require('./src/config');
const { isKillzoneActive, evaluateSignal } = require('./src/quantEngine');
const { checkDailyRisk } = require('./src/riskManager');
const { supabase } = require('./src/supabaseClient');
const { conectarMetaAPI, obtenerPrecioActual, ejecutarOrden } = require('./services/metaapiService');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Portafolio de activos a escanear
const PORTAFOLIO = ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD'];

app.get('/api/status', (req, res) => {
    res.json({ server: config.server.location, status: "ONLINE", time_est: new Date().toLocaleString("en-US", { timeZone: "America/New_York" }), db: "SUPABASE_SYNC" });
});

app.post('/api/connect-metaapi', async (req, res) => {
    const { token, accountId } = req.body;
    if (!token || !accountId) return res.status(400).json({ error: "Faltan credenciales" });
    const result = await conectarMetaAPI(token, accountId);
    if (result.success) res.json({ mensaje: "Conexión exitosa a MetaAPI" });
    else res.status(500).json({ error: result.error });
});

// 🔥 EL ESCÁNER DE MERCADO
async function escanearMercado() {
    console.log("🔎 Iniciando escaneo de portafolio...");
    let mejorOportunidad = null;

    for (const par of PORTAFOLIO) {
        try {
            const precio = await obtenerPrecioActual(par);
            if (!precio) continue;

            // Simulamos un ATR del 0.15% del precio para el ejemplo
            const atrSimulado = precio.ask * 0.0015; 
            
            // Evaluamos la señal
            const evalResult = evaluateSignal({
                precioActual: precio.ask,
                atr: atrSimulado,
                balance: 10000,
                probBase: 0.50 // Asumimos 50% de probabilidad
            });

            if (evalResult.status === "EXECUTE" && evalResult.data.ev > 0.15) {
                // Si el EV es mayor al actual, actualizamos la mejor oportunidad
                if (!mejorOportunidad || evalResult.data.ev > mejorOportunidad.ev) {
                    mejorOportunidad = { par, precio: precio.ask, ...evalResult.data };
                }
            }
        } catch (e) {
            console.error(`Error escaneando ${par}:`, e.message);
        }
    }

    // Si encontramos una oportunidad, disparamos
    if (mejorOportunidad) {
        console.log(`🎯 Mejor oportunidad encontrada: ${mejorOportunidad.par} (EV: ${mejorOportunidad.ev})`);
        const ordenResult = await ejecutarOrden(mejorOportunidad.par, 'ORDER_TYPE_BUY', mejorOportunidad.lote, mejorOportunidad.slTecnico, mejorOportunidad.tpLiquidez);
        
        if (ordenResult.success) {
            await supabase.from('trades').insert([{
                user_id: process.env.MASTER_USER_ID,
                par: mejorOportunidad.par,
                tipo: 'ABIERTA',
                lote: mejorOportunidad.lote,
                precio_entrada: mejorOportunidad.precio,
                sl: mejorOportunidad.slTecnico,
                tp: mejorOportunidad.tpLiquidez,
                ev_calculado: mejorOportunidad.ev
            }]);
            return { success: true, mensaje: `Orden ejecutada en ${mejorOportunidad.par}`, detalles: mejorOportunidad };
        }
    }
    
    return { success: false, mensaje: "No se encontraron oportunidades con +EV." };
}

// Endpoint manual (Por si quieres forzar el escaneo desde la web)
app.post('/api/escanear', async (req, res) => {
    if (!isKillzoneActive()) return res.status(403).json({ error: "Fuera de Killzone." });
    const result = await escanearMercado();
    res.json(result);
});

// 🔥 AUTOMATIZACIÓN (CRONJOB)
// Se ejecuta cada 15 minutos entre las 3:00 AM y las 11:00 AM EST de Lunes a Viernes
cron.schedule('*/15 3-11 * * 1-5', async () => {
    console.log("⏰ Cronjob activado: Evaluando mercado...");
    if (isKillzoneActive()) {
        await escanearMercado();
    }
}, {
    scheduled: true,
    timezone: "America/New_York" // Hora de Atlanta
});

const PORT = process.env.PORT || config.server.port || 3000;
app.listen(PORT, () => {
    console.log(`🚀 QUANTSCROW CORE operando desde ${config.server.location}`);
    console.log(`🌐 Escuchando en el puerto ${PORT}`);
    console.log(`🤖 Cronjob de escaneo activado (Lun-Vie, 3AM-11AM EST)`);
});
