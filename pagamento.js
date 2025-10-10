/* pagamento.js
   Cliente: envia pedido para /api/create_payment e mostra QR + link.
   Requisitos: index.jogodobicho.html já inclui <script src="/pagamento.js"></script>
*/

async function iniciarPagamento(amount, title = "Compra", customerName = "", description = "") {
  try {
    // Mostra loading (você pode estilizar um modal próprio — neste exemplo criamos um modal simples)
    showPagamentoModalLoading();

    const body = { amount: Number(amount), title, description, payer: { name: customerName } };
    const resp = await fetch('/api/create_payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await resp.json();

    if (!resp.ok) {
      hidePagamentoModal();
      alert('Erro ao iniciar pagamento: ' + (data?.error || resp.statusText));
      return;
    }

    // data => { init_point, preference, pix_qr, pix_qr_base64, payment }
    const { init_point, pix_qr, pix_qr_base64 } = data;

    // Exibe modal contendo QR (se tiver base64) e link (init_point)
    showPagamentoModal({
      init_point,
      pix_qr,
      pix_qr_base64,
      amount
    });

  } catch (err) {
    hidePagamentoModal();
    console.error(err);
    alert('Erro de conexão ao iniciar pagamento.');
  }
}

/* ------- Simple modal helpers (append DOM elements) ------- */
function showPagamentoModalLoading() {
  hidePagamentoModal();
  const m = document.createElement('div');
  m.id = '__mp_modal';
  m.style.position = 'fixed';
  m.style.inset = '0';
  m.style.background = 'rgba(0,0,0,.7)';
  m.style.display = 'flex';
  m.style.alignItems = 'center';
  m.style.justifyContent = 'center';
  m.style.zIndex = 99999;
  m.innerHTML = `<div style="background:#071226;padding:20px;border-radius:12px;color:#fff;min-width:320px;text-align:center">
    <div style="font-weight:700;margin-bottom:8px">Gerando pagamento...</div>
    <div style="opacity:.8">Aguarde</div>
  </div>`;
  document.body.appendChild(m);
}
function hidePagamentoModal() {
  const prev = document.getElementById('__mp_modal');
  if (prev) prev.remove();
}
function showPagamentoModal({ init_point, pix_qr, pix_qr_base64, amount }) {
  hidePagamentoModal();
  const m = document.createElement('div');
  m.id = '__mp_modal';
  m.style.position = 'fixed';
  m.style.inset = '0';
  m.style.background = 'rgba(0,0,0,.7)';
  m.style.display = 'flex';
  m.style.alignItems = 'center';
  m.style.justifyContent = 'center';
  m.style.zIndex = 99999;

  const qrHtml = pix_qr_base64
    ? `<img src="data:image/png;base64,${pix_qr_base64}" alt="QR PIX" style="max-width:260px;display:block;margin:0 auto 8px;border-radius:8px" />`
    : (pix_qr ? `<pre style="background:#041226;color:#9fdcff;padding:10px;border-radius:8px;white-space:pre-wrap">${pix_qr}</pre>` : '');

  m.innerHTML = `
    <div style="background:#071226;padding:18px;border-radius:12px;color:#fff;min-width:320px;max-width:420px;text-align:center">
      <div style="font-weight:800;font-size:16px;margin-bottom:10px">Pagamento</div>
      <div style="margin-bottom:8px">Valor: <b>R$ ${Number(amount).toFixed(2)}</b></div>
      ${qrHtml}
      <div style="display:flex;gap:8px;margin-top:12px;justify-content:center">
        ${init_point ? `<a href="${init_point}" target="_blank" style="text-decoration:none">
           <button style="background:#12b981;border:none;padding:10px 12px;border-radius:8px;font-weight:700;color:#00221a;cursor:pointer">Abrir checkout</button>
         </a>` : ''}
        <button id="mp_close" style="background:#22364a;border:none;padding:10px 12px;border-radius:8px;font-weight:700;color:#fff;cursor:pointer">Fechar</button>
      </div>
      <div style="margin-top:8px;font-size:12px;color:#99b2c6">Seu jogo será confirmado automaticamente após pagamento (quando houver webhook configurado).</div>
    </div>
  `;
  document.body.appendChild(m);
  document.getElementById('mp_close').onclick = () => hidePagamentoModal();
}
