import type { NextApiRequest, NextApiResponse } from 'next';

const TOKEN  = process.env.WHATSAPP_TOKEN!;
const PHONE  = process.env.WHATSAPP_PHONE_ID!;
const TPL    = process.env.WHATSAPP_TEMPLATE_NAME; // ex.: "aniversario_reserva"
const LANG   = process.env.WHATSAPP_TEMPLATE_LANG || 'pt_BR';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { to, name, reservaUrl, infoUrl } = req.body || {};
    if (!to || !name) {
      return res.status(400).json({ error: 'to and name are required' });
    }

    const url = `https://graph.facebook.com/v20.0/${PHONE}/messages`;
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`
    };

    let body: any;

    if (TPL) {
      // usando template aprovado
      body = {
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: TPL,
          language: { code: LANG },
          components: [
            {
              type: 'body',
              parameters: [{ type: 'text', text: name }]
            },
            {
              type: 'button',
              sub_type: 'url',
              index: '0',
              parameters: [{ type: 'text', text: reservaUrl || 'https://seu-site.com/reservas' }]
            },
            {
              type: 'button',
              sub_type: 'url',
              index: '1',
              parameters: [{ type: 'text', text: infoUrl || 'https://seu-site.com/aniversarios' }]
            }
          ]
        }
      };
    } else {
      // fallback simples em texto
      const text = `🎉 *Feliz aniversário, ${name}!*  
Reservas: ${reservaUrl || ''}  
Mais informações: ${infoUrl || ''}`;

      body = {
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text, preview_url: true }
      };
    }

    const r = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    const json = await r.json();
    if (!r.ok) {
      return res.status(r.status).json({ error: 'whatsapp_error', details: json });
    }

    return res.status(200).json({ ok: true, wa: json });
  } catch (e: any) {
    return res.status(500).json({ error: 'internal_error', message: e?.message });
  }
}
