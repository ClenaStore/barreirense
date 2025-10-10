// /api/webhook.js
// Webhook do Mercado Pago: marca como Pago na planilha quando approved.
import fetch from "node-fetch";

export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  try {
    const { query, body } = req;
    let paymentId = query?.id || body?.data?.id;

    if (!paymentId && (query?.topic === "payment" || query?.type === "payment"))
      paymentId = query?.["data.id"];

    if (!paymentId) {
      return res.status(200).json({ ok: true, msg: "Sem id de pagamento" });
    }

    const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    const scriptUrl = process.env.GOOGLE_SCRIPT_URL;
    if (!token || !scriptUrl)
      return res.status(500).json({ error: "Variáveis de ambiente ausentes" });

    const pr = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const pdata = await pr.json();

    if (pdata?.status === "approved") {
      const ref = (() => {
        try { return JSON.parse(pdata.external_reference || "{}"); } catch { return {}; }
      })();
      const idRegistro = ref.idRegistro || "";
      const aba = ref.aba || "";
      if (idRegistro) {
        const url = `${scriptUrl}?action=atualizarStatus&id=${encodeURIComponent(idRegistro)}&status=Pago${aba ? "&aba=" + encodeURIComponent(aba) : ""}`;
        await fetch(url);
      }
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(200).json({ ok: true, warn: e.message });
  }
}
