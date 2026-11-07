// job-sniper/jobsniper.js
require('dotenv').config();
const Parser = require('rss-parser');
const parser = new Parser();

// 🔑 Traemos las llaves del archivo .env
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Palabras clave para filtrar los trabajos
const PALABRAS_CLAVE = ['node', 'api', 'automatizacion', 'backend', 'scraping', 'express'];

async function escanearTrabajos() {
    try {
        console.log("🔎 Escaneando ofertas de trabajo...");
        
        // Feed de ejemplo (We Work Remotely - Categoría Programación)
        const feed = await parser.parseURL('https://weworkremotely.com/categories/remote-programming-jobs.rss');
        
        let ofertasEncontradas = 0;

        for (const item of feed.items) {
            const titulo = item.title.toLowerCase();
            const descripcion = item.contentSnippet.toLowerCase();
            
            // Verificamos si el trabajo coincide con tus habilidades
            const esRelevante = PALABRAS_CLAVE.some(palabra => 
                titulo.includes(palabra) || descripcion.includes(palabra)
            );

            if (esRelevante) {
                ofertasEncontradas++;
                await enviarAlertaTelegram(item.title, item.link);
                // Pausa de 1 segundo para no saturar la API de Telegram
                await new Promise(r => setTimeout(r, 1000));
            }
        }

        if (ofertasEncontradas === 0) {
            console.log("😴 No se encontraron ofertas nuevas con tus palabras clave hoy.");
        } else {
            console.log(`✅ Escaneo terminado. Se enviaron ${ofertasEncontradas} alertas.`);
        }

    } catch (error) {
        console.error("❌ Error escaneando trabajos:", error.message);
    }
}

async function enviarAlertaTelegram(titulo, link) {
    const mensaje = `🚨 *¡Oferta de Trabajo Encontrada!* 🚨\n\n*Puesto:* ${titulo}\n*Link:* ${link}\n\n👉 *Acción:* Entra, revisa si aplica y usa tu perfil de Ingeniero Backend.`;
    
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: mensaje,
                parse_mode: 'Markdown'
            })
        });
        
        if (res.ok) {
            console.log(`📱 Alerta enviada: ${titulo}`);
        } else {
            console.error(`❌ Error de Telegram: ${res.status}`);
        }
    } catch (error) {
        console.error("❌ Error enviando a Telegram:", error.message);
    }
}

// Arrancamos el escáner
escanearTrabajos();
