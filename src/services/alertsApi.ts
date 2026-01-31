/**
 * Environment Canada Weather Alerts Service
 * Fetches official weather warnings for Halifax, Nova Scotia
 * 
 * Architecture:
 * - Frontend fetches from /api/alerts
 * - Cloudflare Worker (src/worker.ts) intercepts /api/alerts
 * - Worker fetches XML from Environment Canada (server-side)
 * - Worker returns XML to frontend
 * 
 * This works in:
 * 1. Development (via @cloudflare/vite-plugin)
 * 2. Production (via Cloudflare Workers)
 */

export interface WeatherAlert {
    id: string;
    type: AlertType;
    severity: AlertSeverity;
    title: string;
    headline: string;
    description: string;
    instruction: string;
    areas: string[];
    effective: Date;
    expires: Date;
    isActive: boolean;
    isUpcoming: boolean;
    urgency: 'Immediate' | 'Expected' | 'Future' | 'Past' | 'Unknown';
    certainty: 'Observed' | 'Likely' | 'Possible' | 'Unlikely' | 'Unknown';
}

export type AlertType =
    | 'winter_storm_warning'
    | 'winter_storm_watch'
    | 'blizzard_warning'
    | 'snowfall_warning'
    | 'freezing_rain_warning'
    | 'wind_warning'
    | 'hurricane_warning'
    | 'hurricane_watch'
    | 'tropical_storm_warning'
    | 'severe_thunderstorm_warning'
    | 'severe_thunderstorm_watch'
    | 'tornado_warning'
    | 'tornado_watch'
    | 'fog_advisory'
    | 'special_weather_statement'
    | 'weather_advisory'
    | 'heat_warning'
    | 'cold_warning'
    | 'storm_surge_warning'
    | 'unknown';

export type AlertSeverity = 'extreme' | 'severe' | 'moderate' | 'minor' | 'unknown';

// The API route handled by our Cloudflare Worker
const ALERTS_API_ENDPOINT = '/api/alerts';

/**
 * Format date to Atlantic Canada timezone
 */
function formatToAtlanticTime(date: Date): string {
    return date.toLocaleString('en-CA', {
        timeZone: 'America/Halifax',
        dateStyle: 'medium',
        timeStyle: 'short'
    });
}

/**
 * Parse alert type from title
 */
function parseAlertType(title: string): AlertType {
    const lowerTitle = title.toLowerCase();

    if (lowerTitle.includes('blizzard') && lowerTitle.includes('warning')) return 'blizzard_warning';
    if (lowerTitle.includes('winter storm') && lowerTitle.includes('warning')) return 'winter_storm_warning';
    if (lowerTitle.includes('winter storm') && lowerTitle.includes('watch')) return 'winter_storm_watch';
    if (lowerTitle.includes('snowfall') && lowerTitle.includes('warning')) return 'snowfall_warning';
    if (lowerTitle.includes('freezing rain') || lowerTitle.includes('freezing drizzle')) return 'freezing_rain_warning';
    if (lowerTitle.includes('wind') && lowerTitle.includes('warning')) return 'wind_warning';
    if (lowerTitle.includes('hurricane') && lowerTitle.includes('warning')) return 'hurricane_warning';
    if (lowerTitle.includes('hurricane') && lowerTitle.includes('watch')) return 'hurricane_watch';
    if (lowerTitle.includes('tropical storm')) return 'tropical_storm_warning';
    if (lowerTitle.includes('severe thunderstorm') && lowerTitle.includes('warning')) return 'severe_thunderstorm_warning';
    if (lowerTitle.includes('severe thunderstorm') && lowerTitle.includes('watch')) return 'severe_thunderstorm_watch';
    if (lowerTitle.includes('tornado') && lowerTitle.includes('warning')) return 'tornado_warning';
    if (lowerTitle.includes('tornado') && lowerTitle.includes('watch')) return 'tornado_watch';
    if (lowerTitle.includes('fog')) return 'fog_advisory';
    if (lowerTitle.includes('heat')) return 'heat_warning';
    if (lowerTitle.includes('cold') || lowerTitle.includes('extreme cold')) return 'cold_warning';
    if (lowerTitle.includes('storm surge')) return 'storm_surge_warning';
    if (lowerTitle.includes('special weather')) return 'special_weather_statement';
    if (lowerTitle.includes('advisory')) return 'weather_advisory';

    return 'unknown';
}

/**
 * Determine alert severity from type
 */
function getAlertSeverity(type: AlertType, title: string): AlertSeverity {
    const lowerTitle = title.toLowerCase();

    // Extreme - life threatening
    if (['tornado_warning', 'hurricane_warning', 'blizzard_warning'].includes(type)) {
        return 'extreme';
    }

    // Severe - dangerous conditions
    if ([
        'winter_storm_warning',
        'severe_thunderstorm_warning',
        'tropical_storm_warning',
        'storm_surge_warning'
    ].includes(type)) {
        return 'severe';
    }

    // Moderate - significant weather
    if ([
        'freezing_rain_warning',
        'snowfall_warning',
        'wind_warning',
        'winter_storm_watch',
        'tornado_watch',
        'severe_thunderstorm_watch',
        'hurricane_watch'
    ].includes(type)) {
        return 'moderate';
    }

    // Minor - advisories
    if ([
        'fog_advisory',
        'weather_advisory',
        'special_weather_statement',
        'heat_warning',
        'cold_warning'
    ].includes(type)) {
        return lowerTitle.includes('warning') ? 'moderate' : 'minor';
    }

    return 'unknown';
}

/**
 * Check if alert is currently active or upcoming
 */
