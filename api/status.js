// /api/status.js
// Consulta status de um pagamento no Mercado Pago (usado no polling do front-end)
import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const id = req.query.id || req.query.payment_id;
    if (!id) return res.status(400).json({ error: "Informe ?id=" });

    const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!token) return res.status(500).json({ error: "ACCESS_TOKEN não configurado" });

    const r = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await r.json();
    if (!r.ok) return res.status(400).json({ error: "Erro ao consultar pagamento", detalhe: data });

    return res.status(200).json({
      id: data.id,
      status: data.status,
      status_detail: data.status_detail,
      external_reference: data.external_reference,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
