const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const MetaApi = require('metaapi.cloud-sdk').default || require('metaapi.cloud-sdk');

const app = express();
const PORT = process.env.PORT || 8080;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY; // Asegúrate de que sea la SERVICE_ROLE key o anon key válida
const metaApiToken = process.env.META_API_TOKEN;

const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;
const api = metaApiToken ? new MetaApi(metaApiToken) : null;

app.use(express.json());
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Endpoint de Autenticación de Usuario
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!supabase) {
    return res.status(500).json({ success: false, error: 'Base de datos no configurada en el clúster.' });
  }

  try {
    // Autenticación nativa con Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) throw error;

    return res.status(200).json({ success: true, session: data.session });
  } catch (err) {
    console.error('[AUTH ERROR]', err.message);
    return res.status(401).json({ success: false, error: 'Credenciales inválidas o usuario no registrado.' });
  }
});

// Endpoint de Cuentas (Protegido lógicamente en frontend)
app.get('/api/cuentas', async (req, res) => {
  try {
    if (!supabase) return res.status(200).json({ success: true, accounts: [] });

    const { data, error } = await supabase
      .from('cuentas_mt5')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formattedAccounts = (data || []).map(acc => ({
      id: acc.meta_account_id || acc.id,
      name: acc.alias,
      login: acc.login,
      server: acc.server,
      state: 'deployed',
      connectionStatus: 'connected'
    }));

    return res.status(200).json({ success: true, accounts: formattedAccounts });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Endpoint de Aprovisionamiento
app.post('/api/vincular-cuenta', async (req, res) => {
  const { alias, login, password, server } = req.body;

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

    return res.status(200).json({ success: true, metaAccountId });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`[QUANTSCROW CORE] Motor Activo en puerto ${PORT}`);
});
