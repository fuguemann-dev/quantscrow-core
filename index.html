const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const MetaApi = require('metaapi.cloud-sdk').default || require('metaapi.cloud-sdk');

const app = express();
const PORT = process.env.PORT || 8080;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const metaApiToken = process.env.META_API_TOKEN;

const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;
const api = metaApiToken ? new MetaApi(metaApiToken) : null;

app.use(express.json());
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', system: 'Quantscrow Core' });
});

// Endpoint para listar cuentas conectadas desde MetaApi
app.get('/api/cuentas', async (req, res) => {
  try {
    if (!api) {
      return res.status(200).json({ success: true, accounts: [] });
    }
    const accountApi = api.metatraderAccountApi;
    const accounts = await accountApi.getAccounts();
    
    const formattedAccounts = accounts.map(acc => ({
      id: acc.id,
      name: acc.name,
      login: acc.login,
      server: acc.server,
      state: acc.state,
      connectionStatus: acc.connectionStatus
    }));

    return res.status(200).json({ success: true, accounts: formattedAccounts });
  } catch (err) {
    console.error('[QUANTSCROW ERROR]', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Endpoint crítico de aprovisionamiento MT5
app.post('/api/vincular-cuenta', async (req, res) => {
  const { alias, login, password, server } = req.body;

  if (!login || !password || !server) {
    return res.status(400).json({ 
      success: false, 
      error: 'Parámetros incompletos. Se requiere login, contraseña y servidor.' 
    });
  }

  try {
    let metaAccountId = null;

    if (api) {
      const account = await api.metatraderAccountApi.createAccount({
        name: alias || `MT5-${login}`,
        type: 'cloud',
        login: login.toString(),
        password: password,
        server: server,
        platform: 'mt5',
        magic: 100001
      });
      metaAccountId = account.id;
    }

    if (supabase) {
      await supabase.from('cuentas_mt5').insert([{
        alias: alias || `MT5-${login}`,
        login: login,
        server: server,
        meta_account_id: metaAccountId,
        created_at: new Date()
      }]);
    }

    return res.status(200).json({
      success: true,
      message: 'Cuenta vinculada correctamente en el clúster.',
      metaAccountId
    });

  } catch (err) {
    console.error('[QUANTSCROW ERROR]', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`[QUANTSCROW CORE] Motor Activo en puerto ${PORT}`);
})
