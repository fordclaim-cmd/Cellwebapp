import { describe, expect, it } from 'vitest';
import { parseLead } from './validate';

const valid = {
  service: 'Local SEO',
  name: 'Mike Rowe',
  phone: '(561) 555-0100',
  businessName: "Rowe's Plumbing",
  email: 'mike@rowesplumbing.com',
  trade: 'Plumbing',
  city: 'West Palm Beach',
  currentWebsite: 'rowesplumbing.com',
  message: 'Need to rank higher',
  _hp: '',
};

describe('parseLead', () => {
  it('accepts a full valid lead and normalizes the phone to E.164', () => {
    const r = parseLead(valid);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.lead.name).toBe('Mike Rowe');
      expect(r.lead.phone).toBe('+15615550100');
      expect(r.lead.service).toBe('Local SEO');
    }
  });

  it('accepts a minimal lead — just name + phone', () => {
    const r = parseLead({ name: 'Mike Rowe', phone: '561-555-0100' });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.lead.email).toBe('');
      expect(r.lead.service).toBe('');
      expect(r.lead.marketingConsent).toBe(false);
    }
  });

  it('accepts 11-digit numbers led by 1', () => {
    const r = parseLead({ name: 'Mike Rowe', phone: '1 561 555 0100' });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.lead.phone).toBe('+15615550100');
  });

  it('records marketing consent when the box is ticked', () => {
    const r = parseLead({ ...valid, marketing_consent: 'on' });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.lead.marketingConsent).toBe(true);
  });

  it('rejects a missing name', () => {
    const { name, ...rest } = valid;
    expect(parseLead(rest)).toEqual({ ok: false, reason: 'invalid' });
  });

  it('rejects a missing phone', () => {
    const { phone, ...rest } = valid;
    expect(parseLead(rest)).toEqual({ ok: false, reason: 'invalid' });
  });

  it('rejects a symbol-only phone with no digits', () => {
    expect(parseLead({ ...valid, phone: '(((---   +++' })).toEqual({ ok: false, reason: 'invalid' });
  });

  it('rejects a phone whose area code starts with 0 or 1', () => {
    expect(parseLead({ ...valid, phone: '(161) 555-0100' })).toEqual({ ok: false, reason: 'invalid' });
  });

  it('rejects a malformed email when one is provided', () => {
    expect(parseLead({ ...valid, email: 'not-an-email' })).toEqual({ ok: false, reason: 'invalid' });
  });

  it('flags a filled honeypot as spam', () => {
    expect(parseLead({ ...valid, _hp: 'http://spam.example' })).toEqual({ ok: false, reason: 'spam' });
  });

  it('rejects a non-object body', () => {
    expect(parseLead('nope')).toEqual({ ok: false, reason: 'invalid' });
  });

  it('truncates an oversized message instead of rejecting', () => {
    const r = parseLead({ ...valid, message: 'x'.repeat(5000) });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.lead.message.length).toBe(2000);
  });
});
