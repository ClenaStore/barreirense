import fetch from "node-fetch";

export default async function handler(req, res) {
  try {
    const { id } = req.query;

    const mp = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
      headers: { "Authorization": `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}` }
    });
    const data = await mp.json();

    res.status(200).json({
      status: data.status,
      status_detail: data.status_detail
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
