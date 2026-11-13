const MetaApi = require('metaapi.cloud-sdk').default;
let connection = null;
let account = null;
let heartbeatInterval = null;

async function conectarMetaAPI(token, accountId) {
    try {
        const api = new MetaApi(token);
        account = await api.metatraderAccountApi.getAccount(accountId);

        if (account.state !== 'DEPLOYED') {
            await account.deploy();
        }
        await account.waitConnected();

        connection = account.getRPCConnection({isCentAccount: true});
        await connection.connect();
        await connection.waitSynchronized();

        if (heartbeatInterval) clearInterval(heartbeatInterval);
        heartbeatInterval = setInterval(async () => {
            try {
                if (connection) await connection.getAccountInformation();
            } catch (e) {
                console.error("Heartbeat falló:", e.message);
            }
        }, 30000);

        return { success: true, message: "Conectado a MetaAPI" };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function obtenerPrecioActual(simbolo) {
    if (!connection) throw new Error("No hay conexión activa a MetaAPI");
    try {
        const price = await connection.getSymbolPrice(simbolo);
        return { bid: price.bid, ask: price.ask };
    } catch (error) {
        console.error(`Error obteniendo precio de ${simbolo}:`, error.message);
        return null;
    }
}
async function obtenerBalanceCentavos() {
    if (!connection) throw new Error("No hay conexión activa a MetaAPI");
    try {
        const accountInfo = await connection.getAccountInformation();
        const balanceReal = accountInfo.balance * 100;
        return balanceReal;
    } catch (error) {
        console.error("Error obteniendo balance de cuenta:", error.message);
        return null;
    }
}

async function obtenerATRReal(simbolo) {
    if (!connection) throw new Error("No hay conexión activa a MetaAPI");
    try {
        // 🔥 FIX: Usamos 'account' en lugar de 'connection'
        const candles = await account.getHistoricalCandles(simbolo, '15m', new Date(), 15);
        
        if (!candles || candles.length < 14) throw new Error("Faltan velas para ATR.");

        let trSum = 0;
        for (let i = 1; i < candles.length; i++) {
            const high = candles[i].high;
            const low = candles[i].low;
            const prevClose = candles[i - 1].close;
            const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
            trSum += tr;
        }
        return trSum / 14;
    } catch (error) {
        console.error(`Error calculando ATR para ${simbolo}:`, error.message);
        return null;
    }
}

async function obtenerBalanceReal() {
    if (!connection) throw new Error("No hay conexión activa a MetaAPI");
    try {
        const accountInfo = await connection.getAccountInformation();
        return accountInfo.balance / 100;

    } catch (error) {
        console.error("Error obteniendo balance real:", error.message);
        return null;
    }
}

async function ejecutarOrden(simbolo, tipo, lote, sl, tp) {
    if (!connection) throw new Error("No hay conexión activa a MetaAPI");
    try {
        let result;
        if (tipo === 'ORDER_TYPE_BUY') {
            result = await connection.createMarketBuyOrder(simbolo, lote, sl, tp);
        } else {
            result = await connection.createMarketSellOrder(simbolo, lote, sl, tp);
        }
        return { success: true, orderId: result.orderId };
    } catch (error) {
        console.error("Error al ejecutar orden:", error.message);
        return { success: false, error: error.message };
    }
}

module.exports = { conectarMetaAPI, obtenerPrecioActual, obtenerATRReal, ejecutarOrden, obtenerBalanceReal };
