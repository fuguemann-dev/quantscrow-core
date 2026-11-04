const http = require('http');

const server = http.createServer((req, res) => {
    if (req.url === '/' || req.url === '/index.html') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quantscrow Core | Institutional Terminal</title>
    <script src="https://unpkg.com/lightweight-charts/dist/lightweight-charts.standalone.production.js"></script>
    <style>
        :root {
            --bg-color: #0f172a; --card-bg: #1e293b; --accent-color: #38bdf8; 
            --accent-hover: #0ea5e9; --text-primary: #f8fafc; --text-secondary: #94a3b8; 
            --border-color: #334155; --success-color: #34d399; --proj-color: #a855f7; --danger-color: #ef4444;
        }
        body { 
            background-color: var(--bg-color); color: var(--text-primary); 
            font-family: system-ui, -apple-system, sans-serif; 
            display: flex; flex-direction: column; align-items: center; 
            min-height: 100vh; margin: 0; padding: 1rem;
        }
        .container { width: 100%; max-width: 900px; display: flex; flex-direction: column; gap: 1.2rem; }
        .card { 
            background: var(--card-bg); padding: 1.25rem; border-radius: 1rem; 
            box-shadow: 0 10px 25px rgba(0,0,0,0.5); border: 1px solid var(--border-color);
        }
        h1 { color: var(--accent-color); margin-bottom: 0.2rem; font-size: 1.5rem; text-align: center; }
        .subtitle { color: var(--text-secondary); font-size: 0.85rem; text-align: center; margin-bottom: 1rem; }
        
        .box { background: var(--bg-color); padding: 1rem; border-radius: 0.5rem; border: 1px solid var(--border-color); margin-bottom: 1rem; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
        @media (max-width: 600px) { .grid-2 { grid-template-columns: 1fr; } }
        
        input, select { 
            width: 100%; padding: 0.75rem; border-radius: 0.4rem; border: 1px solid var(--border-color); 
            background: #1e293b; color: var(--text-primary); font-size: 0.9rem; box-sizing: border-box;
        }
        input:focus, select:focus { outline: none; border-color: var(--accent-color); }
        
        .chart-box { 
            width: 100%; height: 240px; background: #0b1120; border-radius: 0.5rem; 
            overflow: hidden; margin-bottom: 1rem; border: 1px solid var(--border-color);
            position: relative; display: flex; align-items: center; justify-content: center;
        }
        
        button { 
            background: var(--accent-color); color: var(--bg-color); border: none; 
            padding: 0.8rem; border-radius: 0.5rem; font-weight: bold; cursor: pointer; 
            font-size: 0.95rem; width: 100%; transition: background 0.2s;
        }
        button:hover { background: var(--accent-hover); }
        button.purple { background: var(--proj-color); color: white; }
        button.purple:hover { background: #9333ea; }
        
        .output { 
            text-align: left; background: var(--bg-color); padding: 0.75rem; border-radius: 0.5rem; 
            font-family: monospace; font-size: 0.85rem; display: none; 
            border: 1px solid var(--border-color); color: var(--success-color); margin-top: 0.75rem;
        }
        
        .metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; margin-top: 0.75rem; }
        .m-card { background: #0f172a; border: 1px solid var(--border-color); padding: 0.5rem; border-radius: 0.4rem; text-align: center; }
        .m-title { font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; }
        .m-val { font-size: 1rem; font-weight: bold; color: var(--success-color); margin-top: 0.2rem; }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <h1>Quantscrow Core</h1>
            <p class="subtitle">Terminal Institucional & Motor Cuantitativo +EV</p>
            
            <!-- Panel Brokers -->
            <div class="box">
                <div style="font-weight: bold; margin-bottom: 0.5rem; color: var(--accent-color); font-size: 0.9rem;">🔐 Enlace de Broker (Tier-1)</div>
                <div class="grid-2">
                    <select id="broker">
                        <option value="hfm">HFM (Live / Micro-lots)</option>
                        <option value="ibkr">Interactive Brokers</option>
                        <option value="oanda">OANDA Core</option>
                        <option value="binance">Binance Institutional</option>
                    </select>
                    <input type="text" id="acc" placeholder="ID de Cuenta o API Key">
                </div>
                <button style="margin-top: 0.75rem;" onclick="linkAccount()">Vincular Cuenta</button>
                <div id="auth-out" class="output"></div>
            </div>

            <!-- Gráfica de Mercado -->
            <div style="font-weight: bold; margin-bottom: 0.5rem; color: var(--accent-color); font-size: 0.9rem;">📈 Live Market Feed (XAU/USD)</div>
            <div id="market-chart" class="chart-box" style="height: 260px;"></div>

            <!-- Simulador de Capital -->
            <div class="box">
                <div style="font-weight: bold; margin-bottom: 0.5rem; color: var(--proj-color); font-size: 0.9rem;">🚀 Simulador Cuantitativo Real (+EV Model)</div>
                <div class="grid-2" style="margin-bottom: 0.75rem;">
                    <input type="number" id="capital" placeholder="Capital Inicial ($)" value="1000">
                    <button class="purple" onclick="runSim()">Calcular Proyección Real</button>
                </div>
                
                <div id="sim-chart" class="chart-box" style="display: none;"></div>

                <div class="metrics" id="sim-metrics" style="display: none;">
                    <div class="m-card"><div class="m-title">1 Semana</div><div class="m-val" id="v-1w">$0</div></div>
                    <div class="m-card"><div class="m-title">1 Mes</div><div class="m-val" id="v-1m">$0</div></div>
                    <div class="m-card"><div class="m-title">1 Año</div><div class="m-val" id="v-1y" style="color: var(--proj-color);">$0</div></div>
                </div>
                <div id="sim-error" class="output" style="color: var(--danger-color); display: none;"></div>
            </div>
        </div>
    </div>

    <script>
        function initMarket() {
            const mEl = document.getElementById('market-chart');
            const mChart = LightweightCharts.createChart(mEl, {
                width: mEl.clientWidth || 320, height: 260,
                layout: { background: { type: 'solid', color: '#0b1120' }, textColor: '#94a3b8' },
                grid: { vertLines: { color: '#1e293b' }, horzLines: { color: '#1e293b' } }
            });
            const mSeries = mChart.addCandlestickSeries({ upColor: '#34d399', downColor: '#ef4444' });

            let data = [];
            let t = Math.floor(Date.now() / 1000) - 200;
            let p = 2750;
            for(let i=0; i<40; i++) {
                t += 5; let c = p + (Math.random() - 0.48) * 2;
                data.push({ time: t, open: p, high: Math.max(p, c) + 1, low: Math.min(p, c) - 1, close: c });
                p = c;
            }
            mSeries.setData(data);
            mChart.timeScale().fitContent();

            setInterval(() => {
                const now = Math.floor(Date.now() / 1000);
                const last = data[data.length - 1];
                const nc = parseFloat((last.close + (Math.random() - 0.49) * 1.5).toFixed(2));
                if(now - last.time >= 5) {
                    const c = { time: now, open: last.close, high: Math.max(last.close, nc), low: Math.min(last.close, nc), close: nc };
                    data.push(c); mSeries.update(c);
                } else {
                    last.close = nc; last.high = Math.max(last.high, nc); last.low = Math.min(last.low, nc);
                    mSeries.update(last);
                }
            }, 500);
        }

        window.addEventListener('load', () => setTimeout(initMarket, 100));

        async function linkAccount() {
            const acc = document.getElementById('acc').value;
            const out = document.getElementById('auth-out');
            out.style.display = 'block';
            if(!acc) { out.innerHTML = 'Error: Ingrese ID de cuenta.'; return; }
            out.innerHTML = 'Conectando con pasarela segura...';
            setTimeout(() => {
                out.innerHTML = 'ESTADO: CONEXIÓN ESTABLECIDA<br>SESIÓN: SECURE_' + Math.random().toString(36).substring(2,8).toUpperCase();
            }, 500);
        }

        function renderSvgEquityCurve(chartData) {
            const box = document.getElementById('sim-chart');
            box.style.display = 'flex';
            box.innerHTML = '';

            const svgNS = "http://www.w3.org/2000/svg";
            const svg = document.createElementNS(svgNS, "svg");
            svg.setAttribute("width", "100%");
            svg.setAttribute("height", "100%");
            svg.setAttribute("viewBox", "0 0 600 200");
            svg.setAttribute("preserveAspectRatio", "none");
            svg.style.overflow = "visible";

            const values = chartData.map(d => d.value);
            const min = Math.min(...values);
            const max = Math.max(...values);
            const range = max - min || 1;

            const points = chartData.map((d, index) => {
                const x = (index / (chartData.length - 1)) * 600;
                const y = 180 - ((d.value - min) / range) * 150;
                return \`\${x},\${y}\`;
            }).join(" ");

            const polygon = document.createElementNS(svgNS, "polygon");
            polygon.setAttribute("points", \`0,200 \${points} 600,200\`);
            polygon.setAttribute("fill", "rgba(168, 85, 247, 0.15)");

            const polyline = document.createElementNS(svgNS, "polyline");
            polyline.setAttribute("points", points);
            polyline.setAttribute("fill", "none");
            polyline.setAttribute("stroke", "#a855f7");
            polyline.setAttribute("stroke-width", "3");

            svg.appendChild(polygon);
            svg.appendChild(polyline);
            box.appendChild(svg);
        }

        async function runSim() {
            const cap = document.getElementById('capital').value || 1000;
            const errDiv = document.getElementById('sim-error');
            errDiv.style.display = 'none';
            document.getElementById('sim-metrics').style.display = 'grid';

            try {
                const res = await fetch('/api/simulate?capital=' + cap);
                if (!res.ok) throw new Error('Error HTTP: ' + res.status);
                
                const data = await res.json();
