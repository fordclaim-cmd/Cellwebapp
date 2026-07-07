import type { VercelRequest, VercelResponse } from '@vercel/node';
import { parseLead, type Lead } from './_lib/validate';

// TCPA consent record. The transactional line is always agreed to by submitting
// (disclosed under the button). The marketing line only applies when the
// optional box is ticked. Both strings are stored as the consent record.
const TRANSACTIONAL_CONSENT =
  'By submitting, you agree Goliath Solutions may contact you about your request by phone, text, and email. Msg & data rates may apply; reply STOP to opt out of texts anytime.';
const MARKETING_CONSENT =
  'Also send me tips, offers, and updates from Goliath Solutions by text and email. Consent is not a condition of purchase. Reply STOP to opt out anytime.';

function emailBody(lead: Lead): string {
  const consent = lead.marketingConsent
    ? `${TRANSACTIONAL_CONSENT} ${MARKETING_CONSENT}`
    : TRANSACTIONAL_CONSENT;
  const rows: [string, string][] = [
    ['Service', lead.service],
    ['Name', lead.name],
    ['Phone', lead.phone],
    ['Business', lead.businessName],
    ['Email', lead.email],
    ['Trade', lead.trade],
    ['City', lead.city],
    ['Current site', lead.currentWebsite],
  ];
  const lines = rows.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`);
  if (lead.message) lines.push('', `Message: ${lead.message}`);
  lines.push('', `Marketing opt-in: ${lead.marketingConsent ? 'yes' : 'no'}`, `Consent: ${consent}`);
  return lines.join('\n');
}

async function sendEmail(lead: Lead): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    // TODO(Joe): set RESEND_API_KEY in Vercel env to enable email delivery
    console.log('[lead] RESEND_API_KEY not set — lead received:', JSON.stringify(lead));
    return;
  }
  const to = process.env.LEAD_TO_EMAIL ?? 'fordclaim@gmail.com';
  const subjectBits = [lead.name, lead.service || lead.trade, lead.city].filter(Boolean).join(' — ');
  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Goliath Leads <leads@goliath.solutions>',
      to: [to],
      subject: `New lead: ${subjectBits}`,
      text: emailBody(lead),
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
