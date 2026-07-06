import { z } from 'zod';

const leadSchema = z.object({
  name: z.string().trim().min(2).max(100),
  trade: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(7).max(25).regex(/^[0-9+().\-\s]+$/),
  city: z.string().trim().min(2).max(100),
  message: z.string().trim().max(2000).optional().default(''),
});

export type Lead = z.infer<typeof leadSchema>;

export function parseLead(
  body: unknown,
): { ok: true; lead: Lead } | { ok: false; reason: 'spam' | 'invalid' } {
  if (typeof body !== 'object' || body === null) return { ok: false, reason: 'invalid' };
  const honeypot = (body as Record<string, unknown>).website;
  if (typeof honeypot === 'string' && honeypot.length > 0) return { ok: false, reason: 'spam' };
  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) return { ok: false, reason: 'invalid' };
  return { ok: true, lead: parsed.data };
}
