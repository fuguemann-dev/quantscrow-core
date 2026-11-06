// server.js
const express = require('express');
const path = require('path');
const config = require('./src/config');
const { isKillzoneActive, evaluateSignal } = require('./src/quantEngine');
const { checkDailyRisk } = require('./src/riskManager');
const { supabase } = require('./src/supabaseClient');
// 🔥 IMPORTACIÓN DE METAAPI
const { conectarMetaAPI } = require('./services/metaapiService'); 

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// ENDPOINT DE ESTADO
// ==========================================
app.get('/api/status', (req, res) => {
    res.json({
        server: config.server.location,
        status: "ONLINE",
        time_est: new Date().toLocaleString("en-US", { timeZone: "America/New_York" }),
        db: "SUPABASE_SYNC"
    });
});

// ==========================================
// 🔥 ENDPOINT DE CONEXIÓN A METAAPI
// ==========================================
app.post('/api/connect-metaapi', async (req, res) => {
    const { token, accountId } = req.body;
    
    if (!token || !accountId) {
        return res.status(400).json({ error: "Faltan credenciales de MetaAPI" });
    }

    try {
        const result = await conectarMetaAPI(token, accountId);
        if (result.success) {
            res.json({ mensaje: "Conexión exitosa a MetaAPI" });
        } else {
            res.status(500).json({ error: result.error });
        }
    } catch (error) {
        res.status(500).json({ error: "Error interno del servidor al conectar a MetaAPI." });
    }
});

// ==========================================
// ENDPOINT PRINCIPAL (Evaluar Trade)
// ==========================================
app.post('/api/evaluar', async (req, res) => {
    try {
        const payload = req.body;
        const userId = process.env.MASTER_USER_ID || "00000000-0000-0000-0000-000000000000"; 

        if (!isKillzoneActive()) {
            return res.status(403).json({ error: "Sistema en pausa: Fuera de Killzone (Londres/NY)." });
        }

        const riskCheck = await checkDailyRisk(userId);
        if (!riskCheck.canTrade) {
            return res.status(403).json({ error: `Kill Switch Activado: ${riskCheck.reason}` });
        }

        const evaluation = evaluateSignal(payload);

        if (evaluation.status === "ABORT") {
            return res.status(400).json({ error: evaluation.reason });
        }

        let loteFinal = evaluation.data.lote * riskCheck.factorLote;
        loteFinal = Math.max(0.01, loteFinal);

        const { data, error } = await supabase.from('trades').insert([{
            user_id: userId,
            par: payload.par,
            tipo: 'PENDIENTE',
            lote: loteFinal,
            precio_entrada: payload.precioActual || 1.0,
            sl: payload.slTecnico || 0,
            tp: payload.tpLiquidez || 0,
            ev_calculado: evaluation.data.ev,
            rd: evaluation.data.rd
        }]).select();

        if (error) throw new Error("Fallo al guardar en Supabase: " + error.message);

        res.json({
            mensaje: "DISPARO AUTORIZADO",
            detalles: {
                lote: loteFinal,
                probabilidad: (evaluation.data.pFinal * 100).toFixed(2) + '%',
                expectedValue: evaluation.data.ev.toFixed(3),
                ratioRR: evaluation.data.rd.toFixed(2)
            }
        });

    } catch (error) {
        console.error("🚨 Error en el motor:", error.message);
        res.status(500).json({ error: "Fallo interno del servidor." });
    }
});

// ==========================================
// INICIO DEL SERVIDOR
// ==========================================
const PORT = process.env.PORT || config.server.port || 3000;
app.listen(PORT, () => {
    console.log(`🚀 QUANTSCROW CORE operando desde ${config.server.location}`);
    console.log(`🌐 Escuchando en el puerto ${PORT}`);
});
