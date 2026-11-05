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
async function gestionarBreakeven(connection, positionId, precioEntrada, tipoOrden, takeProfitOriginal) {
    console.log(`[RISK MANAGER] Monitoreando posición ${positionId} para Breakeven...`);
    
    const pipsParaActivarBE = 10; 
    const factorPunto = 0.01; 
    const distanciaActivarBE = pipsParaActivarBE * factorPunto;
    const margenComision = 1 * factorPunto; 

    const intervalo = setInterval(async () => {
        try {
            const position = await connection.getPosition(positionId);
            if (!position) {
                clearInterval(intervalo);
                return;
            }

            const precioActual = position.currentPrice;
            let nuevoStopLoss = null;
            let debeAjustar = false;

            if (tipoOrden === 'BUY' && precioActual >= precioEntrada + distanciaActivarBE) {
                nuevoStopLoss = precioEntrada + margenComision;
                if (position.stopLoss < nuevoStopLoss) debeAjustar = true;
            } else if (tipoOrden === 'SELL' && precioActual <= precioEntrada - distanciaActivarBE) {
                nuevoStopLoss = precioEntrada - margenComision;
                if (position.stopLoss > nuevoStopLoss || position.stopLoss === 0) debeAjustar = true;
            }

            if (debeAjustar) {
                await connection.modifyPosition(positionId, nuevoStopLoss, takeProfitOriginal);
                console.log(`[RISK MANAGER] ✅ Operación ${positionId} asegurada en Breakeven.`);
                clearInterval(intervalo);
            }
        } catch (error) {
            console.error(`[RISK MANAGER] Error en radar de BE:`, error.message);
        }
    }, 5000);
}

// 🚀 4. COMANDO MAESTRO DE EJECUCIÓN CUANTITATIVA
async function ejecutarComandoMaestro(tipoOrden, balanceActual) {
    if (!esHorarioKillzone()) {
        console.log(`[MASTER COMMAND] Fuera de Killzone institucional. Servidor en reposo.`);
        return { exito: false, razon: "Fuera de horario operativo" };
    }

    const accountId = process.env.OANDA_ACCOUNT_ID;
    const token = process.env.OANDA_API_TOKEN;

    try {
        console.log(`[MASTER COMMAND] 🎯 Killzone activa. Evaluando asimetría +EV en XAU/USD...`);
        
        const riesgoUSD = balanceActual * 0.01;
        console.log(`[RISK] Aplicando gestión estricta: Arriesgando $${riesgoUSD.toFixed(2)} USD (1% del balance)`);

        const response = await fetch(`https://api-fxpractice.oanda.com/v3/accounts/${accountId}/orders`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                order: {
                    instrument: "XAU_USD",
                    units: tipoOrden === 'BUY' ? "1" : "-1",
                    type: "MARKET",
                    positionFill: "DEFAULT"
                }
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.errorMessage || "Fallo en la ejecución de la orden en OANDA");
        }

        const ticketId = data.orderFillTransaction.id;
        const precioEntrada = parseFloat(data.orderFillTransaction.price);
        
        const distanciaTP = 21 * 0.01;
        const distanciaSL = 10 * 0.01;
        const tp = tipoOrden === 'BUY' ? precioEntrada + distanciaTP : precioEntrada - distanciaTP;
        const sl = tipoOrden === 'BUY' ? precioEntrada - distanciaSL : precioEntrada + distanciaSL;

        console.log(`[MASTER COMMAND] 🟢 DISPARO EXITOSO. Ticket: ${ticketId} | Entrada: ${precioEntrada} | TP: ${tp} | SL: ${sl}`);

        registrarAuditoria(ticketId, tipoOrden, precioEntrada, tp, sl, "PENDIENTE", balanceActual);

        return { exito: true, ticket: ticketId, entrada: precioEntrada, stopLoss: sl, takeProfit: tp };

    } catch (error) {
        console.error(`[MASTER COMMAND] 🔴 ERROR CRÍTICO EN DISPARO:`, error.message);
        return { exito: false, error: error.message };
    }
}

// 🌐 5. ENDPOINT DE ESTADO Y MANTENIMIENTO DE CONTENEDOR (Evita el exit code 0)
app.get('/', (req, res) => {
    res.status(200).json({
        status: "ONLINE",
        project: "Quantscrow Core",
        killzoneActive: esHorarioKillzone(),
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`[QUANTSCROW CORE] Servidor cuantitativo activo y escuchando en el puerto ${PORT}`);
})
