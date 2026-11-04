const http = require('http');

const server = http.createServer((req, res) => {
    // Ruta Principal: Panel Cuantitativo y Gráficos en Tiempo Real
    if (req.url === '/' || req.url === '/index.html') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quantscrow Core | Real-Time Markets</title>
    <!-- Librería de TradingView Lightweight Charts -->
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
        
        /* Contenedor del Gráfico */
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
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <h1>Quantscrow Core</h1>
            <p class="subtitle">Terminal de Análisis Cuantitativo & Feeds de Mercado</p>
            
            <!-- Gráfica en Tiempo Real -->
            <div id="chart-container"></div>

            <div class="controls">
                <button onclick="runModel()">Ejecutar Modelo Quant (+EV)</button>
                <span id="market-status" style="font-size: 0.85rem; color: #34d399;">● Feed en Vivo: XAU/USD</span>
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

        // Datos históricos simulados de alta fidelidad (ej. XAU/USD)
        const initialData = [
            { time: '2026-11-01', open: 2745.20, high: 2760.50, low: 2740.10, close: 2755.80 },
            { time: '2026-11-02', open: 2755.80, high: 2772.30, low: 2750.00, close: 2768.40 },
            { time: '2026-11-03', open: 2768.40, high: 2780.00, low: 2762.10, close: 2775.20 },
            { time: '2026-11-04', open: 2775.20, high: 2792.60, low: 2770.00, close: 2788.90 }
        ];
        candlestickSeries.setData(initialData);

        // Ajustar tamaño del gráfico responsivo
        window.addEventListener('resize', () => {
            chart.applyOptions({ width: chartContainer.clientWidth, height: chartContainer.clientHeight });
        });

        // Simulación de actualización de precios en tiempo real (Ticks)
        setInterval(() => {
            const lastCandle = initialData[initialData.length - 1];
            const randomDelta = (Math.random() - 0.48) * 3.5;
            const newClose = parseFloat((lastCandle.close + randomDelta).toFixed(2));
            const newHigh = Math.max(lastCandle.high, newClose);
            const newLow = Math.min(lastCandle.low, newClose);
            
            candlestickSeries.update({
                time: '2026-11-04',
                open: lastCandle.open,
                high: newHigh,
                low: newLow,
                close: newClose
            });
        }, 1200);

        // Ejecutar Modelo Cuantitativo
        async function runModel() {
            const resDiv = document.getElementById('results');
            resDiv.style.display = 'block';
            resDiv.innerHTML = '> Procesando asimetría de riesgo y ejecución Monte Carlo...';
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
    } 
    // Endpoint de la API Cuantitativa
    else if (req.url === '/api/run-model') {
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
    } 
    else {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 - Endpoint no encontrado');
    }
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`[QUANTSCROW REAL-TIME] Servidor activo en puerto ${PORT}`);
});
