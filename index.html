<!-- ========================================================== -->
<!-- QUANTSCROW CORE - MÓDULO MULTICUENTA FIXED (DARK GOLD)     -->
<!-- ========================================================== -->

<!-- 1. BOTÓN FLOTANTE SUPERIOR DERECHA -->
<button onclick="toggleModalInversor(true)" class="qc-btn-gold">
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
  <span>VINCULAR CUENTA</span>
</button>

<!-- 2. VENTANA MODAL APROVISIONAMIENTO -->
<div id="modalInversor" class="qc-modal-overlay">
  <div class="qc-modal-card">
    <div class="qc-modal-header">
      <div>
        <div class="qc-badge">PROP TRADING & INVESTORS</div>
        <h3 class="qc-modal-title">Aprovisionar Cuenta MT5</h3>
      </div>
      <button type="button" class="qc-btn-close" onclick="toggleModalInversor(false)">&times;</button>
    </div>

    <div id="qcAlert" class="qc-alert"></div>

    <form id="formVincularCuenta" onsubmit="procesarVinculacion(event)">
      <div class="qc-form-group">
        <label class="qc-label">NOMBRE DEL INVERSOR / ENTIDAD</label>
        <input type="text" id="nombreInv" class="qc-input" placeholder="Ej. Fondo Privado Alpha / Juan Pérez" required>
      </div>

      <div class="qc-form-row">
        <div class="qc-form-group">
          <label class="qc-label">LOGIN MT5</label>
          <input type="number" id="loginMT5" class="qc-input qc-mono" placeholder="1515204930" required>
        </div>
        <div class="qc-form-group">
          <label class="qc-label">SERVIDOR BROKER</label>
          <input type="text" id="servidorBroker" class="qc-input qc-mono" placeholder="FTMO-Demo" required>
        </div>
      </div>

      <div class="qc-form-group">
        <label class="qc-label">CONTRASEÑA MT5 (TRADING / READ-ONLY)</label>
        <input type="password" id="passMT5" class="qc-input" placeholder="••••••••••••" required>
      </div>

      <div class="qc-modal-actions">
        <button type="button" class="qc-btn-secondary" onclick="toggleModalInversor(false)">Cancelar</button>
        <button type="submit" id="btnSubmitAccount" class="qc-btn-primary">
          <span id="btnText">DESPLEGAR EN METAAPI</span>
          <div id="btnSpinner" class="qc-spinner" style="display: none;"></div>
        </button>
      </div>
    </form>
  </div>
</div>

