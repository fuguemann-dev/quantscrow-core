// job-sniper/jobsniper.js
require('dotenv').config();
const Parser = require('rss-parser');
const parser = new Parser();

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Palabras clave
const PALABRAS_CLAVE = ['node', 'api', 'automatizacion', 'backend', 'scraping', 'express', 'desarrollador'];

// 🔥 LA MAGIA: Múltiples fuentes de ofertas
const FEEDS = [
    'https://weworkremotely.com/categories/remote-programming-jobs.rss',
    'https://remotive.com/remote-jobs/feed/software-dev',
    'https://remoteok.com/remote-dev-jobs.rss',
    'https://himalayas.app/jobs/rss/software-development'
];

async function escanearTrabajos() {
    try {
        console.log("🔎 Escaneando múltiples fuentes de trabajo...");
        
        for (const url of FEEDS) {
            try {
                console.log(`Revisando: ${url}`);
                const feed = await parser.parseURL(url);
                
                for (const item of feed.items) {
                    const titulo = item.title.toLowerCase();
                    const descripcion = item.contentSnippet ? item.contentSnippet.toLowerCase() : '';
                    
                    const esRelevante = PALABRAS_CLAVE.some(palabra => 
                        titulo.includes(palabra) || descripcion.includes(palabra)
                    );

                    if (esRelevante) {
                        await enviarAlertaTelegram(item.title, item.link);
                        await new Promise(r => setTimeout(r, 1500)); // Pausa para no saturar
                    }
                }
            } catch (err) {
                console.log(`Error leyendo el feed ${url}: ${err.message}`);
            }
        }
        console.log("✅ Escaneo completo finalizado.");
    } catch (error) {
        console.error("❌ Error general:", error.message);
    }
}
// ... (Deja igual tu función enviarAlertaTelegram y el arranque del script)
