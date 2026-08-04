import type { Handle } from '@sveltejs/kit';

const API_TARGET = process.env.API_URL || 'http://127.0.0.1:3005';

export const handle: Handle = async ({ event, resolve }) => {
  const { pathname, search } = event.url;

  // Transparently proxy /api, /ws, and /storage requests to Fastify API Backend
  if (pathname.startsWith('/api') || pathname.startsWith('/ws') || pathname.startsWith('/storage')) {
    const targetUrl = `${API_TARGET}${pathname}${search}`;

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
      console.error('❌ API Proxy Error in hooks.server.ts:', err?.message || err);
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: 'API_CONNECTION_ERROR', message: 'Gagal terhubung ke API backend Fastify' }
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
