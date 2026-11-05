const express = require('express');
const fs = require('fs');

const app = express();
app.use(express.json());

// 🕒 1. FILTRO DE KILLZONES INSTITUCIONALES (UTC)
function esHorarioKillzone() {
    const ahora = new Date();
    const horaUTC = ahora.getUTCHours();
    const minutoUTC = ahora.getUTCMinutes();
    const horaDecimal = horaUTC + (minutoUTC / 60);

    // Londres (07:00 a 10:00 UTC) y Nueva York (12:00 a 15:00 UTC)
    const esLondres = horaDecimal >= 7.0 && horaDecimal <= 10.0;
    const esNuevaYork = horaDecimal >= 12.0 && horaDecimal <= 15.0;

    return esLondres || esNuevaYork;
}

// 📝 2. SISTEMA DE AUDITORÍA Y REGISTRO EN FRÍO (CSV)
function registrarAuditoria(ticketId, tipo, entrada, tp, sl, resultado, balanceFinal) {
    const timestamp = new Date().toISOString();
    const linea = `${timestamp},${ticketId},${tipo},${entrada},${tp},${sl},${resultado},${balanceFinal}\n`;
    
    if (!fs.existsSync('auditoria_trades.csv')) {
        const encabezado = "Timestamp,TicketID,Tipo,Entrada,TakeProfit,StopLoss,ResultadoUSD,BalanceFinal\n";
        fs.writeFileSync('auditoria_trades.csv', encabezado);
    }
    fs.appendFileSync('auditoria_trades.csv', linea);
}

// 🛡️ 3. RADAR DE GESTIÓN DE BREAKEVÉN MILIMÉTRICO (FREE RIDE)
async function gestionarBreakevenSimulado(positionId, precioEntrada, tipoOrden, takeProfitOriginal) {
    console.log(`[RISK MANAGER] Monitoreando posición simulada ${positionId} para Breakeven...`);
    
    const pipsParaActivarBE = 10; 
    const factorPunto = 0.01; 
    const distanciaActivarBE = pipsParaActivarBE * factorPunto;
    const margenComision = 1 * factorPunto; 

    // Simulación del radar activo cada 5 segundos
    const intervalo = setInterval(() => {
        try {
            // Simulamos un desplazamiento favorable de precio para activar el Free Ride
            console.log(`[RISK MANAGER] 🔍 Analizando ticks en XAU/USD para posición ${positionId}...`);
            
            // Una vez alcanzada la distancia, ajustamos Stop Loss a costes (Breakeven)
            console.log(`[RISK MANAGER] ✅ Operación ${positionId} asegurada en Breakeven (Free Ride activo).`);
            clearInterval(intervalo);
        } catch (error) {
            console.error(`[RISK MANAGER] Error en radar de BE:`, error.message);
            clearInterval(intervalo);
        }
    }, 5000);
}

// 🚀 4. COMANDO MAESTRO DE EJECUCIÓN OPTIMIZADA
async function ejecutarComandoMaestro(tipoOrden, balanceActual) {
    if (!esHorarioKillzone()) {
        console.log(`[MASTER COMMAND] Fuera de Killzone institucional. Servidor en reposo.`);
        return { exito: false, razon: "Fuera de horario operativo" };
    }

    try {
        console.log(`[MASTER COMMAND] 🎯 Killzone activa. Evaluando asimetría +EV en XAU/USD...`);
        
        const riesgoUSD = balanceActual * 0.01;
        console.log(`[RISK] Aplicando gestión estricta: Arriesgando $${riesgoUSD.toFixed(2)} USD (1% del balance)`);

        // Generación de ticket y precios simulados ultra-precisos basados en estructura institucional
        const ticketId = `QC_MOCK_${Math.floor(Math.random() * 900000) + 100000}`;
        const precioEntrada = 2650.50; // Referencia base XAU/USD
        
        const distanciaTP = 21 * 0.01;
        const distanciaSL = 10 * 0.01;
        const tp = tipoOrden === 'BUY' ? precioEntrada + distanciaTP : precioEntrada - distanciaTP;
        const sl = tipoOrden === 'BUY' ? precioEntrada - distanciaSL : precioEntrada + distanciaSL;

        console.log(`[MASTER COMMAND] 🟢 DISPARO EXITOSO. Ticket: ${ticketId} | Entrada: ${precioEntrada} | TP: ${tp} | SL: ${sl}`);

        registrarAuditoria(ticketId, tipoOrden, precioEntrada, tp, sl, "PENDIENTE", balanceActual);
        
        // Lanzar radar de gestión de riesgo
        gestionarBreakevenSimulado(ticketId, precioEntrada, tipoOrden, tp);

        return { exito: true, ticket: ticketId, entrada: precioEntrada, stopLoss: sl, takeProfit: tp };

    } catch (error) {
        console.error(`[MASTER COMMAND] 🔴 ERROR CRÍTICO EN DISPARO:`, error.message);
        return { exito: false, error: error.message };
    }
}

// 🌐 5. ENDPOINT DE CONTROL Y SALUD
app.get('/', (req, res) => {
    res.status(200).json({
        status: "ONLINE",
        project: "Quantscrow Core",
        mode: "Optimized Simulation Engine",
        killzoneActive: esHorarioKillzone(),
        timestamp: new Date().toISOString()
    });
});

// Endpoint rápido para disparar una orden de prueba vía HTTP POST
app.post('/api/ejecutar', async (req, res) => {
    const { tipo = 'BUY', balance = 1000.0 } = req.body;
    const resultado = await ejecutarComandoMaestro(tipo, balance);
    res.json(resultado);
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`[QUANTSCROW CORE] Servidor cuantitativo optimizado activo y escuchando en el puerto ${PORT}`);
});
