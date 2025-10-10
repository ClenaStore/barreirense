export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const MP_TOKEN = process.env.MP_ACCESS_TOKEN;
  if (!MP_TOKEN) {
    return res.status(500).json({ error: "MP_ACCESS_TOKEN não configurado" });
  }

  try {
    const { amount, title = "Jogo do Bicho", description = "Aposta", payer = {} } = req.body;

    const body = {
      transaction_amount: Number(amount),
      description,
      payment_method_id: "pix",
      payer: {
        email: payer.email || "teste@example.com",
        first_name: payer.name || "Jogador",
      },
    };

    const resp = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await resp.json();

    // 🔎 LOG detalhado: ajuda a descobrir o problema exato
    console.log("Resposta Mercado Pago:", JSON.stringify(data, null, 2));

    if (data.status === 400 || data.message === "bad_request" || data.error) {
      return res.status(400).json({
        error: "Erro do Mercado Pago",
        detalhes: data,
      });
    }

    if (!data.point_of_interaction) {
      return res.status(500).json({
        error: "Resposta inesperada do Mercado Pago",
        detalhes: data,
      });
    }

    const { qr_code, qr_code_base64 } = data.point_of_interaction.transaction_data;
    return res.status(200).json({ qr_code, qr_code_base64, id: data.id });

  } catch (e) {
    console.error("Erro interno:", e);
    return res.status(500).json({ error: e.message });
  }
}
