// server.js
const express = require('express');
const path = require('path');
const config = require('./src/config');
const { isKillzoneActive, evaluateSignal } = require('./src/quantEngine');
const { checkDailyRisk } = require('./src/riskManager');
const { supabase } = require('./src/supabaseClient');
const { conectarMetaAPI, obtenerPrecioActual, ejecutarOrden } = require('./services/metaapiService');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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

// 🔥 ENDPOINT DE EJECUCIÓN MODIFICADO
app.post('/api/evaluar', async (req, res) => {
    try {
        const payload = req.body;
        const userId = process.env.MASTER_USER_ID || "00000000-0000-0000-0000-000000000000"; 

        if (!isKillzoneActive()) return res.status(403).json({ error: "Sistema en pausa: Fuera de Killzone." });

        // 1. Obtener el precio REAL de MetaAPI
        const precioReal = await obtenerPrecioActual(payload.par);
        if (!precioReal) return res.status(500).json({ error: "No se pudo obtener el precio del bróker." });

        // Aquí usamos el precio real para calcular el SL y TP
        const precioActual = precioReal.ask; // Asumiendo compra para el ejemplo
        const slCalculado = precioActual - (payload.atr * config.quant.atrMultiplierSL);
        const tpCalculado = precioActual + (payload.atr * config.quant.atrMultiplierSL * 2); // R:R 2:1

        // 2. Evaluar la matemática
        const riskCheck = await checkDailyRisk(userId);
        if (!riskCheck.canTrade) return res.status(403).json({ error: `Kill Switch: ${riskCheck.reason}` });

        const evaluation = evaluateSignal({
            precioActual,
            slTecnico: slCalculado,
            tpLiquidez: tpCalculado,
            probBase: payload.probBase,
            atr: payload.atr,
            balance: payload.balance
        });

        if (evaluation.status === "ABORT") return res.status(400).json({ error: evaluation.reason });

        let loteFinal = Math.max(0.01, evaluation.data.lote * riskCheck.factorLote);

        // 3. 🔥 DISPARAR LA ORDEN AL BRÓKER
        const ordenResult = await ejecutarOrden(payload.par, 'ORDER_TYPE_BUY', loteFinal, slCalculado, tpCalculado);
        
        if (!ordenResult.success) {
            return res.status(500).json({ error: `Fallo al ejecutar orden: ${ordenResult.error}` });
        }

        // 4. Guardar en Supabase
        await supabase.from('trades').insert([{
            user_id: userId, par: payload.par, tipo: 'ABIERTA',
            lote: loteFinal, precio_entrada: precioActual, sl: slCalculado, tp: tpCalculado,
            ev_calculado: evaluation.data.ev, rd: evaluation.data.rd
        }]);

        res.json({
            mensaje: "¡ORDEN EJECUTADA EN EL BRÓKER!",
            detalles: {
                precio: precioActual.toFixed(5),
                lote: loteFinal,
                ordenId: ordenResult.orderId,
                probabilidad: (evaluation.data.pFinal * 100).toFixed(2) + '%',
                ev: evaluation.data.ev.toFixed(3)
            }
        });

    } catch (error) {
        console.error("🚨 Error en el motor:", error.message);
        res.status(500).json({ error: "Fallo interno del servidor." });
    }
});

const PORT = process.env.PORT || config.server.port || 3000;
app.listen(PORT, () => {
    console.log(`🚀 QUANTSCROW CORE operando desde ${config.server.location}`);
    console.log(`🌐 Escuchando en el puerto ${PORT}`);
});
