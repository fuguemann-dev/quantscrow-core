const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());

app.use(express.static(path.join(__dirname)));

// Memoria en tiempo real para auditoría rápida
const historialAuditoria = [];

function esHorarioKillzone() {
    const ahora = new Date();
    const horaUTC = ahora.getUTCHours();
    const minutoUTC = ahora.getUTCMinutes();
    const horaDecimal = horaUTC + (minutoUTC / 60);

    const esLondres = horaDecimal >= 7.0 && horaDecimal <= 10.0;
    const esNuevaYork = horaDecimal >= 12.0 && horaDecimal <= 15.0;

    return esLondres || esNuevaYork;
}

function registrarAuditoria(ticketId, tipo, entrada, tp, sl, riesgoAplicado, balanceFinal) {
    const timestamp = new Date().toISOString();
    const registro = {
        timestamp,
        ticketId,
        tipo,
        entrada,
        tp,
        sl,
        riesgo: `Riesgo_${riesgoAplicado}%`,
        balanceFinal
    };
    
    // Guardar en memoria para acceso inmediato web
    historialAuditoria.unshift(registro);

    try {
        const linea = `${timestamp},${ticketId},${tipo},${entrada},${tp},${sl},Riesgo_${riesgoAplicado}%,${balanceFinal}\n`;
        if (!fs.existsSync('auditoria_trades.csv')) {
            const encabezado = "Timestamp,TicketID,Tipo,Entrada,TakeProfit,StopLoss,FactorRiesgo,BalanceFinal\n";
            fs.writeFileSync('auditoria_trades.csv', encabezado);
        }
        fs.appendFileSync('auditoria_trades.csv', linea);
    } catch (e) {
        console.error("Error al escribir auditoría CSV:", e.message);
    }
}

function calcularExposicionMatematica(balanceActual, rachaNegativaActual = 0) {
    let factorRiesgo = 1.0; 
    if (rachaNegativaActual >= 3) {
        factorRiesgo = 0.5; 
    }
    const riesgoUSD = balanceActual * (factorRiesgo / 100);
    return { riesgoUSD, factorRiesgo };
}

async function ejecutarComandoMaestro(tipoOrden = 'BUY', balanceActual = 1000.0) {
    if (!esHorarioKillzone()) {
        return { exito: false, razon: "Fuera de horario operativo (Killzone inactiva)" };
    }

    try {
        const { riesgoUSD, factorRiesgo } = calcularExposicionMatematica(balanceActual);
        const ticketId = `QC_${Math.floor(Math.random() * 900000) + 100000}`;
        const precioEntrada = 2650.50; 
        
        const distanciaTP = 21 * 0.01;
        const distanciaSL = 10 * 0.01;
        const tp = tipoOrden === 'BUY' ? precioEntrada + distanciaTP : precioEntrada - distanciaTP;
        const sl = tipoOrden === 'BUY' ? precioEntrada - distanciaSL : precioEntrada + distanciaSL;

        registrarAuditoria(ticketId, tipoOrden, precioEntrada, tp, sl, factorRiesgo, balanceActual);

        return { 
            exito: true, 
            ticket: ticketId, 
            entrada: precioEntrada, 
            stopLoss: sl, 
            takeProfit: tp, 
            riesgoUSD,
            asimetria: "+EV & R:R 1:2.1" 
        };
    } catch (error) {
        return { exito: false, error: error.message };
    }
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: "ONLINE",
        project: "Quantscrow Core",
        mode: "Mathematical Hardened Engine",
        killzoneActive: esHorarioKillzone(),
        timestamp: new Date().toISOString()
    });
});

app.get('/api/auditoria', (req, res) => {
    res.json(historialAuditoria);
});

app.post('/api/ejecutar', async (req, res) => {
    const { tipo = 'BUY', balance = 1000.0 } = req.body;
    const resultado = await ejecutarComandoMaestro(tipo, balance);
    res.json(resultado);
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`[QUANTSCROW CORE] 🚀 Motor matemático ejecutándose impecablemente en puerto ${PORT}`);
});
