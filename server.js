const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const MetaApi = require('metaapi.cloud-sdk').default || require('metaapi.cloud-sdk');

const app = express();
const PORT = process.env.PORT || 8080;

// Inicialización de credenciales de entorno seguras
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const metaApiToken = process.env.META_API_TOKEN;

const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;
const api = metaApiToken ? new MetaApi(metaApiToken) : null;

app.use(express.json());
app.use(express.static(__dirname));

// Ruta principal para servir la terminal frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Endpoint de verificación de salud del sistema
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', system: 'Quantscrow Core' });
});

// Endpoint crítico: Aprovisionamiento dinámico MT5 vía MetaApi
app.post('/api/vincular-cuenta', async (req, res) => {
  const { alias, login, password, server } = req.body;

  if (!login || !password || !server) {
    return res.status(400).json({ 
      success: false, 
      error: 'Parámetros incompletos. Se requiere login, contraseña y servidor del broker.' 
    });
  }

  try {
    let metaAccountId = null;

    if (api) {
      console.log(`[QUANTSCROW CORE] Iniciando aprovisionamiento en cloud para MT5 Login: ${login}`);
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
      console.log(`[QUANTSCROW CORE] Cuenta provisionada con éxito. MetaApi ID: ${metaAccountId}`);
    } else {
      console.warn('[QUANTSCROW CORE] Advertencia: META_API_TOKEN no detectado en entorno.');
    }

    // Persistencia opcional en base de datos Supabase
    if (supabase) {
      const { error } = await supabase
        .from('cuentas_mt5')
        .insert([{
          alias: alias || `MT5-${login}`,
          login: login,
          server: server,
          meta_account_id: metaAccountId,
          created_at: new Date()
        }]);

      if (error) throw error;
    }

    return res.status(200).json({
      success: true,
      message: 'Cuenta vinculada y aprovisionada correctamente en el clúster.',
      metaAccountId
    });

  } catch (err) {
    console.error('[QUANTSCROW ERROR]', err.message);
    return res.status(500).json({ 
      success: false, 
      error: `Fallo en el aprovisionamiento con MetaApi: ${err.message}` 
    });
  }
});

app.listen(PORT, () => {
  console.log(`[QUANTSCROW CORE] Motor Autónomo activo y escuchando en puerto ${PORT}`);
});
