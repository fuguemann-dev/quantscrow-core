const http = require('http');

const server = http.createServer((req, res) => {
    if (req.url === '/' || req.url === '/index.html') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Quantscrow Core | Institutional Engine</title>
    <script src="https://unpkg.com/lightweight-charts/dist/lightweight-charts.standalone.production.js"></script>
    <style>
        :root {
            --bg-color: #0f172a; --card-bg: #1e293b; --accent-color: #38bdf8; 
            --accent-hover: #0ea5e9; --text-primary: #f8fafc; --text-secondary: #94a3b8; 
            --border-color: #334155; --success-color: #34d399; --danger-color: #ef4444; --proj-color: #a855f7;
        }
        body { 
            background-color: var(--bg-color); color: var(--text-primary); 
            font-family: system-ui, -apple-system, sans-serif; 
            display: flex; flex-direction: column; align-items: center; 
            min-height: 100vh; margin: 0; padding: 1rem;
        }
        .container { width: 100%; max-width: 950px; display: flex; flex-direction: column; gap: 1.25rem; }
        .card { 
            background: var(--card-bg); padding: 1.25rem; border-radius: 1rem; 
            box-shadow: 0 10px 25px rgba(0,0,0,0.5); border: 1px solid var(--border-color);
        }
        h1 { color: var(--accent-color); margin-bottom: 0.2rem; font-size: 1.6rem; text-align: center; }
        .subtitle { color: var(--text-secondary); font-size: 0.85rem; text-align: center; margin-bottom: 1.2rem; }
        
        .section-title { font-weight: bold; margin-bottom: 0.75rem; font-size: 0.95rem; display: flex; align-items: center; gap: 0.5rem; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        @media (max-width: 600px) { .grid-2 { grid-template-columns: 1fr; } }
        
        input, select { 
            width: 100%; padding: 0.75rem; border-radius: 0.4rem; border: 1px solid var(--border-color); 
            background: #0f172a; color: var(--text-primary); font-size: 0.9rem; box-sizing: border-box;
        }
        input:focus, select:focus { outline: none; border-color: var(--accent-color); }
        
        .chart-box { 
            width: 100%; height: 300px; background: #0b1120; border-radius: 0.5rem; 
            overflow: hidden; margin-bottom: 1rem; border: 1px solid var(--border-color);
        }
        
        button { 
            background: var(--accent-color); color: var(--bg-color); border: none; 
            padding: 0.85rem; border-radius: 0.5rem; font-weight: bold; cursor: pointer; 
            font-size: 1rem; width: 100%; transition: background 0.2s;
        }
        button:hover { background: var(--accent-hover); }
        button.purple { background: var(--proj-color); color: white; }
        button.purple:hover { background: #9333ea; }
        
        .metric-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; margin-top: 1rem; }
        .metric-card { background: #0f172a; border: 1px solid var(--border-color); padding: 0.75rem; border-radius: 0.5rem; text-align: center; }
        .metric-title { font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; }
        .metric-value { font-size: 1.1rem; font-weight: bold; color: var(--success-color); margin-top: 0.25rem; }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <h1>Quantscrow Core</h1>
            <p class="subtitle">SaaS Cuantitativo Institucional | Powered by +EV Monte Carlo</p>
            
            <!-- Panel 1: Vinculación de Brokers Tier 1 -->
            <div style="background: var(--bg-color); padding: 1rem; border-radius: 0.5rem; border: 1px solid var(--border-color); margin-bottom: 1.5rem;">
                <div class="section-title" style="color: var(--accent-color);">🔐 Ecosistema de Brokers (Regulación Tier-1)</div>
                <div class="grid-2">
                    <select id="broker-select">
                        <optgroup label="Brokers Institucionales & Forex (FCA/ASIC)">
                            <option value="ibkr">Interactive Brokers (Pro)</option>
                            <option value="oanda">OANDA (Core Pricing)</option>
                            <option value="ig">IG Markets</option>
                            <option value="pepperstone">Pepperstone (Razor)</option>
                            <option value="hfm" selected>HFM (Live / Micro-lots)</option>
                            <option value="exness">Exness (Zero Spread)</option>
                        </optgroup>
                        <optgroup label="Criptoactivos">
                            <option value="binance">Binance Institucional</option>
                            <option value="coinbase">Coinbase Advanced</option>
                        </optgroup>
                    </select>
                    <input type="text" id="account-id" placeholder="ID de Cuenta o API Key">
                </div>
            </div>

            <!-- Panel 2: Live Market -->
            <div class="section-title" style="color: var(--accent-color);">📈 Live Market Feed (XAU/USD)</div>
            <div id="market-chart" class="chart-box" style="height: 250px;"></div>
            
            <!-- Panel 3: Simulador de Capital -->
            <div style="background: var(--bg-color); padding: 1rem; border-radius: 0.5rem; border: 1px solid var(--border-color); margin-top: 1.5rem;">
                <div class="section-title" style="color: var(--proj-color);">🚀 Simulador Cuantitativo de Capital (Equity Curve)</div>
                <div class="grid-2" style="margin-bottom: 1rem;">
                    <input type="number" id="initial-capital" placeholder="Capital Inicial (USD)" value="1000">
                    <button class="purple" onclick="runProjection()">Proyectar Rendimiento 1A</button>
                </div>
                
                <div id="projection-chart" class="chart-box"></div>
                
                <div class="metric-cards" id="proj-metrics" style="display: none;">
                    <div class="metric-card">
                        <div class="metric-title">1 Semana</div>
                        <div class="metric-value" id="m-1w">$0.00</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-title">1 Mes</div>
                        <div class="metric-value" id="m-1m">$0.00</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-title">1 Año</div>
                        <div class="metric-value" id="m-1y" style="color: var(--proj-color);">$0.00</div>
                    </div>
                </div>
            </div>
            
        </div>
    </div>

    <script>
        let currentMarketPrice = 2750.00;
        let marketSeries, projSeries;
        let projChart;

        // Inicialización Forzada de Gráficos
        function initCharts() {
            // 1. Gráfica de Mercado (Velas)
            const mktContainer = document.getElementById('market-chart');
            const mChart = LightweightCharts.createChart(mktContainer, {
                width: mktContainer.clientWidth, height: 250,
                layout: { background: { type: 'solid', color: '#0b1120' }, textColor: '#94a3b8' },
                grid: { vertLines: { color: '#1e293b' }, horzLines: { color: '#1e293b' } },
                timeScale: { borderColor: '#334155', timeVisible: true }
            });
            marketSeries = mChart.addCandlestickSeries({ upColor: '#34d399', downColor: '#ef4444', borderVisible: false, wickUpColor: '#34d399', wickDownColor: '#
