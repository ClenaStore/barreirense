// api/whatsapp/send.js
const ALLOWED_ORIGINS = [
  'https://clenastore.github.io', // GitHub Pages base
  'http://localhost:5500',        // opcional para testes locais
];

function allow(origin) {
  return ALLOWED_ORIGINS.some(base => origin && origin.startsWith(base));
}

export default async function handler(req, res) {
  try {
    const origin = req.headers.origin || '';
    const corsOrigin = allow(origin) ? origin : '*';

    // CORS + no-store
    res.setHeader('Access-Control-Allow-Origin', corsOrigin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
    res.setHeader('Cache-Control', 'no-store');

    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // Body pode vir string quando sem Content-Type
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
      return res.status(500).json({
        error: 'Missing env vars',
        need: ['WHATSAPP_PHONE_ID', 'WHATSAPP_TOKEN']
      });
    }

    const url = `https://graph.facebook.com/v20.0/${phoneId}/messages`;
    const payload = template ? {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template
    } : {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text }
    };

    const upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    });

    let upstreamBody;
    try { upstreamBody = await upstream.json(); }
    catch { upstreamBody = { raw: await upstream.text() }; }

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: 'WhatsApp API error',
        upstream_status: upstream.status,
        upstream: upstreamBody
      });
    }

    return res.status(200).json({ ok: true, data: upstreamBody });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error', details: String(err) });
  }
}
