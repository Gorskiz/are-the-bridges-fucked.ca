/**
 * Cloudflare Worker Entry Point
 * Handles API routes and serves static assets
 * 
 * This worker proxies Environment Canada weather alerts
 * and serves the React SPA for all other routes
 */

interface Env {
    ASSETS: Fetcher;
}

// Environment Canada API feed for Halifax, NS (Stanfield)
const EC_ALERTS_URL = 'https://api.weather.gc.ca/collections/citypageweather-realtime/items/ns-19?f=json';

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url);

        // API route: /api/alerts - Proxy Environment Canada RSS
        if (url.pathname === '/api/alerts') {
            return handleAlertsRequest(request);
        }

        // For all other routes, serve static assets (React SPA)
        return env.ASSETS.fetch(request);
    },
};

/**
 * Handle /api/alerts request
 * Proxies Environment Canada RSS feed with CORS headers
 */
async function handleAlertsRequest(request: Request): Promise<Response> {
    // CORS headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
    };

    // Handle preflight
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: corsHeaders,
        });
    }

    try {
        const response = await fetch(EC_ALERTS_URL, {
            headers: {
                'User-Agent': 'AreTheBridgesFucked.ca Weather Alert Service',
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            return new Response(
                JSON.stringify({ error: `Environment Canada returned ${response.status}` }),
                {
                    status: response.status,
                    headers: {
                        'Content-Type': 'application/json',
                        ...corsHeaders,
                    },
                }
            );
        }

        const xml = await response.text();

        return new Response(xml, {
            status: 200,
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                ...corsHeaders,
            },
        });
    } catch (error) {
        console.error('Error fetching alerts:', error);
        return new Response(
            JSON.stringify({ error: 'Failed to fetch weather alerts' }),
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
