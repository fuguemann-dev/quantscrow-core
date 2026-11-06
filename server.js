const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const MetaApi = require('metaapi-cloud-sdk').default || require('metaapi-cloud-sdk');

const app = express();
const PORT = process.env.PORT || 8080;

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://dcorrxkkaqulfaerapzj.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;
const metaApiToken = process.env.VITE_META_API_TOKEN || process.env.META_API_TOKEN;

const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;
const api = metaApiToken ? new MetaApi(metaApiToken) : null;

app.use(express.json());
app.use(express.static(__dirname));

app.get('/health', (req, res) => {
    res.status(200).send('OK - Quantscrow Engine Running');
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 [QUANTSCROW CORE]: Servidor activo en puerto ${PORT}`);
});
