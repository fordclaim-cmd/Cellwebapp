import { beforeEach, describe, expect, it, vi } from 'vitest';
import handler from './lead';

function mockRes() {
  const res: any = {};
  res.statusCode = 0;
  res.body = undefined;
  res.status = vi.fn((code: number) => ((res.statusCode = code), res));
  res.json = vi.fn((payload: unknown) => ((res.body = payload), res));
  return res;
}

const valid = {
  service: 'Local SEO',
  name: 'Mike Rowe',
  phone: '(561) 555-0100',
  trade: 'Plumbing',
  city: 'West Palm Beach',
  message: '',
  _hp: '',
};

describe('POST /api/lead', () => {
  beforeEach(() => {
    delete process.env.RESEND_API_KEY;
    vi.restoreAllMocks();
  });

  it('rejects non-POST with 405', async () => {
    const res = mockRes();
    await handler({ method: 'GET', body: {} } as any, res);
    expect(res.statusCode).toBe(405);
  });

  it('returns 400 for invalid body', async () => {
    const res = mockRes();
    await handler({ method: 'POST', body: { name: 'x' } } as any, res);
    expect(res.statusCode).toBe(400);
  });

  it('returns 200 ok for spam without sending email', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const res = mockRes();
    await handler({ method: 'POST', body: { ...valid, _hp: 'spam' } } as any, res);
    expect(res.statusCode).toBe(200);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('returns 200 and logs when RESEND_API_KEY is unset', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const res = mockRes();
    await handler({ method: 'POST', body: valid } as any, res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(logSpy).toHaveBeenCalled();
  });

  it('sends via Resend when RESEND_API_KEY is set', async () => {
    process.env.RESEND_API_KEY = 're_test_123';
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{}', { status: 200 }));
    const res = mockRes();
    await handler({ method: 'POST', body: valid } as any, res);
    expect(res.statusCode).toBe(200);
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
