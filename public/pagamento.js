window.iniciarPagamento = async function (valor, descricao, idRegistro, aba) {
  const modal = document.createElement("div");
  modal.style = `
    position:fixed;inset:0;background:rgba(0,0,0,.85);
    z-index:9999;display:flex;align-items:center;justify-content:center;
  `;
  modal.innerHTML = `
    <div style="background:#0f172a;border:1px solid #1e2a3f;border-radius:12px;padding:20px;text-align:center;width:90%;max-width:400px;color:#fff">
      <h3>Pagamento PIX</h3>
      <p>QR Code PIX</p>
      <img id="pixQR" style="width:220px;height:220px;border-radius:8px;margin:8px auto;display:block" />
      <textarea id="pixCode" readonly style="width:100%;height:70px;border-radius:8px;padding:6px;margin-top:5px;background:#111;color:#fff;border:1px solid #222"></textarea>
      <p id="pixStatus" style="margin-top:6px;color:#aaa;font-size:13px">Carregando...</p>
      <button id="copyPix" style="margin-top:10px;padding:10px 16px;border:none;border-radius:8px;background:#00e5ff;color:#000;font-weight:700;cursor:pointer">Copiar código</button>
      <button id="closePix" style="margin-top:8px;padding:8px 16px;border:1px solid #333;border-radius:8px;background:#111;color:#eee;cursor:pointer">Fechar</button>
    </div>
  `;
  document.body.appendChild(modal);

  const qr = modal.querySelector("#pixQR");
  const code = modal.querySelector("#pixCode");
  const status = modal.querySelector("#pixStatus");
  const btnClose = modal.querySelector("#closePix");
  const btnCopy = modal.querySelector("#copyPix");

  btnClose.onclick = () => modal.remove();
  btnCopy.onclick = () => { navigator.clipboard.writeText(code.value); btnCopy.textContent = "✅ Copiado!"; setTimeout(()=>btnCopy.textContent="Copiar código",2000); };

  try {
    const resp = await fetch(`/api/pagar?valor=${valor}&descricao=${encodeURIComponent(descricao)}&idRegistro=${idRegistro}&aba=${aba}`);
    const data = await resp.json();

    qr.src = `data:image/png;base64,${data.qr_base64}`;
    code.value = data.qr_texto;
    status.textContent = "Aguardando pagamento...";

    const timer = setInterval(async () => {
      const r = await fetch(`/api/status?id=${data.id}`);
      const s = await r.json();
      if (s.status === "approved") {
        clearInterval(timer);
        status.textContent = "✅ Pagamento aprovado!";
        setTimeout(() => modal.remove(), 2500);
      }
    }, 5000);

  } catch (e) {
    status.textContent = "Erro: " + e.message;
  }
};
