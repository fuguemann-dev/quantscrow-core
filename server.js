const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());

// Servir interfaz visual y recursos estáticos
app.use(express.static(path.join(__dirname)));

// Filtro de Killzones Institucionales (UTC)
function esHorarioKillzone() {
    const ahora = new Date();
    const horaUTC = ahora.getUTCHours();
    const minutoUTC = ahora.getUTCMinutes();
    const horaDecimal = horaUTC + (minutoUTC / 60);

    const esLondres = horaDecimal >= 7.0 && horaDecimal <= 10.0;
    const esNuevaYork = horaDecimal >= 12.0 && horaDecimal <= 15.0;

    return esLondres || esNuevaYork;
}

// Sistema de auditoría en CSV
function registrarAuditoria(ticketId, tipo, entrada, tp, sl, resultado, balanceFinal) {
    try {
        const timestamp = new Date().toISOString();
        const linea = `${timestamp},${ticketId},${tipo},${entrada},${tp},${sl},${resultado},${balanceFinal}\n`;
        
        if (!fs.existsSync('auditoria_trades.csv')) {
            const encabezado = "Timestamp,TicketID,Tipo,Entrada,TakeProfit,StopLoss,ResultadoUSD,BalanceFinal\n";
            fs.writeFileSync('auditoria_trades.csv', encabezado);
        }
        fs.appendFileSync('auditoria_trades.csv', linea);
    } catch (e) {
        console.error("Error al escribir auditoría CSV:", e.message);
    }
}

// Comando maestro de ejecución cuantitativa
async function ejecutarComandoMaestro(tipoOrden = 'BUY', balanceActual = 1000.0) {
    if (!esHorarioKillzone()) {
        return { exito: false, razon: "Fuera de horario operativo" };
    }

    try {
        const riesgoUSD = balanceActual * 0.01;
        const ticketId = `QC_${Math.floor(Math.random() * 900000) + 100000}`;
        const precioEntrada = 2650.50; 
        
        const distanciaTP = 21 * 0.01;
        const distanciaSL = 10 * 0.01;
        const tp = tipoOrden === 'BUY' ? precioEntrada + distanciaTP : precioEntrada - distanciaTP;
        const sl = tipoOrden === 'BUY' ? precioEntrada - distanciaSL : precioEntrada + distanciaSL;

        registrarAuditoria(ticketId, tipoOrden, precioEntrada, tp, sl, "PENDIENTE", balanceActual);

        return { exito: true, ticket: ticketId, entrada: precioEntrada, stopLoss: sl, takeProfit: tp, riesgoUSD };
    } catch (error) {
        return { exito: false, error: error.message };
    }
}

// Endpoints
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: "ONLINE",
        project: "Quantscrow Core",
        mode: "Production Stable Engine",
        killzoneActive: esHorarioKillzone(),
        timestamp: new Date().toISOString()
    });
});

app.post('/api/ejecutar', async (req, res) => {
    const { tipo = 'BUY', balance = 1000.0 } = req.body;
    const resultado = await ejecutarComandoMaestro(tipo, balance);
    res.json(resultado);
});

// Arranque del servidor
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`[QUANTSCROW CORE] 🚀 Servidor estable en puerto ${PORT}`);
});