<!-- 3. ESTILOS CSS REFINADOS -->
<style>
  :root {
    --qc-gold: #d4af37;
    --qc-gold-dark: #aa7c11;
    --qc-gold-glow: rgba(212, 175, 55, 0.25);
    --qc-bg-dark: #0b0c10;
    --qc-card-bg: #121318;
    --qc-border: rgba(212, 175, 55, 0.35);
    --qc-text-muted: #8a8d9b;
  }

  /* Botón Flotante Fijo en Pantalla */
  .qc-btn-gold {
    position: fixed !important;
    top: 18px !important;
    right: 25px !important;
    z-index: 999999 !important;
    background: linear-gradient(135deg, var(--qc-gold) 0%, var(--qc-gold-dark) 100%);
    color: #000;
    font-weight: 800;
    font-size: 11px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    letter-spacing: 1px;
    padding: 10px 18px;
    border: 1px solid #ffe89c;
    border-radius: 6px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 4px 20px var(--qc-gold-glow);
    text-transform: uppercase;
    transition: all 0.2s ease;
  }
  .qc-btn-gold:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 25px rgba(212, 175, 55, 0.55);
    filter: brightness(1.15);
  }

  /* Overlay Modal Glassmorphism */
  .qc-modal-overlay {
    display: none;
    position: fixed;
    top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(4, 5, 8, 0.88);
    backdrop-filter: blur(8px);
    z-index: 1000000;
    align-items: center;
    justify-content: center;
    animation: qcFadeIn 0.2s ease forwards;
  }

  .qc-modal-card {
    background: var(--qc-card-bg);
    border: 1px solid var(--qc-border);
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.9), 0 0 35px var(--qc-gold-glow);
    border-radius: 12px;
    width: 90%;
    max-width: 420px;
    padding: 26px;
    color: #fff;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }

  .qc-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    padding-bottom: 12px;
  }

  .qc-badge {
    font-size: 9px;
    font-weight: 800;
    color: var(--qc-gold);
    letter-spacing: 1.5px;
    margin-bottom: 4px;
  }

  .qc-modal-title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #fff;
  }

  .qc-btn-close {
    background: none;
    border: none;
    color: var(--qc-text-muted);
    font-size: 24px;
    cursor: pointer;
    line-height: 1;
  }
  .qc-btn-close:hover { color: #fff; }

  .qc-form-group { margin-bottom: 15px; }
  .qc-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

  .qc-label {
    display: block;
    font-size: 10px;
    font-weight: 700;
    color: var(--qc-text-muted);
    letter-spacing: 0.8px;
    margin-bottom: 6px;
  }

  .qc-input {
    width: 100%;
    box-sizing: border-box;
    padding: 11px 14px;
    background: #08090c;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 6px;
    color: #fff;
    font-size: 13px;
    outline: none;
    transition: all 0.2s ease;
  }
  .qc-mono { font-family: "JetBrains Mono", Consolas, monospace; }

  .qc-input:focus {
    border-color: var(--qc-gold);
    box-shadow: 0 0 10px var(--qc-gold-glow);
    background: #0d0e13;
  }

  .qc-modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 22px;
  }

  .qc-btn-secondary {
    background: rgba(255, 255, 255, 0.05);
    color: var(--qc-text-muted);
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 10px 16px;
    border-radius: 6px;
    font-size: 12px;
    cursor: pointer;
  }

  .qc-btn-primary {
    background: var(--qc-gold);
    color: #000;
    font-weight: 800;
    font-size: 11px;
    letter-spacing: 0.5px;
    padding: 10px 20px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .qc-alert {
    display: none;
    padding: 10px 14px;
    border-radius: 6px;
    font-size: 12px;
    margin-bottom: 16px;
  }
  .qc-alert-error { background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); color: #fca5a5; }
  .qc-alert-success { background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); color: #6ee7b7; }

  .qc-spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(0, 0, 0, 0.2);
    border-top-color: #000;
    border-radius: 50%;
    animation: qcSpin 0.6s linear infinite;
  }

  @keyframes qcSpin { to { transform: rotate(360deg); } }
  @keyframes qcFadeIn { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
</style>

<!-- 4. LÓGICA DE CONTROL JAVASCRIPT -->
<script>
  function toggleModalInversor(open) {
    const modal = document.getElementById('modalInversor');
    modal.style.display = open ? 'flex' : 'none';
    if (!open) {
      document.getElementById('formVincularCuenta').reset();
      ocultarAlerta();
    }
  }

  function mostrarAlerta(mensaje, esError = false) {
    const alert = document.getElementById('qcAlert');
    alert.className = `qc-alert ${esError ? 'qc-alert-error' : 'qc-alert-success'}`;
    alert.innerText = mensaje;
    alert.style.display = 'block';
  }

  function ocultarAlerta() {
    document.getElementById('qcAlert').style.display = 'none';
  }

  async function procesarVinculacion(e) {
    e.preventDefault();
    ocultarAlerta();

    const btn = document.getElementById('btnSubmitAccount');
    const btnText = document.getElementById('btnText');
    const btnSpinner = document.getElementById('btnSpinner');

    btn.disabled = true;
    btnText.innerText = "PROVISIONANDO...";
    btnSpinner.style.display = "block";

    const payload = {
      nombreInversor: document.getElementById('nombreInv').value,
      loginMT5: document.getElementById('loginMT5').value,
      passwordMT5: document.getElementById('passMT5').value,
      servidorBroker: document.getElementById('servidorBroker').value
    };

    try {
      const response = await fetch('/api/admin/vincular-cuenta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.exito) {
        mostrarAlerta("✔ Cuenta desplegada exitosamente en MetaApi.", false);
        setTimeout(() => {
          toggleModalInversor(false);
          window.location.reload();
        }, 1500);
      } else {
        mostrarAlerta("❌ Fallo de vinculación: " + (data.error || "Revisa credenciales"), true);
      }
    } catch (err) {
      mostrarAlerta("❌ Error de red al comunicar con Quantscrow Core.", true);
    } finally {
      btn.disabled = false;
      btnText.innerText = "DESPLEGAR EN METAAPI";
      btnSpinner.style.display = "none";
    }
  }
</script>
