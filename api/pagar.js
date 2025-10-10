import mercadopago from "mercadopago";

mercadopago.configure({
  access_token: process.env.MERCADOPAGO_ACCESS_TOKEN
});

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { nome, email, telefone, qtd, descricao } = req.body;

  try {
    const preference = await mercadopago.preferences.create({
      items: [
        {
          title: descricao || "Rifa Solidária",
          quantity: Number(qtd) || 1,
          currency_id: "BRL",
          unit_price: 5
        }
      ],
      payer: {
        name: nome,
        email,
        phone: { number: telefone }
      },
      back_urls: {
        success: `${req.headers.origin}/sucesso.html`,
        failure: `${req.headers.origin}/falha.html`,
        pending: `${req.headers.origin}/pendente.html`
      },
      auto_return: "approved",
      notification_url: `${req.headers.origin}/api/webhook`
    });

    res.status(200).json({ init_point: preference.body.init_point });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erro ao criar pagamento" });
  }
}
