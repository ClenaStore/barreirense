// api/whatsapp/send.js
const ALLOWED_ORIGINS = [
  'https://clenastore.github.io',       // seu GitHub Pages
  'http://localhost:5500'               // opcional p/ testes locais
];

function allow(origin) {
  return ALLOWED_ORIGINS.some(base => origin && origin.startsWith(base));
}

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  const corsOrigin = allow(origin) ? origin : '*';

  // CORS
  res.setHeader('Access-Control-Allow-Origin', corsOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // 🔧 Body pode vir como string em funções Vercel
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body || '{}'); } catch { body = {}; }
    }
    const { to, text, template } = body || {};
    if (!to || (!text && !template)) {
      return res.status(400).json({ error: 'Missing `to` or `text/template`', received: body });
    }

    const phoneId = process.env.WHATSAPP_PHONE_ID;
    const token   = process.env.WHATSAPP_TOKEN;
    if (!phoneId || !token) {
      return res.status(500).json({ error: 'Missing env vars', need: ['WHATSAPP_PHONE_ID', 'WHATSAPP_TOKEN'] });
    }

    const url = `https://graph.facebook.com/v20.0/${phoneId}/messages`;

    const payload = template ? {
      messaging_product: 'whatsapp',
      to, type: 'template', template
    } : {
      messaging_product: 'whatsapp',
      to, type: 'text', text: { body: text }
    };

    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    });

    const data = await r.json();
    if (!r.ok) {
      return res.status(r.status).json({ error: 'WhatsApp API error', details: data });
    }

    return res.status(200).json({ ok: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error', details: String(err) });
  }
}
