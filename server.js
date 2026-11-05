const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { MetaApi } = require('metaapi.cloud-sdk');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware para procesar solicitudes JSON y servir la interfaz estática
app.use(express.json());
app.use(express.static(__dirname));

// Ruta principal para servir el panel visual (index.html)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Endpoint de verificación de estado para DigitalOcean
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', system: 'Quantscrow Core' });
});

app.listen(PORT, () => {
  console.log(`[QUANTSCROW CORE] Motor Autónomo activo y escuchando en puerto ${PORT}`);
});
