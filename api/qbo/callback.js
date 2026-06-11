// QuickBooks Online OAuth redirect handler (production token mint).
// Intuit redirects here with ?code=...&realmId=...&state=... after the user
// approves. We exchange the code for tokens and display the refresh token +
// realm id ONCE so you can paste them into the Railway worker. This function
// never touches the database — it only needs the QBO client id/secret.
//
// Required env vars on this Vercel project:
//   QBO_CLIENT_ID, QBO_CLIENT_SECRET
//   QBO_REDIRECT_URI  - must EXACTLY match the one registered with Intuit
//   QBO_OAUTH_STATE   - same random secret string used by /api/qbo/connect

const TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';

function esc(s) {
  return String(s == null ? '' : s).replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])
  );
}

function page(title, bodyHtml) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} — QBO Connect</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
         max-width: 760px; margin: 48px auto; padding: 0 22px; color: #1d1d1f; line-height: 1.5; }
  h1 { font-size: 28px; letter-spacing: -0.02em; }
  .warn { background: #fff4e5; border: 1px solid #ffd591; padding: 14px 16px; border-radius: 10px; }
  table { width: 100%; border-collapse: collapse; margin-top: 20px; }
  th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #d2d2d7; vertical-align: top; }
  th { width: 200px; color: #424245; }
  code { font-family: "SF Mono", Menlo, Consolas, monospace; font-size: 13px; word-break: break-all; }
  pre { background: #f5f5f7; padding: 14px; border-radius: 10px; overflow-x: auto; }
  a { color: #0071e3; }
</style></head><body><h1>${esc(title)}</h1>${bodyHtml}</body></html>`;
}

module.exports = async (req, res) => {
  const { code, realmId, state, error, error_description } = req.query || {};
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  if (error) {
    res.statusCode = 400;
    res.end(page('Authorization failed', `<p>${esc(error)}: ${esc(error_description)}</p>
      <p><a href="/api/qbo/connect">Try again</a></p>`));
    return;
  }

  const expectedState = process.env.QBO_OAUTH_STATE;
  if (expectedState && state !== expectedState) {
    res.statusCode = 400;
    res.end(page('State mismatch',
      `<p>The <code>state</code> value did not match. Start again from <a href="/api/qbo/connect">/api/qbo/connect</a>.</p>`));
    return;
  }

  if (!code) {
    res.statusCode = 400;
    res.end(page('Missing code', `<p>No authorization <code>code</code> was present in the request.</p>`));
    return;
  }

  const clientId = process.env.QBO_CLIENT_ID;
  const clientSecret = process.env.QBO_CLIENT_SECRET;
  const redirectUri =
    process.env.QBO_REDIRECT_URI || 'https://goliath.solutions/api/qbo/callback';

  if (!clientId || !clientSecret) {
    res.statusCode = 500;
    res.end(page('Not configured',
      `<p>QBO_CLIENT_ID / QBO_CLIENT_SECRET are not set on this deployment.</p>`));
    return;
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
  });

  let data;
  try {
    const r = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
    data = await r.json();
    if (!r.ok) {
      res.statusCode = 502;
      res.end(page('Token exchange failed', `<pre>${esc(JSON.stringify(data, null, 2))}</pre>`));
      return;
    }
  } catch (e) {
    res.statusCode = 502;
    res.end(page('Token exchange error', `<pre>${esc(e && e.message)}</pre>`));
    return;
  }

  const rows = [
    ['Realm ID (QBO_REALM_ID)', realmId || '(not provided)'],
    ['Refresh token (QBO_REFRESH_TOKEN)', data.refresh_token],
    ['Access token', data.access_token],
    ['Access token expires in (s)', data.expires_in],
    ['Refresh token expires in (s)', data.x_refresh_token_expires_in],
  ]
    .map(([k, v]) => `<tr><th>${esc(k)}</th><td><code>${esc(v)}</code></td></tr>`)
    .join('');

  res.statusCode = 200;
  res.end(page('QuickBooks connected', `
    <p class="warn"><strong>Copy these now — shown only once.</strong> They grant access to your QuickBooks company. Paste <code>QBO_REFRESH_TOKEN</code> and <code>QBO_REALM_ID</code> into the Railway worker's environment, then run a cycle so the worker seeds the rotating token into the <code>oauth_tokens</code> table.</p>
    <table>${rows}</table>
    <p style="margin-top:24px;color:#6e6e73;font-size:14px;">Do this in a private window. Once you've captured the values, you can remove the QBO env vars from this Vercel project — the worker owns the token from here on.</p>
  `));
};
