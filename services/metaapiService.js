// services/metaapiService.js
const MetaApi = require('metaapi.cloud-sdk').default;

let connection = null;
let account = null;

async function conectarMetaAPI(token, accountId) {
    try {
        const api = new MetaApi(token);
        account = await api.metatraderAccountApi.getAccount(accountId);
        
        if (account.state !== 'DEPLOYED') {
            await account.deploy();
        }
        await account.waitConnected();
        
        connection = account.getRPCConnection();
        await connection.connect();
        await connection.waitSynchronized();
        
        return { success: true, message: "Conectado a MetaAPI" };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// 🔥 NUEVA FUNCIÓN: Obtener precio en tiempo real
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

// 🔥 NUEVA FUNCIÓN: Disparar la orden al bróker
async function ejecutarOrden(simbolo, tipo, lote, sl, tp) {
    if (!connection) throw new Error("No hay conexión activa a MetaAPI");
    try {
        const options = {
            symbol: simbolo,
            volume: lote,
            type: tipo, // 'ORDER_TYPE_BUY' o 'ORDER_TYPE_SELL'
            stopLoss: sl,
            takeProfit: tp
        };
        
        // Envía la orden al mercado
        const result = await connection.createMarketOrder(simbolo, tipo, lote, sl, tp);
        return { success: true, orderId: result.orderId };
    } catch (error) {
        console.error("Error al ejecutar orden:", error.message);
        return { success: false, error: error.message };
    }
}

module.exports = { conectarMetaAPI, obtenerPrecioActual, ejecutarOrden };
