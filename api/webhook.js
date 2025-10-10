// /api/webhook.js
export default async function handler(req, res) {
  try {
    const { type, data } = req.body;
    if (type !== "payment") {
      return res.status(200).send("Ignorado (não é pagamento)");
    }

    const MP_TOKEN = process.env.MP_ACCESS_TOKEN;
    const SCRIPT_URL = process.env.SCRIPT_URL;

    // Consulta detalhes do pagamento no MP
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
      headers: { Authorization: `Bearer ${MP_TOKEN}` },
    });
    const payment = await response.json();

    console.log("📬 Webhook recebido:", payment.status);

    if (payment.status === "approved") {
      // ✅ Envia para seu Google Apps Script registrar a aposta
      await fetch(SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "registrar_pagamento",
          id_pagamento: payment.id,
          nome: payment.payer?.first_name || "Jogador",
          email: payment.payer?.email || "",
          valor: payment.transaction_amount,
          status: payment.status,
          metodo: payment.payment_type_id,
          data: payment.date_approved,
        }),
      });
    }

    res.status(200).send("OK");
  } catch (err) {
    console.error("❌ Erro no webhook:", err);
    res.status(500).send("Erro interno");
  }
}
