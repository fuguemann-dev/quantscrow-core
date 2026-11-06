// services/metaapiService.js
const MetaApi = require('metaapi.cloud-sdk').default;

// Variables para mantener la conexión activa en memoria
let connection = null;
let account = null;

async function conectarMetaAPI(token, accountId) {
    try {
        // 1. Inicializar el SDK con tu token
        const api = new MetaApi(token);
        
        // 2. Obtener la cuenta
        account = await api.metatraderAccountApi.getAccount(accountId);
        
        // 3. Esperar a que la cuenta esté conectada (si no lo está, la despliega)
        if (account.state !== 'DEPLOYED') {
            console.log("Desplegando cuenta en MetaAPI...");
            await account.deploy();
        }
        
        await account.waitConnected();
        
        // 4. Crear la conexión RPC para enviar órdenes
        connection = account.getRPCConnection();
        await connection.connect();
        await connection.waitSynchronized();
        
        console.log(`✅ MetaAPI Conectado: ${accountId}`);
        return { success: true, message: "Conectado a MetaAPI" };
        
    } catch (error) {
        console.error("🚨 Error conectando a MetaAPI:", error.message);
        return { success: false, error: error.message };
    }
}

async function obtenerPrecioActual(simbolo) {
    if (!connection) {
        throw new Error("No hay conexión activa a MetaAPI");
    }
    try {
        const price = await connection.getSymbolPrice(simbolo);
        return { bid: price.bid, ask: price.ask };
    } catch (error) {
        console.error(`Error obteniendo precio de ${simbolo}:`, error.message);
        return null;
    }
}

module.exports = { conectarMetaAPI, obtenerPrecioActual };
