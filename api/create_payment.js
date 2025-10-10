// /api/create_payment.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const MP_TOKEN = process.env.MP_ACCESS_TOKEN;
  if (!MP_TOKEN) {
    return res.status(500).json({ error: "MP_ACCESS_TOKEN não configurado" });
  }

  try {
    const { amount, payer } = req.body;

    // 🔑 Gera um ID único para o cabeçalho X-Idempotency-Key
    const idempotencyKey = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

    const body = {
      transaction_amount: Number(amount),
      description: "Aposta - Jogo do Bicho",
      payment_method_id: "pix",
      payer: {
        email: payer?.email || "cliente@teste.com",
        first_name: payer?.name || "Jogador",
      },
      notification_url: `${process.env.SITE_URL}/api/webhook`,
    };

    const resp = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MP_TOKEN}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": idempotencyKey, // ✅ cabeçalho obrigatório
      },
      body: JSON.stringify(body),
    });

    const data = await resp.json();
    console.log("📦 RESPOSTA MP:", JSON.stringify(data, null, 2));

    if (!resp.ok || data.error || !data.point_of_interaction) {
      return res.status(400).json({
        error: "Erro do Mercado Pago",
        detalhes: data,
      });
    }

    const { qr_code, qr_code_base64, ticket_url } =
      data.point_of_interaction.transaction_data;

    return res.status(200).json({
      id: data.id,
      qr_code,
      qr_code_base64,
      ticket_url,
    });
  } catch (e) {
    console.error("❌ ERRO INTERNO:", e);
    return res.status(500).json({ error: e.message });
  }
}
