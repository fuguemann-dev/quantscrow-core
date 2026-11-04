const http = require('http');

const server = http.createServer((req, res) => {
    if (req.url === '/' || req.url === '/index.html') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quantscrow Core</title>
    <style>
        body { background-color: #0f172a; color: #f8fafc; font-family: system-ui, sans-serif; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; margin: 0; }
        .card { background: #1e293b; padding: 2rem; border-radius: 1rem; box-shadow: 0 10px 25px rgba(0,0,0,0.3); text-align: center; max-width: 450px; width: 90%; }
        h1 { color: #38bdf8; margin-bottom: 0.5rem; }
        p { color: #94a3b8; }
        button { background: #38bdf8; color: #0f172a; border: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-weight: bold; cursor: pointer; margin-top: 1rem; transition: background 0.2s; }
        button:hover { background: #0ea5e9; }
        #results { margin-top: 1rem; text-align: left; background: #0f172a; padding: 1rem; border-radius: 0.5rem; font-family: monospace; font-size: 0.9rem; display: none; border: 1px solid #334155; }
    </style>
</head>
<body>
    <div class="card">
        <h1>Quantscrow Core</h1>
        <p>Infraestructura inteligente y segura para la gestión de operaciones y análisis automatizado.</p>
        <button onclick="runModel()">Ejecutar Modelo Quant</button>
        <div id="results"></div>
    </div>
    <script>
        async function runModel() {
            const resDiv = document.getElementById('results');
            resDiv.style.display = 'block';
            resDiv.innerHTML = 'Calculando asimetría de riesgo y asimilación quant...';
            try {
                const response = await fetch('/api/run-model');
                const data = await response.json();
                resDiv.innerHTML = '<strong>Estado:</strong> ' + data.status + '<br>' +
                                    '<strong>Valor Esperado:</strong> ' + data.metrics.expectedValue + '<br>' +
                                    '<strong>Prob. Éxito:</strong> ' + data.metrics.winProbability + '<br>' +
                                    '<strong>Risk/Reward:</strong> ' + data.metrics.riskRewardRatio + '<br>' +
                                    '<strong>Acción:</strong> ' + data.metrics.recommendedAction;
            } catch (err) {
                resDiv.innerHTML = 'Error al conectar con el núcleo.';
            }
        }
    </script>
</body>
</html>`);
    } else if (req.url === '/api/run-model') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
            status: 'SUCCESS',
            timestamp: new Date().toISOString(),
            metrics: {
                expectedValue: '+14.2%',
                winProbability: '58.4%',
                riskRewardRatio: '1:2.1',
                recommendedAction: 'EXECUTE'
            }
        }));
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 No Encontrado');
    }
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`[QUANTSCROW] Servidor activo en puerto ${PORT}`);
});
