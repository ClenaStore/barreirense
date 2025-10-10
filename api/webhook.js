import fetch from "node-fetch";

export default async function handler(req, res) {
  try {
    const { secret, id, aba } = req.query;

    if (secret !== process.env.MP_WEBHOOK_SECRET)
      return res.status(403).send("Acesso negado");

    const event = req.body || {};

    if (event.data && event.data.id) {
      const payId = event.data.id;

      const resp = await fetch(`https://api.mercadopago.com/v1/payments/${payId}`, {
        headers: { "Authorization": `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}` }
      });
      const data = await resp.json();

      if (data.status === "approved") {
        await fetch(`${process.env.GOOGLE_SCRIPT_URL}?action=atualizarStatus&id=${id}&aba=${aba}&status=Pago`);
      }
    }

    res.status(200).send("OK");
  } catch (e) {
    res.status(500).send("Erro: " + e.message);
  }
}
