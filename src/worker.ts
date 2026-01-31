/**
 * Cloudflare Worker Entry Point
 * Handles API routes and serves static assets
 * 
 * This worker proxies:
 * 1. Environment Canada weather alerts (JSON)
 * 2. Halifax Harbour Bridges traffic data (HTML)
 * And serves the React SPA for all other routes
 */

import type { Fetcher } from '@cloudflare/workers-types';

interface Env {
    ASSETS: Fetcher;
}

// Environment Canada API feed for Halifax, NS (Stanfield) - JSON format
const EC_ALERTS_URL = 'https://api.weather.gc.ca/collections/citypageweather-realtime/items/ns-19?f=json';
// Halifax Harbour Bridges Website
const BRIDGE_DATA_URL = 'https://halifaxharbourbridges.ca/';

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url);

        // API route: /api/alerts - Proxy Environment Canada JSON
        if (url.pathname === '/api/alerts') {
            return handleProxyRequest(request, EC_ALERTS_URL, 'application/json');
        }

        // API route: /api/traffic - Proxy Bridge Website HTML
        if (url.pathname === '/api/traffic') {
            return handleProxyRequest(request, BRIDGE_DATA_URL, 'text/html; charset=utf-8');
        }

        // For all other routes, serve static assets (React SPA)
        // This requires [assets] binding in wrangler.toml
        if (env.ASSETS) {
            const response = await env.ASSETS.fetch(request);
            // SPA Fallback: If asset not found and not an API route, serve index.html
            if (response.status === 404 && !url.pathname.startsWith('/api/')) {
                return env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request));
            }
            return response;
        }

        return new Response('Not Found', { status: 404 });
    },
};

/**
 * Handle Proxy Request
 * Fetches data from upstream and returns it with CORS headers
 */
async function handleProxyRequest(request: Request, targetUrl: string, contentType: string): Promise<Response> {
    // CORS headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=60', // 1 minute cache
    };

    // Handle preflight
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: corsHeaders,
        });
    }

    try {
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'AreTheBridgesFucked.ca/1.0 (Cloudflare Worker)',
                'Accept': contentType === 'application/json' ? 'application/json' : 'text/html,application/xhtml+xml',
            },
        });

        if (!response.ok) {
            return new Response(
                JSON.stringify({ error: `Upstream returned ${response.status}` }),
                {
                    status: response.status,
                    headers: {
                        'Content-Type': 'application/json',
                        ...corsHeaders,
                    },
                }
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
        console.error('Error fetching upstream data:', error);
        return new Response(
            JSON.stringify({ error: 'Failed to fetch upstream data' }),
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders,
                },
            }
        );
    }
}
