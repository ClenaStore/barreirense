// api/create_payment.js
// Vercel Serverless function. Node 18+ -> fetch global disponível.

// Endpoints Mercado Pago usados:
// - POST https://api.mercadopago.com/checkout/preferences  -> cria preference (link init_point)
// - POST https://api.mercadopago.com/v1/payments          -> cria pagamento PIX (qr info)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const MP_TOKEN = process.env.MP_ACCESS_TOKEN;
  if (!MP_TOKEN) {
    return res.status(500).json({ error: 'Missing MP_ACCESS_TOKEN in env' });
  }

  try {
    const { amount, title = 'Compra', description = '', payer = {} } = req.body;
    const transactionAmount = Number(amount);
    if (!transactionAmount || isNaN(transactionAmount)) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // 1) Criar preference (link de checkout — init_point)
    const prefBody = {
      items: [
        {
          title,
          description,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: transactionAmount
        }
      ],
      payer: {
        name: payer.name || 'Cliente',
      },
      back_urls: {
        success: '', // opcional
        failure: '',
        pending: ''
      },
      auto_return: 'approved'
    };

    const prefResp = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${MP_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(prefBody)
    });

    const prefJson = await prefResp.json();
    const init_point = prefJson.init_point || null;

    // 2) Criar payment com método PIX para obter QR code (opcional: você pode pular isto se só quer o link)
    // A criação de pagamento PIX pode retornar qr_code e qr_code_base64 em point_of_interaction.transaction_data
    let pixData = null;
    try {
      const paymentBody = {
        transaction_amount: transactionAmount,
        payment_method_id: 'pix',
        description: description || title,
        payer: {
          email: payer.email || 'no-reply@example.com',
          first_name: payer.name || 'Cliente',
          phone: {
            area_code: payer.phone_area_code || '00',
            number: payer.phone_number || '000000000'
          }
        }
      };

      const payResp = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${MP_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentBody)
      });

      const payJson = await payResp.json();
      // Se sucesso, payJson.point_of_interaction.transaction_data tem qr_code / qr_code_base64
      const pix_qr = payJson?.point_of_interaction?.transaction_data?.qr_code || null;
      const pix_qr_base64 = payJson?.point_of_interaction?.transaction_data?.qr_code_base64 || null;
      pixData = { pix_qr, pix_qr_base64, payment: payJson };
    } catch (e) {
      // falha ao criar payment PIX: continuamos devolvendo init_point
      pixData = { error: 'Erro ao criar pagamento PIX', details: e?.message || String(e) };
    }

    // 3) (Opcional) registrar a tentativa/transação na sua planilha ou DB
    //    Você já possui SCRIPT_URL. É possível POSTAR aqui para gravar.
    //    Recomendo gravar a tentativa aqui e atualizar via webhook quando pagamento confirmado.
    /*
    try {
      await fetch(process.env.SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'registrar_pagamento_tentativa',
          amount: transactionAmount,
          title,
          description,
          payer,
          preference_id: prefJson?.id,
          payment_info: pixData?.payment || null
        })
      });
    } catch(e) {
      console.error('Erro ao registrar tentativa', e);
    }
    */

    return res.status(200).json({
      init_point,
      preference: prefJson,
      ...pixData
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error', details: String(err) });
  }
}
