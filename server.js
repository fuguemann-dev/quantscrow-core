const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { conectarNuevaCuentaMT5 } = require('./services/metaapiService');
const MetaApi = require('metaapi-cloud-sdk').default;

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8080;
const META_TOKEN = process.env.META_API_TOKEN;
const META_ACCOUNT_ID = process.env.META_ACCOUNT_ID; // Cuenta master inicial

// Inicializar Supabase si las credenciales existen
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// Validación de Killzones (Londres / Nueva York en UTC)
function esHorarioKillzone() {
  const ahora = new Date();
  const horaUTC = ahora.getUTCHours();
  const esLondres = horaUTC >= 7 && horaUTC < 10;
  const esNY = horaUTC >= 13 && horaUTC < 16;
  return esLondres || esNY;
}

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({ estado: 'ONLINE', multicuenta: !!supabase, timestamp: new Date() });
});

// Endpoint principal de ejecución
app.post('/api/ejecutar', async (req, res) => {
  const force = req.query.force === 'true';
  if (!force && !esHorarioKillzone()) {
    return res.json({ exito: false, razon: 'Fuera de horario operativo (Killzone inactiva)' });
  }

  try {
    const api = new MetaApi(META_TOKEN);

    // 1. Si Supabase está conectado, dispara a TODAS las cuentas activas de inversores
    if (supabase) {
      const { data: cuentas } = await supabase.from('cuentas_trading').select('*').eq('estado', 'ACTIVA');
      if (cuentas && cuentas.length > 0) {
        cuentas.forEach(async (c) => {
          try {
            const account = await api.accountApi.getAccount(c.meta_account_id);
            const connection = account.getRPCConnection();
            await connection.connect();
            await connection.waitSynchronized();
            await connection.createMarketBuyOrder('XAUUSD', 0.01, { stopLoss: 10, takeProfit: 21 });
          } catch (err) {
            console.error(`Error procesando cuenta ${c.login_mt5}:`, err.message);
          }
        });
        return res.json({ exito: true, mensaje: `Disparo masivo enviado a ${cuentas.length} cuentas activas` });
      }
    }

    // 2. Fallback: Disparo a la cuenta única por defecto
    const account = await api.accountApi.getAccount(META_ACCOUNT_ID);
    const connection = account.getRPCConnection();
    await connection.connect();
    await connection.waitSynchronized();

    const result = await connection.createMarketBuyOrder('XAUUSD', 0.01, {
      stopLoss: 10,
      takeProfit: 21
    });

    res.json({ exito: true, ticket: result.orderId });
  } catch (error) {
    res.status(500).json({ exito: false, error: error.message });
  }
});

// Endpoint para vincular nuevas cuentas dinámicamente desde el Admin
app.post('/api/admin/vincular-cuenta', async (req, res) => {
  const { inversorId, loginMT5, passwordMT5, servidorBroker, nombreInversor } = req.body;

  const metaRes = await conectarNuevaCuentaMT5({
    login: loginMT5,
    password: passwordMT5,
    server: servidorBroker,
    nombreInversor: nombreInversor || 'Inversor'
  });

  if (!metaRes.exito) {
    return res.status(400).json({ exito: false, error: metaRes.error });
  }

  if (supabase) {
    await supabase.from('cuentas_trading').insert([{
      inversor_id: inversorId,
      meta_account_id: metaRes.metaAccountId,
      login_mt5: loginMT5,
      servidor_broker: servidorBroker,
      estado: 'ACTIVA'
    }]);
  }

  res.json({ exito: true, metaAccountId: metaRes.metaAccountId });
});

app.listen(PORT, () => {
  console.log(`[QUANTSCROW CORE] 🚀 Motor Multicuenta escuchando en puerto ${PORT}`);
});
