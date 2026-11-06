// server.js
const express = require('express');
const path = require('path');
const config = require('./src/config');
const { isKillzoneActive, evaluateSignal } = require('./src/quantEngine');
const { checkDailyRisk } = require('./src/riskManager');
const { supabase } = require('./src/supabaseClient');

const app = express();

// Middleware para parsear JSON
app.use(express.json());

// ✅ Servir archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// ENDPOINT DE ESTADO (Para la barra superior)
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
// ENDPOINT PRINCIPAL (El Motor de Disparo)
// ==========================================
app.post('/api/evaluar', async (req, res) => {
    try {
        const payload = req.body;
        
        // ID del usuario maestro (leído desde las variables de entorno de DigitalOcean)
        const userId = process.env.MASTER_USER_ID || "00000000-0000-0000-0000-000000000000"; 

        // 1. Validar Killzone
        if (!isKillzoneActive()) {
            return res.status(403).json({ error: "Sistema en pausa: Fuera de Killzone (Londres/NY)." });
        }

        // 2. Validar Riesgo Diario (Consulta a Supabase)
        const riskCheck = await checkDailyRisk(userId);
        if (!riskCheck.canTrade) {
            return res.status(403).json({ error: `Kill Switch Activado: ${riskCheck.reason}` });
        }

        // 3. Evaluar Matemática Cuantitativa (Monte Carlo, Kelly, EV)
        const evaluation = evaluateSignal(payload);

        if (evaluation.status === "ABORT") {
            return res.status(400).json({ error: evaluation.reason });
        }

        // 4. Aplicar factor de reducción por racha (si aplica)
        let loteFinal = evaluation.data.lote * riskCheck.factorLote;
        // Aseguramos que el lote no sea menor al micro lote permitido
        loteFinal = Math.max(0.01, loteFinal);

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

        if (error) {
            console.error("🚨 Error de Supabase:", error);
            throw new Error("Fallo al guardar en base de datos.");
        }

        // 6. Respuesta Exitosa al Frontend
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
        console.error("🚨 Error Crítico en el motor:", error.message);
        res.status(500).json({ error: "Fallo interno del servidor. Revisar logs en DigitalOcean." });
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
