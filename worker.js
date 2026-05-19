// ============================================================
//  Avakin Share — Cloudflare Worker
//  GitHub API Proxy — Token burada güvenle saklanır
// ============================================================

// ⬇️ BURAYA KENDİ TOKEN'INI YAZ (Cloudflare Dashboard > Workers > Settings > Variables)
// Ya da aşağıya direkt yapıştır (sadece Worker kodunda kalır, GitHub'a gitmez):
const GH_TOKEN = 'BURAYA_TOKENINI_YAZ';

// Sitenin yayınlandığı domain (CORS için) — kendi GitHub Pages adresin:
const ALLOWED_ORIGIN = 'https://forsdev101.github.io';

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders(request),
      });
    }

    const url = new URL(request.url);

    // Gelen istek: /proxy?url=https://api.github.com/...
    const targetUrl = url.searchParams.get('url');
    if (!targetUrl || !targetUrl.startsWith('https://api.github.com/')) {
      return new Response('Geçersiz istek', { status: 400, headers: corsHeaders(request) });
    }

    // GitHub API'ye ilet
    const ghRequest = new Request(targetUrl, {
      method: request.method,
      headers: {
        'Authorization': `token ${GH_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'AvakinShare-Worker',
      },
      body: request.method !== 'GET' ? request.body : undefined,
    });

    const ghResponse = await fetch(ghRequest);
    const responseBody = await ghResponse.text();

    return new Response(responseBody, {
      status: ghResponse.status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders(request),
      },
    });
  },
};

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  const allowed = origin === ALLOWED_ORIGIN || origin.includes('localhost') || origin.includes('127.0.0.1');
  return {
    'Access-Control-Allow-Origin': allowed ? origin : ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
