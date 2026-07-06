import { describe, expect, it } from 'vitest';
import { parseLead } from './validate';

const valid = {
  name: 'Mike Rowe',
  trade: 'Plumbing',
  phone: '(561) 555-0100',
  city: 'West Palm Beach',
  message: 'Need a new site',
  website: '',
};

describe('parseLead', () => {
  it('accepts a valid lead', () => {
    const r = parseLead(valid);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.lead.name).toBe('Mike Rowe');
  });

  it('accepts a lead with message omitted', () => {
    const { message, ...rest } = valid;
    expect(parseLead(rest).ok).toBe(true);
  });

  it('rejects missing phone as invalid', () => {
    const { phone, ...rest } = valid;
    const r = parseLead(rest);
    expect(r).toEqual({ ok: false, reason: 'invalid' });
  });

  it('rejects a phone with letters as invalid', () => {
    const r = parseLead({ ...valid, phone: 'call me maybe' });
    expect(r).toEqual({ ok: false, reason: 'invalid' });
  });

  it('flags filled honeypot as spam', () => {
    const r = parseLead({ ...valid, website: 'https://spam.example' });
    expect(r).toEqual({ ok: false, reason: 'spam' });
  });

  it('rejects oversized message as invalid', () => {
    const r = parseLead({ ...valid, message: 'x'.repeat(2001) });
    expect(r).toEqual({ ok: false, reason: 'invalid' });
  });

  it('rejects non-object body as invalid', () => {
    expect(parseLead('nope')).toEqual({ ok: false, reason: 'invalid' });
  });
});
