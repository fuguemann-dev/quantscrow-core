// server.js
const express = require('express');
const path = require('path');
const config = require('./src/config');
const { isKillzoneActive, evaluateSignal } = require('./src/quantEngine');
const { checkDailyRisk } = require('./src/riskManager');
const { supabase } = require('./src/supabaseClient');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); 
// Nota: Si tu index.html está en la raíz y no en /public, cámbialo a: app.use(express.static(__dirname));

// Endpoint de Estado (Para el panel de tu interfaz)
app.get('/api/status', (req, res) => {
    res.json({
        server: config.server.location,
        status: "ONLINE",
        time_est: new Date().toLocaleString("en-US", { timeZone: "America/New_York" }),
        db: "SUPABASE_SYNC"
    });
});

// Endpoint Principal (El Disparador)
app.post('/api/evaluar', async (req, res) => {
    try {
        const payload = req.body;
        // IMPORTANTE: Reemplaza esto con el UID real de tu usuario en Supabase Auth
        const userId = "TU-USER-ID-DE-SUPABASE"; 

        // 1. Validar Killzone
        if (!isKillzoneActive()) {
            return res.status(403).json({ error: "Sistema en pausa: Fuera de Killzone (Londres/NY)." });
        }

        // 2. Validar Riesgo Diario (Supabase)
        const riskCheck = await checkDailyRisk(userId);
        if (!riskCheck.canTrade) {
            return res.status(403).json({ error: `Kill Switch Activado: ${riskCheck.reason}` });
        }

        // 3. Evaluar Matemática Cuantitativa
        const evaluation = evaluateSignal(payload);

        if (evaluation.status === "ABORT") {
            return res.status(400).json({ error: evaluation.reason });
        }

        // 4. Aplicar factor de racha (si aplica)
        let loteFinal = evaluation.data.lote * riskCheck.factorLote;

        // 5. Guardar Trade en Supabase
        const { data, error } = await supabase.from('trades').insert([{
            user_id: userId,
            par: payload.par,
            tipo: 'PENDIENTE',
            lote: loteFinal,
            precio_entrada: payload.precioActual,
            sl: payload.slTecnico,
            tp: payload.tpLiquidez,
            ev_calculado: evaluation.data.ev,
            rd: evaluation.data.rd
        }]).select();

        if (error) throw new Error("Fallo al guardar en Supabase: " + error.message);

        res.json({
            mensaje: "DISPARO AUTORIZADO",
            detalles: {
                lote: loteFinal,
                riskUSD: (loteFinal * (evaluation.data.slDist * 10000 * 10)).toFixed(2),
                probabilidad: (evaluation.data.pFinal * 100).toFixed(2) + '%',
                expectedValue: evaluation.data.ev.toFixed(3),
                ratioRR: evaluation.data.rd.toFixed(2),
                racha_penalizada: riskCheck.factorLote < 1 ? "SI (Lote reducido 50%)" : "NO"
            }
        });

    } catch (error) {
        console.error("🚨 Error en el motor:", error);
        res.status(500).json({ error: "Fallo interno del servidor. Revisar logs." });
    }
});

app.listen(config.server.port, () => {
    console.log(`🚀 QUANTSCROW CORE operando desde ${config.server.location}`);
    console.log(`🌐 Escuchando en el puerto ${config.server.port}`);
});
