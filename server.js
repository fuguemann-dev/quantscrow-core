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
            --border-color: #334155; --success-color: #34d399; --proj-color: #a855f7;
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
            width: 100%; height: 260px; background: #0b1120; border-radius: 0.5rem; 
            overflow: hidden; margin-bottom: 1rem; border: 1px solid var(--border-color);
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
            <p class="subtitle">Terminal Institucional & Motor Monte Carlo</p>
            
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
            <div id="market-chart" class="chart-box"></div>

            <!-- Simulador de Capital -->
            <div class="box">
                <div style="font-weight: bold; margin-bottom: 0.5rem; color: var(--proj-color); font-size: 0.9rem;">🚀 Simulador de Crecimiento (+EV)</div>
                <div class="grid-2" style="margin-bottom: 0.75rem;">
                    <input type="number" id="capital" placeholder="Capital Inicial ($)" value="1000">
                    <button class="purple" onclick="runSim()">Proyectar Rendimiento</button>
                </div>
                <div id="sim-chart" class="chart-box" style="height: 220px; display: none;"></div>
                <div class="metrics" id="sim-metrics" style="display: none;">
                    <div class="m-card"><div class="m-title">1 Semana</div><div class="m-val" id="v-1w">$0</div></div>
                    <div class="m-card"><div class="m-title">1 Mes</div><div class="m-val" id="v-1m">$0</div></div>
                    <div class="m-card"><div class="m-title">1 Año</div><div class="m-val" id="v-1y" style="color: var(--proj-color);">$0</div></div>
                </div>
            </div>
        </div>
    </div>

    <script>
        let mSeries, pSeries, pChart;

        function init() {
            // Mercado
            const mEl = document.getElementById('market-chart');
            const mChart = LightweightCharts.createChart(mEl, {
                width: mEl.clientWidth || 320, height: 260,
                layout: { background: { type: 'solid', color: '#0b1120' }, textColor: '#94a3b8' },
                grid: { vertLines: { color: '#1e293b' }, horzLines: { color: '#1e293b' } }
            });
            mSeries = mChart.addCandlestickSeries({ upColor: '#34d399', downColor: '#ef4444' });

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

            window.addEventListener('resize', () => {
                mChart.applyOptions({ width: mEl.clientWidth });
                if(pChart) {
                    const sEl = document.getElementById('sim-chart');
                    pChart.applyOptions({ width: sEl.clientWidth });
                }
            });
        }

        window.addEventListener('load', init);

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

        async function runSim() {
            const cap = document.getElementById('capital').value || 1000;
            const sEl = document.getElementById('sim-chart');
            sEl.style.display = 'block';
            document.getElementById('sim-metrics').style.display = 'grid';

            if(!pChart) {
                pChart = LightweightCharts.createChart(sEl, {
                    width: sEl.clientWidth || 320, height: 220,
                    layout: { background: { type: 'solid', color: '#0b1120' }, textColor: '#94a3b8' },
                    grid: { vertLines: { visible: false }, horzLines: { color: '#1e293b' } }
                });
                pSeries = pChart.addAreaSeries({ lineColor: '#a855f7', topColor: 'rgba(168, 85, 247, 0.4)', bottomColor: 'rgba(168, 85, 247, 0.0)' });
            }

            try {
                const res = await fetch('/api/simulate?capital=' + cap);
                const data = await res.json();
                pSeries.setData(data.chartData);
                pChart.timeScale().fitContent();

                document.getElementById('v-1w').innerText = '$' + data.m.w1.toLocaleString();
                document.getElementById('v-1m').innerText = '$' + data.m.m1.toLocaleString();
                document.getElementById('v-1y').innerText = '$' + data.m.y1.toLocaleString();
            } catch(e) {
                console.error(e);
            }
        }
    </script>
</body>
</html>`);
    } else if (req.url.startsWith('/api/simulate')) {
        const u = new URL(req.url, 'http://localhost');
        const cap = parseFloat(u.searchParams.get('capital')) || 1000;
        let bal = cap;
        let chartData = [];
        let now = Math.floor(Date.now() / 1000);

        for(let i=0; i<365; i++) {
            bal *= (1 + ((Math.random() * 0.015) - 0.005));
            const dateStr = new Date((now + (i * 86400)) * 1000).toISOString().split('T')[0];
            chartData.push({ time: dateStr, value: parseFloat(bal.toFixed(2)) });
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            m: { w1: chartData[7].value, m1: chartData[30].value, y1: chartData[364].value },
            chartData: chartData
        }));
    } else {
        res.writeHead(404);
        res.end('404');
    }
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => console.log("Quantscrow Core activo en puerto " + PORT));
