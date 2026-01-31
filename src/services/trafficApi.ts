/**
 * Traffic API Service for Halifax Harbour Bridges
 * 
 * This service scrapes the halifaxharbourbridges.ca website to extract
 * real-time traffic data since they don't expose a public API.
 */

import type { TrafficData, TrafficLevel, Bridge } from '../types/traffic';

// Camera image URLs (these are publicly accessible and update periodically)
const CAMERA_URLS = {
    macdonald: {
        dartmouth: 'https://halifaxharbourbridges.ca/wp-content/traffic_cam_images/macdonald-dartmouth-bound.png',
        halifax: 'https://halifaxharbourbridges.ca/wp-content/traffic_cam_images/macdonald-halifax-bound.png',
    },
    mackay: {
        dartmouth: 'https://halifaxharbourbridges.ca/wp-content/traffic_cam_images/mackay-dartmouth-bound.png',
        halifax: 'https://halifaxharbourbridges.ca/wp-content/traffic_cam_images/mackay-halifax-bound.png',
    },
};

/**
 * Parse traffic level from text content
 */
function parseTrafficLevel(text: string): TrafficLevel {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('heavy') || lowerText.includes('high')) return 'heavy';
    if (lowerText.includes('moderate') || lowerText.includes('medium')) return 'moderate';
    if (lowerText.includes('light') || lowerText.includes('low')) return 'light';
    if (lowerText.includes('closed')) return 'closed';
    return 'unknown';
}

/**
 * Calculate if the bridges are "fucked" based on traffic levels
 */
function calculateFuckLevel(macdonald: Bridge, mackay: Bridge): { isFucked: boolean; fuckLevel: 'not' | 'kinda' | 'very' | 'absolutely' } {
    const levels = [
        macdonald.halifaxBound.level,
        macdonald.dartmouthBound.level,
        mackay.halifaxBound.level,
        mackay.dartmouthBound.level,
    ];

    const closedCount = levels.filter(l => l === 'closed').length;
    const heavyCount = levels.filter(l => l === 'heavy').length;
    const moderateCount = levels.filter(l => l === 'moderate').length;

    // Determine fuck level based on traffic conditions
    if (closedCount >= 2) {
        return { isFucked: true, fuckLevel: 'absolutely' };
    }
    if (closedCount >= 1 || heavyCount >= 3) {
        return { isFucked: true, fuckLevel: 'very' };
    }
    if (heavyCount >= 2 || (heavyCount >= 1 && moderateCount >= 2)) {
        return { isFucked: true, fuckLevel: 'kinda' };
    }

    return { isFucked: false, fuckLevel: 'not' };
}

/**
 * Extract traffic data from the HTML of halifaxharbourbridges.ca
 */
function parseTrafficHtml(html: string): TrafficData | null {
    try {
        // Create a DOM parser
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Find the traffic info grid
        const trafficGrid = doc.querySelector('.traffic-info-grid');

        // Parse the four traffic cards (Macdonald Dartmouth, Macdonald Halifax, MacKay Dartmouth, MacKay Halifax)
        const cards = trafficGrid?.querySelectorAll('.post-thumb-wrapper') || [];

        let macdonaldDartmouth: TrafficLevel = 'unknown';
        let macdonaldHalifax: TrafficLevel = 'unknown';
        let mackayDartmouth: TrafficLevel = 'unknown';
        let mackayHalifax: TrafficLevel = 'unknown';

        cards.forEach((card, index) => {
            const paragraph = card.querySelector('.post-details p');
            const text = paragraph?.textContent || '';
            const level = parseTrafficLevel(text);

            // Cards are ordered: Mac Dartmouth, Mac Halifax, MacKay Dartmouth, MacKay Halifax
            switch (index) {
                case 0: macdonaldDartmouth = level; break;
                case 1: macdonaldHalifax = level; break;
                case 2: mackayDartmouth = level; break;
                case 3: mackayHalifax = level; break;
            }
        });

        const macdonald: Bridge = {
            name: 'Macdonald',
            halifaxBound: {
                direction: 'Halifax Bound',
                level: macdonaldHalifax,
                cameraUrl: CAMERA_URLS.macdonald.halifax,
            },
            dartmouthBound: {
                direction: 'Dartmouth Bound',
                level: macdonaldDartmouth,
                cameraUrl: CAMERA_URLS.macdonald.dartmouth,
            },
        };

        const mackay: Bridge = {
            name: 'MacKay',
            halifaxBound: {
                direction: 'Halifax Bound',
                level: mackayHalifax,
                cameraUrl: CAMERA_URLS.mackay.halifax,
            },
            dartmouthBound: {
                direction: 'Dartmouth Bound',
                level: mackayDartmouth,
                cameraUrl: CAMERA_URLS.mackay.dartmouth,
            },
        };

        const { isFucked, fuckLevel } = calculateFuckLevel(macdonald, mackay);

        return {
            macdonald,
            mackay,
            lastUpdated: new Date(),
            isFucked,
            fuckLevel,
        };
    } catch (error) {
        console.error('Error parsing traffic HTML:', error);
        return null;
    }
}

/**
 * Fetch traffic data from Halifax Harbour Bridges website
 * Uses local /api/traffic endpoint (proxied to Cloudflare Worker or Vite Dev Server)
 */
export async function fetchTrafficData(): Promise<TrafficData | null> {
    try {
        console.log('Fetching traffic data from /api/traffic');
        const response = await fetch('/api/traffic');

        if (!response.ok) {
            throw new Error(`API returned ${response.status}`);
        }

        const html = await response.text();
        const data = parseTrafficHtml(html);

        if (data) {
            console.log('Successfully fetched and parsed traffic data');
            return data;
        }

        console.warn('Failed to parse traffic data from HTML');
    } catch (error) {
        console.error('Error fetching traffic data:', error);
    }

    return null;
}

/**
 * Get camera image URLs for cache-busting
 */
export function getCameraImageUrl(url: string): string {
    return `${url}?t=${Date.now()}`;
}

export { CAMERA_URLS };
