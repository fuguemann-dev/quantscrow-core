const express = require('express');
const path = require('path');
const cron = require('node-cron');
const config = require('./src/config');
const { isKillzoneActive, evaluateSignal } = require('./src/quantEngine');
const { checkDailyRisk } = require('./src/riskManager');
const { supabase } = require('./src/supabaseClient');
const { conectarMetaAPI, obtenerPrecioActual, obtenerATRReal, ejecutarOrden, obtenerBalanceReal } = require('./services/metaapiService');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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

async function escanearMercado() {
    console.log("Iniciando escaneo de portafolio...");
    let mejorOportunidad = null;
    const userId = process.env.MASTER_USER_ID;

    const balanceReal = await obtenerBalanceReal();
    if (balanceReal === null) {
        console.log("No se pudo obtener el balance. Abortando escaneo.");
        return { success: false, mensaje: "Error obteniendo balance de la cuenta." };
    }
    console.log(`Balance real detectado: $${balanceReal} USD`);

    const riskCheck = await checkDailyRisk(userId);
    if (!riskCheck.canTrade) {
        console.log(`Kill Switch: ${riskCheck.reason}`);
        return { success: false, mensaje: riskCheck.reason };
    }

    for (const par of PORTAFOLIO) {
        try {
            const precio = await obtenerPrecioActual(par);
            if (!precio) continue;

            const atrReal = await obtenerATRReal(par);
            if (!atrReal) continue;

            const evalResult = evaluateSignal({
                precioActual: precio.ask,
                atr: atrReal,
                balance: balanceReal,
                probBase: 0.50
            });

            if (evalResult.status === "EXECUTE" && evalResult.data.ev > config.quant.minEV) {
                if (!mejorOportunidad || evalResult.data.ev > mejorOportunidad.ev) {
                    mejorOportunidad = { par, precio: precio.ask, ...evalResult.data };
                }
            }
        } catch (e) {
            console.error(`Error escaneando ${par}:`, e.message);
        }
    }

    if (mejorOportunidad) {
        const { data: tradesAbiertos } = await supabase
            .from('trades')
            .select('id')
            .eq('par', mejorOportunidad.par)
            .eq('estado', 'ABIERTA')
            .limit(1);

        if (tradesAbiertos && tradesAbiertos.length > 0) {
            console.log(`Ya hay posición en ${mejorOportunidad.par}. Abortando.`);
            return { success: false, mensaje: "Posición abierta en el par." };
        }

        const loteFinal = Math.max(0.01, parseFloat((mejorOportunidad.lote * riskCheck.factorLote).toFixed(2)));

        console.log(`Oportunidad: ${mejorOportunidad.par} (EV: ${mejorOportunidad.ev}) | Lote: ${loteFinal}`);
        
        const ordenResult = await ejecutarOrden(mejorOportunidad.par, 'ORDER_TYPE_BUY', loteFinal, mejorOportunidad.slTecnico, mejorOportunidad.tpLiquidez);

        if (ordenResult.success) {
            await supabase.from('trades').insert([{
                user_id: userId,
                par: mejorOportunidad.par,
                tipo: 'ABIERTA',
                lote: loteFinal,
                precio_entrada: mejorOportunidad.precio,
                sl: mejorOportunidad.slTecnico,
                tp: mejorOportunidad.tpLiquidez,
                ev_calculado: mejorOportunidad.ev
            }]);
            return { success: true, mensaje: `Orden ejecutada en ${mejorOportunidad.par}`, detalles: { ...mejorOportunidad, lote: loteFinal } };
        }
    }

    return { success: false, mensaje: "No se encontraron oportunidades con +EV." };
}

app.post('/api/escanear', async (req, res) => {
    if (!isKillzoneActive()) return res.status(403).json({ error: "Fuera de Killzone." });
    const result = await escanearMercado();
    res.json(result);
});

cron.schedule('*/15 3-11 * * 1-5', async () => {
    console.log("Cronjob activado...");
    if (isKillzoneActive()) await escanearMercado();
}, { scheduled: true, timezone: "America/New_York" });

const PORT = process.env.PORT || config.server.port || 3000;
app.listen(PORT, () => {
    console.log(`QUANTSCROW CORE V2.0 en ${config.server.location}`);
    console.log(`Puerto ${PORT}`);
    console.log(`Cronjob activo (Lun-Vie, 3AM-11AM EST)`);
});
