// One-time QuickBooks Online OAuth kickoff.
// Visit https://goliath.solutions/api/qbo/connect to start the production
// authorization. It redirects to Intuit, you approve, and Intuit sends you
// back to /api/qbo/callback which displays the refresh token + realm id.
//
// Required env vars on this Vercel project:
//   QBO_CLIENT_ID      - production app client id (Intuit "FBP - bookkeeper")
//   QBO_REDIRECT_URI   - https://goliath.solutions/api/qbo/callback
//   QBO_OAUTH_STATE    - any random secret string (CSRF guard; same value used in callback)
//   QBO_SCOPES         - optional; defaults to accounting scope

const AUTH_URL = 'https://appcenter.intuit.com/connect/oauth2';

module.exports = (req, res) => {
  const clientId = process.env.QBO_CLIENT_ID;
  const redirectUri =
    process.env.QBO_REDIRECT_URI || 'https://goliath.solutions/api/qbo/callback';
  const scope = process.env.QBO_SCOPES || 'com.intuit.quickbooks.accounting';
  const state = process.env.QBO_OAUTH_STATE || 'fbp-bookkeeper';

  if (!clientId) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain');
    res.end('QBO_CLIENT_ID is not set on this deployment.');
    return;
  }

  const url = new URL(AUTH_URL);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', scope);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('state', state);

  res.statusCode = 302;
  res.setHeader('Location', url.toString());
  res.setHeader('Cache-Control', 'no-store');
  res.end();
};
