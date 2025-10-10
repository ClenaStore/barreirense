// pagamento.js - script comum para todos os jogos
(function(){
  const $ = (s, r=document) => r.querySelector(s);

  function ensureModal(){
    if ($('#mp-modal')) return;
    const css = document.createElement('style');
    css.textContent = `
      .mp-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:99999}
      .mp-box{background:#0f172a;color:#e5f0ff;border:1px solid #243043;border-radius:12px;padding:16px;width:min(92vw,420px);text-align:center;font-family:Inter,system-ui}
      .mp-qr{width:220px;height:220px;border-radius:8px;display:block;margin:10px auto;background:#081021}
      .mp-code{background:#0b1528;border:1px dashed #22314b;color:#e5f0ff;padding:8px;border-radius:8px;word-break:break-all;font-size:12px}
      .mp-btn{flex:1;background:#0b1528;border:1px solid #2a3955;color:#e5f0ff;border-radius:10px;padding:10px;font-weight:700;cursor:pointer}
      .mp-ok{background:linear-gradient(180deg,#19c37d,#16a34a);border:0;color:#fff}
    `;
    document.head.appendChild(css);
    const wrap = document.createElement('div');
    wrap.className = 'mp-backdrop';
    wrap.id = 'mp-modal';
    wrap.innerHTML = `
      <div class="mp-box">
        <h3>Pagamento PIX</h3>
        <img class="mp-qr" id="mp-qr" alt="QR Code PIX" />
        <div class="mp-code" id="mp-copia">Carregando...</div>
        <button class="mp-btn" id="mp-copiar">Copiar código</button>
        <button class="mp-btn mp-ok" id="mp-fechar">Fechar</button>
        <div id="mp-status" style="margin-top:8px;font-size:12px;opacity:.8">Aguardando pagamento...</div>
      </div>`;
    wrap.addEventListener('click', (e)=>{ if(e.target.id==='mp-modal') wrap.remove(); });
    document.body.appendChild(wrap);
    $('#mp-fechar').onclick = ()=> wrap.remove();
    $('#mp-copiar').onclick = async ()=> {
      await navigator.clipboard.writeText($('#mp-copia').textContent.trim());
      $('#mp-status').textContent = "Código copiado!";
    };
  }

  async function iniciarPagamento(valor, descricao, idRegistro, aba){
    ensureModal();
    const img = $('#mp-qr'), code = $('#mp-copia'), info = $('#mp-status');
    info.textContent = "Gerando pagamento...";
    try {
      const r = await fetch("/api/pagar", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({valor, descricao, idRegistro, aba})
      });
      const data = await r.json();
      if (!data?.idPagamento) throw new Error("Falha ao criar pagamento");
      if (data.qr) img.src = `data:image/png;base64,${data.qr}`;
      if (data.copiaCola) code.textContent = data.copiaCola;
      info.textContent = "Aguardando pagamento...";

      const t0 = Date.now();
      const timeout = 3*60*1000;
      while(Date.now() - t0 < timeout){
        await new Promise(s => setTimeout(s, 5000));
        const st = await fetch(`/api/status?id=${data.idPagamento}`).then(r=>r.json());
        if (st?.status === "approved") {
          info.textContent = "Pagamento aprovado!";
          setTimeout(()=> $('#mp-modal').remove(), 1500);
          return;
        }
      }
      info.textContent = "Não houve confirmação ainda. Tente novamente mais tarde.";
    } catch(e){ info.textContent = "Erro: " + e.message; }
  }

  window.iniciarPagamento = iniciarPagamento;
})();
