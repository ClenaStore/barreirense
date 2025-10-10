import fetch from "node-fetch";

export default async function handler(req, res) {
  try {
    const { valor, descricao, idRegistro, aba } = req.query;

    if (!process.env.MERCADO_PAGO_ACCESS_TOKEN)
      return res.status(400).send("Faltando Access Token Mercado Pago.");

    const body = {
      transaction_amount: Number(valor),
      description: descricao || "Pagamento Jogo do Bicho",
      payment_method_id: "pix",
      payer: { email: "pagador@example.com" },
      notification_url: `${process.env.SITE_URL}/api/webhook?secret=${process.env.MP_WEBHOOK_SECRET}&id=${idRegistro}&aba=${aba}`
    };

    const mp = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const data = await mp.json();
    if (!data.point_of_interaction)
      throw new Error(JSON.stringify(data));

    const { qr_code_base64, qr_code } = data.point_of_interaction.transaction_data;

    res.status(200).json({
      qr_base64: qr_code_base64,
      qr_texto: qr_code,
      id: data.id
    });

  } catch (e) {
    res.status(500).send("Erro interno: " + e.message);
  }
}
