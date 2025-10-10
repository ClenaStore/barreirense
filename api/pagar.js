import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Método não permitido");

  const { valor, descricao, idRegistro } = req.body;
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  const planilha = process.env.GOOGLE_SCRIPT_URL;

  try {
    // 🔹 Cria pagamento PIX via Mercado Pago
    const mp = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        transaction_amount: Number(valor),
        description: descricao,
        payment_method_id: "pix",
        payer: { email: "comprador@exemplo.com" },
      })
    });

    const data = await mp.json();
    if (data.id) {
      // 🔹 Atualiza status da planilha como “Pago”
      await fetch(`${planilha}?action=atualizarStatus&id=${encodeURIComponent(idRegistro)}&status=Pago`);
      res.status(200).json({
        status: "success",
        qr: data.point_of_interaction.transaction_data.qr_code_base64,
        copiaCola: data.point_of_interaction.transaction_data.qr_code,
        idPagamento: data.id
      });
    } else {
      res.status(400).json({ status: "error", data });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
