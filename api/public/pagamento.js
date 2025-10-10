// /public/pagamento.js
async function gerarPagamentoPIX(valor, nome, email) {
  try {
    const resposta = await fetch("/api/create_payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: valor,
        payer: { name: nome, email },
        description: "Aposta - Jogo do Bicho",
      }),
    });

    const data = await resposta.json();

    if (!resposta.ok || data.error) {
      console.error("Erro:", data);
      alert(`Erro ao iniciar pagamento: ${data.error || "Falha desconhecida"}`);
      return;
    }

    // Mostra QR code no popup
    document.getElementById("pixValor").textContent = `R$ ${valor.toFixed(2)}`;
    document.getElementById("pixChave").innerHTML = `
      <img src="data:image/png;base64,${data.qr_code_base64}" alt="QR PIX" style="width:180px;border-radius:8px;margin:10px auto;">
      <p style="word-break:break-all;color:#ffc107;">${data.qr_code}</p>
      <a href="${data.ticket_url}" target="_blank" style="display:inline-block;margin-top:8px;color:#00e5ff;text-decoration:underline;">Abrir no app do banco</a>
    `;
    document.getElementById("overlayPix").style.display = "flex";

  } catch (erro) {
    console.error("Erro:", erro);
    alert("Erro ao iniciar pagamento: " + erro.message);
  }
}
