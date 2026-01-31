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

// CORS proxy options for fetching the HTML data
const CORS_PROXIES = [
    'https://api.allorigins.win/raw?url=',
    'https://corsproxy.io/?',
];

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
        if (!trafficGrid) {
            // Try to find traffic data in any paragraph tags
            const allParagraphs = doc.querySelectorAll('p');
            let macdonaldHalifax: TrafficLevel = 'unknown';
            let macdonaldDartmouth: TrafficLevel = 'unknown';
            let mackayHalifax: TrafficLevel = 'unknown';
            let mackayDartmouth: TrafficLevel = 'unknown';

            allParagraphs.forEach((p) => {
                const text = p.textContent || '';
                if (text.includes('Halifax Bound') || text.includes('Dartmouth Bound')) {
                    if (text.includes('Macdonald') || (doc.body.innerHTML.indexOf('Macdonald') < doc.body.innerHTML.indexOf(text))) {
                        if (text.includes('Halifax Bound')) {
                            macdonaldHalifax = parseTrafficLevel(text);
                        } else {
                            macdonaldDartmouth = parseTrafficLevel(text);
                        }
                    } else {
                        if (text.includes('Halifax Bound')) {
                            mackayHalifax = parseTrafficLevel(text);
                        } else {
                            mackayDartmouth = parseTrafficLevel(text);
                        }
                    }
                }
            });
        }

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
 */
export async function fetchTrafficData(): Promise<TrafficData | null> {
    const targetUrl = 'https://halifaxharbourbridges.ca/';

    for (const proxy of CORS_PROXIES) {
        try {
            const response = await fetch(`${proxy}${encodeURIComponent(targetUrl)}`);
            if (!response.ok) continue;

            const html = await response.text();
            const data = parseTrafficHtml(html);

            if (data) {
                return data;
            }
        } catch (error) {
            console.warn(`CORS proxy ${proxy} failed:`, error);
            continue;
        }
    }

    // If all proxies fail, return mock data for development
    console.warn('All CORS proxies failed, using fallback data');
    return getFallbackTrafficData();
}

/**
 * Fallback/mock data for development or when API is unavailable
 */
function getFallbackTrafficData(): TrafficData {
    const macdonald: Bridge = {
        name: 'Macdonald',
        halifaxBound: {
            direction: 'Halifax Bound',
            level: 'light',
            cameraUrl: CAMERA_URLS.macdonald.halifax,
        },
        dartmouthBound: {
            direction: 'Dartmouth Bound',
            level: 'light',
            cameraUrl: CAMERA_URLS.macdonald.dartmouth,
        },
    };

    const mackay: Bridge = {
        name: 'MacKay',
        halifaxBound: {
            direction: 'Halifax Bound',
            level: 'light',
            cameraUrl: CAMERA_URLS.mackay.halifax,
        },
        dartmouthBound: {
            direction: 'Dartmouth Bound',
            level: 'light',
            cameraUrl: CAMERA_URLS.mackay.dartmouth,
        },
    };

    return {
        macdonald,
        mackay,
        lastUpdated: new Date(),
        isFucked: false,
        fuckLevel: 'not',
    };
}

/**
 * Get camera image URLs for cache-busting
 */
export function getCameraImageUrl(url: string): string {
    return `${url}?t=${Date.now()}`;
}

export { CAMERA_URLS };
