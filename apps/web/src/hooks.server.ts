import type { Handle } from '@sveltejs/kit';

const defaultApiPort = process.env.NODE_ENV === 'production' ? '3005' : '3001';
let API_TARGET = process.env.API_URL || `http://127.0.0.1:${process.env.API_PORT || defaultApiPort}`;

export const handle: Handle = async ({ event, resolve }) => {
  const { pathname, search, port } = event.url;

  // Prevent self-referential loop (if API_TARGET accidentally points to SvelteKit's own port)
  let targetBase = API_TARGET;
  if (port && (targetBase.includes(`:${port}`) || targetBase.includes(`localhost:${port}`))) {
    const fallbackPort = process.env.API_PORT || (process.env.NODE_ENV === 'production' ? '3005' : '3001');
    targetBase = `http://127.0.0.1:${fallbackPort}`;
  }

  // Transparently proxy /api, /ws, and /storage requests to Fastify API Backend
  if (pathname.startsWith('/api') || pathname.startsWith('/ws') || pathname.startsWith('/storage')) {
    const targetUrl = `${targetBase}${pathname}${search}`;

    try {
      const requestHeaders = new Headers(event.request.headers);
      requestHeaders.delete('host');

      const body = ['GET', 'HEAD'].includes(event.request.method)
        ? undefined
        : await event.request.arrayBuffer();

      const response = await fetch(targetUrl, {
        method: event.request.method,
        headers: requestHeaders,
        body,
      });

      const responseHeaders = new Headers(response.headers);

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    } catch (err: any) {
      console.error(`❌ API Proxy Error fetching ${targetUrl}:`, err?.message || err);
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: 'API_CONNECTION_ERROR', message: `Gagal terhubung ke API backend Fastify di ${targetUrl}` }
        }),
        {
          status: 502,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
        }
      );
    }
  }

  return resolve(event);
};
