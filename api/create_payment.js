export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const MP_TOKEN = process.env.MP_ACCESS_TOKEN;
  if (!MP_TOKEN) {
    return res.status(500).json({ error: 'MP_ACCESS_TOKEN ausente nas variáveis de ambiente' });
  }

  try {
    const { amount, title = 'Jogo do Bicho', description = 'Aposta', payer = {} } = req.body;

    // Cria pagamento PIX
    const paymentBody = {
      transaction_amount: Number(amount),
      description,
      payment_method_id: 'pix',
      payer: {
        email: payer.email || 'teste@example.com',
        first_name: payer.name || 'Jogador'
      },
      notification_url: `${process.env.SITE_URL}/api/webhook`
    };

    const resp = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MP_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentBody)
    });

    const data = await resp.json();

    if (data.point_of_interaction && data.point_of_interaction.transaction_data) {
      const { qr_code, qr_code_base64 } = data.point_of_interaction.transaction_data;
      return res.status(200).json({
        pix_qr: qr_code,
        pix_qr_base64: qr_code_base64,
        id: data.id
      });
    } else {
      console.error('Resposta inesperada:', data);
      return res.status(500).json({ error: 'Resposta inesperada do Mercado Pago', details: data });
    }

  } catch (e) {
    console.error('Erro interno:', e);
    return res.status(500).json({ error: e.message });
  }
}
