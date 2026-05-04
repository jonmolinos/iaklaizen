/**
 * Klaizen — Cloudflare Worker proxy para la API de Anthropic
 *
 * INSTRUCCIONES DE DESPLIEGUE:
 * 1. Ve a https://workers.cloudflare.com y crea una cuenta (gratis)
 * 2. Crea un nuevo Worker
 * 3. Pega este código
 * 4. En "Settings > Variables > Secrets", añade:
 *    - Nombre: ANTHROPIC_API_KEY
 *    - Valor: sk-ant-... (tu API key de Anthropic)
 * 5. Despliega. Anota la URL del worker (ej: klaizen-proxy.tunombre.workers.dev)
 * 6. En klaizen.html, cambia PROXY_URL por esa URL
 */

const ALLOWED_ORIGIN = '*'; // Cambia '*' por 'https://app.klaizen.eu' en producción

export default {
  async fetch(request, env) {

    // Manejar preflight CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(ALLOWED_ORIGIN),
      });
    }

    // Solo aceptar POST
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const body = await request.json();

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders(ALLOWED_ORIGIN),
        },
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders(ALLOWED_ORIGIN),
        },
      });
    }
  },
};

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