function getAlertStatus(effective: Date, expires: Date): { isActive: boolean; isUpcoming: boolean } {
    const now = new Date();
    const isActive = now >= effective && now <= expires;
    const isUpcoming = now < effective;

    return { isActive, isUpcoming };
}

/**
 * Parse Environment Canada RSS XML
 */
/**
 * Parse MSC GeoMet API JSON
 */
function parseWeatherAlerts(json: any): WeatherAlert[] {
    if (!json.warnings || !Array.isArray(json.warnings)) {
        return [];
    }

    const alerts: WeatherAlert[] = [];

    json.warnings.forEach((warning: any, index: number) => {
        const descriptionEn = warning.description?.en || '';
        if (!descriptionEn) return;

        // Parse alert type and severity
        const type = parseAlertType(descriptionEn);
        const severity = getAlertSeverity(type, descriptionEn);

        // Parse dates
        const effective = warning.eventIssue?.en ? new Date(warning.eventIssue.en) : new Date();
        const expires = warning.expiryTime?.en ? new Date(warning.expiryTime.en) : new Date();

        // Default expiry if invalid
        if (isNaN(expires.getTime())) {
            expires.setHours(new Date().getHours() + 24);
        }

        const { isActive, isUpcoming } = getAlertStatus(effective, expires);

        // Only include active or upcoming alerts
        if (!isActive && !isUpcoming) return;

        alerts.push({
            id: `ec-${index}-${effective.getTime()}`,
            type,
            severity,
            title: descriptionEn,
            headline: descriptionEn,
            description: `Please visit the official Environment Canada website for full details: ${warning.url?.en || ''}`,
            instruction: 'Monitor conditions and follow official guidance.',
            areas: ['Halifax', 'Halifax Metro'],
            effective,
            expires,
            isActive,
            isUpcoming,
            urgency: isActive ? 'Immediate' : 'Expected',
            certainty: severity === 'extreme' || severity === 'severe' ? 'Likely' : 'Possible'
        });
    });

    // Sort by severity then by effective date
    const severityOrder: Record<AlertSeverity, number> = {
        extreme: 0,
        severe: 1,
        moderate: 2,
        minor: 3,
        unknown: 4
    };

    alerts.sort((a, b) => {
        const sevDiff = severityOrder[a.severity] - severityOrder[b.severity];
        if (sevDiff !== 0) return sevDiff;
        return a.effective.getTime() - b.effective.getTime();
    });

    return alerts;
}

/**
 * Fetch weather alerts via our backend proxy
 */
export async function fetchWeatherAlerts(): Promise<WeatherAlert[]> {
    try {
        console.log('Fetching alerts from:', ALERTS_API_ENDPOINT);
        const response = await fetch(ALERTS_API_ENDPOINT, {
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`API returned ${response.status}`);
        }

        const json = await response.json();
        return parseWeatherAlerts(json);
    } catch (error) {
        console.error('Error fetching weather alerts:', error);
        return [];
    }
}

/**
 * Get alert emoji
 */
export function getAlertEmoji(type: AlertType): string {
    const emojis: Record<AlertType, string> = {
        winter_storm_warning: '🌨️',
        winter_storm_watch: '🌨️',
        blizzard_warning: '❄️',
        snowfall_warning: '🌨️',
        freezing_rain_warning: '🧊',
        wind_warning: '💨',
        hurricane_warning: '🌪️',
        hurricane_watch: '🌀',
        tropical_storm_warning: '🌀',
        severe_thunderstorm_warning: '⛈️',
        severe_thunderstorm_watch: '⛈️',
        tornado_warning: '🌪️',
        tornado_watch: '🌪️',
        fog_advisory: '🌫️',
        special_weather_statement: '⚠️',
        weather_advisory: '⚠️',
        heat_warning: '🔥',
        cold_warning: '🥶',
        storm_surge_warning: '🌊',
        unknown: '⚠️'
    };
    return emojis[type];
}

/**
 * Get alert color based on severity
 */
export function getAlertColor(severity: AlertSeverity): string {
    switch (severity) {
        case 'extreme': return '#dc2626'; // Red
        case 'severe': return '#ea580c';  // Orange
        case 'moderate': return '#d97706'; // Amber
        case 'minor': return '#ca8a04';   // Yellow
        default: return '#6b7280';        // Gray
    }
}

/**
 * Map alert type to weather condition for overlay
 */
export function alertTypeToCondition(type: AlertType): string | null {
    const mapping: Partial<Record<AlertType, string>> = {
        blizzard_warning: 'blizzard',
        winter_storm_warning: 'blizzard',
        snowfall_warning: 'heavy_snow',
        freezing_rain_warning: 'freezing_rain',
        hurricane_warning: 'hurricane',
        hurricane_watch: 'hurricane',
        tropical_storm_warning: 'hurricane',
        severe_thunderstorm_warning: 'thunderstorm',
        severe_thunderstorm_watch: 'thunderstorm',
        tornado_warning: 'thunderstorm',
        fog_advisory: 'fog',
        wind_warning: 'heavy_rain'
    };
    return mapping[type] || null;
}

/**
 * Format time remaining until alert expires
 */
export function formatTimeRemaining(expires: Date): string {
    const now = new Date();
    const diff = expires.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
        const days = Math.floor(hours / 24);
        return `${days} day${days > 1 ? 's' : ''} remaining`;
    }
    if (hours > 0) {
        return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
}

/**
 * Format date for display in Atlantic Time
 */
export function formatAlertTime(date: Date): string {
    return formatToAtlanticTime(date);
}
