// /api/pagar.js
// Cria pagamento PIX no Mercado Pago e devolve QR Code + copia e cola.
// Requer variáveis de ambiente na Vercel:
// - MERCADO_PAGO_ACCESS_TOKEN
// - GOOGLE_SCRIPT_URL  (ex: https://script.google.com/macros/s/XXXX/exec)
import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const { valor, descricao, idRegistro, aba } = req.body || {};
    if (!valor || !descricao || !idRegistro) {
      return res.status(400).json({ error: "Campos obrigatórios ausentes (valor, descricao, idRegistro)" });
    }

    const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!token) return res.status(500).json({ error: "ACCESS_TOKEN não configurado" });

    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const protocol = (req.headers["x-forwarded-proto"] || "https");
    const notification_url = `${protocol}://${host}/api/webhook`;

    const external_reference = JSON.stringify({ idRegistro, aba: aba || "" });

    const mpResp = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transaction_amount: Number(valor),
        description: descricao,
        payment_method_id: "pix",
        notification_url,
        external_reference,
        payer: { email: "comprador@anonimo.com" },
      }),
    });

    const data = await mpResp.json();
    if (!mpResp.ok || !data || !data.id) {
      return res.status(400).json({ error: "Falha ao criar pagamento", detalhe: data });
    }

    const qr = data?.point_of_interaction?.transaction_data?.qr_code_base64 || null;
    const copiaCola = data?.point_of_interaction?.transaction_data?.qr_code || null;

    return res.status(200).json({
      status: "created",
      idPagamento: data.id,
      qr,
      copiaCola,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
