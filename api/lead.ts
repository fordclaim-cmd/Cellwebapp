import type { VercelRequest, VercelResponse } from '@vercel/node';
import { parseLead, type Lead } from './_lib/validate';

async function sendEmail(lead: Lead): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    // TODO(Joe): set RESEND_API_KEY in Vercel env to enable email delivery
    console.log('[lead] RESEND_API_KEY not set — lead received:', JSON.stringify(lead));
    return;
  }
  const to = process.env.LEAD_TO_EMAIL ?? 'fordclaim@gmail.com';
  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Goliath Leads <leads@goliath.solutions>',
      to: [to],
      subject: `New lead: ${lead.name} — ${lead.trade} (${lead.city})`,
      text: `Name: ${lead.name}\nTrade: ${lead.trade}\nPhone: ${lead.phone}\nCity: ${lead.city}\n\n${lead.message}`,
    }),
  });
  if (!resp.ok) {
    console.error('[lead] Resend error', resp.status, await resp.text());
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const result = parseLead(req.body);
  if (!result.ok) {
    if (result.reason === 'spam') return res.status(200).json({ ok: true }); // don't tip off bots
    return res.status(400).json({ error: 'Invalid submission' });
  }
  await sendEmail(result.lead);
  return res.status(200).json({ ok: true });
}
