// /api/create_payment.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const MP_TOKEN = process.env.MP_ACCESS_TOKEN;
  if (!MP_TOKEN) {
    return res.status(500).json({ error: "MP_ACCESS_TOKEN não configurado na Vercel" });
  }

  try {
    const { amount, payer, description } = req.body;

    const body = {
      transaction_amount: Number(amount),
      description: description || "Aposta - Jogo do Bicho",
      payment_method_id: "pix",
      payer: {
        email: payer.email || "teste@example.com",
        first_name: payer.name || "Jogador",
      },
      notification_url: `${process.env.SITE_URL}/api/webhook`,
    };

    const resp = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${MP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await resp.json();

    console.log("🧾 Resposta Mercado Pago:", JSON.stringify(data, null, 2));

    if (data.error || data.status === 400) {
      return res.status(400).json({
        error: "Erro do Mercado Pago",
        detalhes: data,
      });
    }

    const { qr_code, qr_code_base64, ticket_url } = data.point_of_interaction.transaction_data;
    res.status(200).json({
      id: data.id,
      qr_code,
      qr_code_base64,
      ticket_url,
    });
  } catch (e) {
    console.error("❌ Erro interno:", e);
    res.status(500).json({ error: e.message });
  }
}
