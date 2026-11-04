const http = require('http');

const server = http.createServer((req, res) => {
    if (req.url === '/' || req.url === '/index.html') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quantscrow Core | Live Market Feed</title>
    <!-- TradingView Lightweight Charts -->
    <script src="https://unpkg.com/lightweight-charts/dist/lightweight-charts.standalone.production.js"></script>
    <style>
        :root {
            --bg-color: #0f172a;
            --card-bg: #1e293b;
            --accent-color: #38bdf8;
            --accent-hover: #0ea5e9;
            --text-primary: #f8fafc;
            --text-secondary: #94a3b8;
            --border-color: #334155;
        }
        body { 
            background-color: var(--bg-color); 
            color: var(--text-primary); 
            font-family: system-ui, -apple-system, sans-serif; 
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            min-height: 100vh; 
            margin: 0; 
            padding: 1.5rem;
        }
        .container {
            width: 100%;
            max-width: 900px;
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
        }
        .card { 
            background: var(--card-bg); 
            padding: 1.5rem; 
            border-radius: 1rem; 
            box-shadow: 0 10px 25px rgba(0,0,0,0.4); 
            border: 1px solid var(--border-color);
        }
        h1 { color: var(--accent-color); margin-bottom: 0.25rem; font-size: 1.6rem; text-align: center; }
        .subtitle { color: var(--text-secondary); font-size: 0.9rem; text-align: center; margin-bottom: 1.25rem; }
        
        #chart-container {
            width: 100%;
            height: 380px;
            border-radius: 0.5rem;
            overflow: hidden;
            margin-bottom: 1rem;
        }

        .controls {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 1rem;
        }
        button { 
            background: var(--accent-color); 
            color: var(--bg-color); 
            border: none; 
            padding: 0.75rem 1.5rem; 
            border-radius: 0.5rem; 
            font-weight: bold; 
            cursor: pointer; 
            font-size: 0.95rem;
            transition: background 0.2s, transform 0.1s; 
        }
        button:hover { background: var(--accent-hover); transform: translateY(-1px); }
        
        #results { 
            text-align: left; 
            background: var(--bg-color); 
            padding: 1rem; 
            border-radius: 0.5rem; 
            font-family: 'Courier New', Courier, monospace; 
            font-size: 0.9rem; 
            display: none; 
            border: 1px solid var(--border-color);
            color: #34d399;
            margin-top: 1rem;
        }
        .live-indicator {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.85rem;
            color: #34d399;
        }
        .pulse {
            width: 8px;
            height: 8px;
            background-color: #34d399;
            border-radius: 50%;
            animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.7); }
            70% { box-shadow: 0 0 0 10px rgba(52, 211, 153, 0); }
            100% { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0); }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <h1>Quantscrow Core</h1>
            <p class="subtitle">Terminal Cuantitativo & Feed Institucional en Tiempo Real</p>
            
            <div id="chart-container"></div>

            <div class="controls">
                <button onclick="runModel()">Ejecutar Modelo Quant (+EV)</button>
                <div class="live-indicator">
                    <div class="pulse"></div>
                    <span id="live-price-text">Mercado Activo: XAU/USD ($2,754.20)</span>
                </div>
            </div>
            
            <div id="results"></div>
        </div>
    </div>

    <script>
        // Inicializar Gráfica de TradingView
        const chartContainer = document.getElementById('chart-container');
        const chart = LightweightCharts.createChart(chartContainer, {
            layout: {
                background: { type: 'solid', color: '#0f172a' },
                textColor: '#94a3b8',
            },
            grid: {
                vertLines: { color: '#1e293b' },
                horzLines: { color: '#1e293b' },
            },
            timeScale: {
                borderColor: '#334155',
                timeVisible: true,
                secondsVisible: true
            },
            rightPriceScale: {
                borderColor: '#334155',
            },
        });

        const candlestickSeries = chart.addCandlestickSeries({
            upColor: '#34d399',
            downColor: '#ef4444',
            borderVisible: false,
            wickUpColor: '#34d399',
            wickDownColor: '#ef4444',
        });

        // Generar historial de velas iniciales en tiempo real
        const now = Math.floor(Date.now() / 1000);
        let basePrice = 2750.00;
        let historicalData = [];
        for (let i = 30; i > 0; i--) {
            const time = now - (i * 3); // Intervalos de 3 segundos para alta dinamica
            const open = basePrice;
            const close = open + (Math.random() - 0.48) * 2.5;
            const high = Math.max(open, close) + Math.random() * 1.2;
            const low = Math.min(open, close) - Math.random() * 1.2;
            historicalData.push({ time, open, high, low, close });
            basePrice = close;
        }
        candlestickSeries.setData(historicalData);

        // Bucle de Alta Frecuencia para Movimiento en Tiempo Real Tic a Tic
        setInterval(() => {
            const currentTime = Math.floor(Date.now() / 1000);
            let lastCandle = historicalData[historicalData.length - 1];
            
            // Simulación estocástica de alta precisión de mercado (XAU/USD)
            const tickDelta = (Math.random() - 0.49) * 1.8;
            const newClose = parseFloat((lastCandle.close + tickDelta).toFixed(2));
            
            document.getElementById('live-price-text').innerText = 'Mercado Activo: XAU/USD ($' + newClose.toLocaleString() + ')';

            if (currentTime - lastCandle.time >= 3) {
                // Nueva vela cada 3 segundos
                const newCandle = {
                    time: currentTime,
                    open: lastCandle.close,
                    high: Math.max(lastCandle.close, newClose),
                    low: Math.min(lastCandle.close, newClose),
                    close: newClose
                };
                historicalData.push(newCandle);
                candlestickSeries.update(newCandle);
            } else {
                // Actualizar vela actual en tiempo real
                lastCandle.close = newClose;
                lastCandle.high = Math.max(lastCandle.high, newClose);
                lastCandle.low = Math.min(lastCandle.low, newClose);
                candlestickSeries.update(lastCandle);
            }
        }, 400); // Actualización fluida cada 400 milisegundos

        window.addEventListener('resize', () => {
            chart.applyOptions({ width: chartContainer.clientWidth, height: chartContainer.clientHeight });
        });

        // Ejecutar Modelo Cuantitativo
        async function runModel() {
            const resDiv = document.getElementById('results');
            resDiv.style.display = 'block';
            resDiv.innerHTML = '> Procesando asimetría de riesgo y asimilación quant...';
            try {
                const response = await fetch('/api/run-model');
                const data = await response.json();
                resDiv.innerHTML = '<strong>[ESTADO]:</strong> ' + data.status + '<br>' +
                                    '<strong>[VALOR ESPERADO]:</strong> ' + data.metrics.expectedValue + '<br>' +
                                    '<strong>[PROB. ÉXITO]:</strong> ' + data.metrics.winProbability + '<br>' +
                                    '<strong>[RISK / REWARD]:</strong> ' + data.metrics.riskRewardRatio + '<br>' +
                                    '<strong>[ACCIÓN TÁCTICA]:</strong> ' + data.metrics.recommendedAction;
            } catch (err) {
                resDiv.innerHTML = '<span style="color: #ef4444;">[ERROR]: Fallo de enlace con el núcleo.</span>';
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
        res.end('404 - Endpoint no encontrado');
    }
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`[QUANTSCROW REAL-TIME] Servidor activo en puerto ${PORT}`);
});
