/**
 * Cloudflare Worker Entry Point (JS)
 * Proxies external data for the application
 */

const EC_ALERTS_URL = 'https://weather.gc.ca/rss/city/ns-19_e.xml';
const BRIDGE_DATA_URL = 'https://halifaxharbourbridges.ca/';

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        // API: Weather Alerts
        if (url.pathname === '/api/alerts') {
            return handleProxyRequest(request, EC_ALERTS_URL, 'application/xml; charset=utf-8');
        }

        // API: Bridge Traffic
        if (url.pathname === '/api/traffic') {
            return handleProxyRequest(request, BRIDGE_DATA_URL, 'text/html; charset=utf-8');
        }

        // Serve static assets (React App)
        if (env.ASSETS) {
            return env.ASSETS.fetch(request);
        }

        return new Response('Not Found', { status: 404 });
    },
};

/**
 * Generic Proxy Handler
 */
async function handleProxyRequest(request, targetUrl, contentType) {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=60', // 1 minute cache
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Referer': 'https://weather.gc.ca/',
                'Accept': 'application/xml, text/xml, */*',
            },
        });

        if (!response.ok) {
            return new Response(
                JSON.stringify({ error: `Upstream returned ${response.status}` }),
                { status: response.status, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
            );
        }

        const data = await response.text();

        return new Response(data, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                ...corsHeaders,
            },
        });
    } catch (error) {
        return new Response(
            JSON.stringify({ error: 'Failed to fetch upstream data' }),
            { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
    }
}
