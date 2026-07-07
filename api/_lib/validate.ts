// Lead validation for the two-step quote form. Only name + phone gate the
// submission; service and the rest ride along as optional enrichment on the
// same request. Honeypot field is `_hp` (hidden; bots fill it, humans don't).

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Valid NANP US number: area code + exchange each start [2-9]. Rejects
// symbol-only strings, 0/1-led area codes, and repeated-digit junk.
const NANP_RE = /^\+1[2-9]\d{2}[2-9]\d{6}$/;

function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  let e164: string | null = null;
  if (digits.length === 10) e164 = `+1${digits}`;
  else if (digits.length === 11 && digits.startsWith('1')) e164 = `+${digits}`;
  return e164 && NANP_RE.test(e164) ? e164 : null;
}

export type Lead = {
  service: string;
  name: string;
  phone: string; // normalized to E.164 (+1XXXXXXXXXX)
  businessName: string;
  email: string;
  trade: string;
  city: string;
  currentWebsite: string;
  message: string;
  marketingConsent: boolean;
};

function str(v: unknown, max: number): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

export function parseLead(
  body: unknown,
): { ok: true; lead: Lead } | { ok: false; reason: 'spam' | 'invalid' } {
  if (typeof body !== 'object' || body === null) return { ok: false, reason: 'invalid' };
  const b = body as Record<string, unknown>;

  // Honeypot — any non-empty value means a bot.
  if (typeof b._hp === 'string' && b._hp.trim().length > 0) return { ok: false, reason: 'spam' };

  // Required: name + a valid US phone.
  const name = str(b.name, 100);
  if (name.length < 2) return { ok: false, reason: 'invalid' };

  const phoneRaw = typeof b.phone === 'string' ? b.phone : '';
  const phone = normalizePhone(phoneRaw);
  if (!phone) return { ok: false, reason: 'invalid' };

  // Optional email — if provided, it must be well-formed.
  const email = str(b.email, 200);
  if (email && !EMAIL_RE.test(email)) return { ok: false, reason: 'invalid' };

  const message = str(b.message, 2000);

  return {
    ok: true,
    lead: {
      service: str(b.service, 100),
      name,
      phone,
      businessName: str(b.businessName, 100),
      email,
      trade: str(b.trade, 100),
      city: str(b.city, 100),
      currentWebsite: str(b.currentWebsite, 200),
      message,
      marketingConsent: b.marketing_consent === 'on' || b.marketing_consent === true,
    },
  };
}
