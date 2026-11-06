<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quantscrow Core | Terminal</title>
    <style>
        :root { --bg-dark: #090909; --bg-card: #141414; --gold-1: #d4af37; --gold-light: #f3e5ab; --gold-dark: #aa8c2c; --text-main: #e0e0e0; --text-muted: #888; --success: #4caf50; --danger: #f44336; }
        body { background: var(--bg-dark); color: var(--text-main); font-family: 'Courier New', monospace; margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
        .terminal { width: 90%; max-width: 850px; background: var(--bg-card); border: 1px solid var(--gold-dark); border-radius: 8px; padding: 25px; box-shadow: 0 0 20px rgba(212, 175, 55, 0.1); }
        h1 { color: var(--gold-1); text-align: center; letter-spacing: 2px; margin: 0; }
        .status-bar { display: flex; justify-content: space-between; font-size: 0.8em; color: var(--gold-dark); border-bottom: 1px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .panel { border: 1px solid #333; padding: 15px; border-radius: 5px; background: rgba(0,0,0,0.5); }
        .panel h3 { margin-top: 0; color: var(--gold-light); font-size: 0.9em; border-bottom: 1px solid #333; padding-bottom: 5px; }
        .input-group { margin-bottom: 10px; }
        .input-group label { display: block; font-size: 0.75em; color: var(--text-muted); margin-bottom: 3px; }
        input { width: 100%; background: #000; border: 1px solid #333; color: var(--gold-1); padding: 8px; box-sizing: border-box; font-family: inherit; }
        button { width: 100%; padding: 15px; background: var(--gold-1); color: #000; border: none; font-weight: bold; font-size: 1em; cursor: pointer; margin-top: 20px; transition: 0.3s; }
        button:hover { background: var(--gold-light); }
        #resultado { margin-top: 20px; padding: 15px; border-radius: 5px; display: none; text-align: center; font-weight: bold; }
        .exito { background: rgba(76, 175, 80, 0.2); border: 1px solid var(--success); color: var(--success); }
        .error { background: rgba(244, 67, 54, 0.2); border: 1px solid var(--danger); color: var(--danger); }
    </style>
</head>
<body>
<div class="terminal">
    <h1>QUANTSCROW CORE</h1>
    <div class="status-bar">
        <span id="server-loc">CONECTANDO...</span>
        <span id="server-time">--:--:--</span>
        <span id="server-db">DB: ---</span>
    </div>

    <div class="grid">
        <div class="panel">
            <h3>INPUTS TÉCNICOS</h3>
            <div class="input-group"><label>Par</label><input type="text" id="par" value="EURUSD"></div>
            <div class="input-group"><label>Precio Actual</label><input type="number" id="precioActual" value="1.08500" step="0.00001"></div>
            <div class="input-group"><label>Stop Loss (SL)</label><input type="number" id="slTecnico" value="1.08350" step="0.00001"></div>
            <div class="input-group"><label>Take Profit (TP)</label><input type="number" id="tpLiquidez" value="1.09000" step="0.00001"></div>
        </div>
        <div class="panel">
            <h3>MÉTRICAS CUANTITATIVAS</h3>
            <div class="input-group"><label>Prob. Base (0 a 1)</label><input type="number" id="probBase" value="0.48" step="0.01" min="0" max="1"></div>
            <div class="input-group"><label>ATR</label><input type="number" id="atr" value="0.00120" step="0.00001"></div>
            <div class="input-group"><label>Balance (USD)</label><input type="number" id="balance" value="10000"></div>
        </div>
    </div>

    <button onclick="evaluarTrade()">EJECUTAR ANÁLISIS CUANTITATIVO</button>
    <div id="resultado"></div>
</div>

<script>
    // Actualiza la barra de estado superior cada 3 segundos
    setInterval(async () => {
        try {
            const res = await fetch('/api/status');
            const data = await res.json();
            document.getElementById('server-loc').innerText = `CLÚSTER: ${data.server} (${data.status})`;
            document.getElementById('server-time').innerText = `HORA EST: ${data.time_est.split(', ')[1]}`;
            document.getElementById('server-db').innerText = `DB: ${data.db}`;
        } catch (e) {
            document.getElementById('server-loc').innerText = "CLÚSTER: OFFLINE";
        }
    }, 3000);

    // Función principal que conecta con el motor matemático
    async function evaluarTrade() {
        const btn = document.querySelector('button');
        const resDiv = document.getElementById('resultado');
        btn.innerText = "PROCESANDO..."; resDiv.style.display = 'none';

        const payload = {
            par: document.getElementById('par').value,
            precioActual: parseFloat(document.getElementById('precioActual').value),
            slTecnico: parseFloat(document.getElementById('slTecnico').value),
            tpLiquidez: parseFloat(document.getElementById('tpLiquidez').value),
            probBase: parseFloat(document.getElementById('probBase').value),
            atr: parseFloat(document.getElementById('atr').value),
            balance: parseFloat(document.getElementById('balance').value)
        };

        try {
            const response = await fetch('/api/evaluar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            resDiv.style.display = 'block';
            
            if (response.ok) {
                resDiv.className = 'exito';
                resDiv.innerHTML = `
                    <h3 style="margin:0 0 10px 0;">✅ ${data.mensaje}</h3>
                    <p>Lote Calculado: <strong>${data.detalles.lote}</strong> (${data.detalles.racha_penalizada})</p>
                    <p>Riesgo: <strong>$${data.detalles.riskUSD}</strong> | Prob: <strong>${data.detalles.probabilidad}</strong></p>
                    <p>EV: <strong>${data.detalles.expectedValue}</strong> | R:R: <strong>${data.detalles.ratioRR}</strong></p>
                `;
            } else {
                resDiv.className = 'error';
                resDiv.innerHTML = `🚫 SISTEMA ABORTADO: ${data.error}`;
            }
        } catch (error) {
            resDiv.style.display = 'block'; resDiv.className = 'error';
            resDiv.innerHTML = `🚨 Error de conexión.`;
        } finally {
            btn.innerText = "EJECUTAR ANÁLISIS CUANTITATIVO";
        }
    }
</script>
</body>
</html>
