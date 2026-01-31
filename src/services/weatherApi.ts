/**
 * Weather API Service for Halifax
 * Uses Open-Meteo (free, no API key required!)
 * 
 * Includes proper Maritimer charm and East Coast expressions 🍁
 */

import type { WeatherData, WeatherCondition, WeatherSeverity, OpenMeteoResponse } from '../types/weather';

// Halifax, Nova Scotia coordinates
const HALIFAX_LAT = 44.6488;
const HALIFAX_LON = -63.5752;

// Open-Meteo API endpoint (free, no key needed!)
const API_URL = `https://api.open-meteo.com/v1/forecast?latitude=${HALIFAX_LAT}&longitude=${HALIFAX_LON}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,wind_gusts_10m,precipitation,snowfall,visibility,is_day&timezone=America%2FHalifax`;

/**
 * WMO Weather Codes mapped to our conditions
 * https://open-meteo.com/en/docs
 */
function mapWeatherCode(code: number): WeatherCondition {
    // Clear
    if (code === 0) return 'clear';
    // Mainly clear, partly cloudy
    if (code >= 1 && code <= 2) return 'clear';
    // Overcast
    if (code === 3) return 'cloudy';
    // Fog
    if (code >= 45 && code <= 48) return 'fog';
    // Drizzle
    if (code >= 51 && code <= 55) return 'drizzle';
    // Freezing drizzle/rain
    if (code >= 56 && code <= 57) return 'freezing_rain';
    if (code >= 66 && code <= 67) return 'freezing_rain';
    // Rain
    if (code >= 61 && code <= 63) return 'rain';
    if (code >= 80 && code <= 81) return 'rain';
    // Heavy rain
    if (code === 65 || code === 82) return 'heavy_rain';
    // Snow
    if (code >= 71 && code <= 73) return 'snow';
    if (code >= 85 && code <= 86) return 'snow';
    // Heavy snow / blizzard
    if (code === 75 || code === 77) return 'heavy_snow';
    // Thunderstorm
    if (code >= 95 && code <= 99) return 'thunderstorm';

    return 'unknown';
}

/**
 * Calculate how "fucked" the weather is
 */
function calculateSeverity(data: {
    condition: WeatherCondition;
    windSpeed: number;
    windGusts: number;
    temperature: number;
    feelsLike: number;
    snowfall: number;
    precipitation: number;
    visibility: number;
}): WeatherSeverity {
    const { condition, windSpeed, windGusts, feelsLike, snowfall, visibility } = data;

    // APOCALYPTIC: Hurricane-force winds, major blizzard, or dangerous conditions
    if (windGusts > 100 || (snowfall > 5 && windSpeed > 50) || visibility < 0.1) {
        return 'apocalyptic';
    }

    // FUCKED: Very bad conditions
    if (
        condition === 'blizzard' ||
        condition === 'hurricane' ||
        condition === 'heavy_snow' ||
        windGusts > 70 ||
        feelsLike < -25 ||
        (snowfall > 2 && windSpeed > 30) ||
        visibility < 0.5
    ) {
        return 'fucked';
    }

    // ROUGH: Definitely stay home if you can
    if (
        condition === 'heavy_rain' ||
        condition === 'freezing_rain' ||
        condition === 'thunderstorm' ||
        condition === 'snow' ||
        windSpeed > 50 ||
        feelsLike < -15 ||
        visibility < 1
    ) {
        return 'rough';
    }

    // MEH: Not great, but manageable
    if (
        condition === 'rain' ||
        condition === 'drizzle' ||
        condition === 'fog' ||
        windSpeed > 30 ||
        feelsLike < -5
    ) {
        return 'meh';
    }

    // FINE: Good to go, bud
    return 'fine';
}

/**
 * Get a random Maritimer saying based on weather severity
 * Full of East Coast charm! 🦞
 */
function getMaritimerSaying(severity: WeatherSeverity, condition: WeatherCondition, temp: number): string {
    const sayings: Record<WeatherSeverity, string[]> = {
        apocalyptic: [
            "Holy shit, stay home b'y!",
            "She's right wild out there!",
            "Lord tunderin' Jesus!",
            "Don't even think about it, bud",
            "The bridges are the least of yer worries!",
            "Even the seagulls are hiding",
            "Tim Hortons might be closed, that's how bad",
        ],
        fucked: [
            "IT'S ABSOLUTELY FUCKED OUT THERE!",
            "She's blowin' a gale, b'y!",
            "Wouldn't send the dog out in this",
            "Better grab a double-double and wait it out",
            "The harbour's right angry today",
            "Batten down the hatches!",
            "Perfect donair weather (stay inside)",
        ],
        rough: [
            "It's a bit gnarly out there",
            "Dress warm, bud",
            "She's spittin' sideways",
            "Gonna need the good windshield wipers",
            "Not the day for a walk on the waterfront",
            "Might want that extra coffee",
            "The wind'll cut right through ya",
        ],
        meh: [
            "Could be worse, could be better",
            "Bit damp out there",
            "Standard Halifax, really",
            "You'll live",
            "Nothing a good toque can't fix",
            "Just another day on the East Coast",
            "Bring a jacket, probably",
        ],
        fine: [
            "She's right beautiful out!",
            "Perfect day for the bridges",
            "Go on, get out there!",
            "Rare sunny day, enjoy it b'y!",
            "Even the bridges are happy",
            "Great day for a donair on the waterfront",
            "The harbour's calm as glass",
        ],
    };

    // Add temperature-specific sayings
    if (temp < -20) {
        return "Cold enough to freeze the balls off a brass monkey!";
    }
    if (temp > 30) {
        return "Hotter than a two-dollar pistol!";
    }

    // Add condition-specific overrides
    if (condition === 'fog') {
        const fogSayings = [
            "Can't see the nose on yer face",
            "Pea soup fog, classic Halifax",
            "The fog's rolled in thick",
        ];
        return fogSayings[Math.floor(Math.random() * fogSayings.length)];
    }

    if (condition === 'freezing_rain') {
        return "Black ice special - drive like nan's in the car";
    }

    const options = sayings[severity];
    return options[Math.floor(Math.random() * options.length)];
}

/**
 * Get a short status string
 */
function getShortStatus(severity: WeatherSeverity): string {
    switch (severity) {
        case 'apocalyptic': return "ABSOLUTELY FUCKED";
        case 'fucked': return "IT'S FUCKED";
        case 'rough': return "Rough";
        case 'meh': return "Meh";
        case 'fine': return "All Good";
    }
}

/**
 * Fetch current weather data for Halifax
 */
export async function fetchWeatherData(): Promise<WeatherData | null> {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error(`Weather API error: ${response.status}`);
        }

        const data: OpenMeteoResponse = await response.json();
        const current = data.current;

        const condition = mapWeatherCode(current.weather_code);

        // Check for blizzard conditions (heavy snow + high wind)
        let finalCondition = condition;
        if ((condition === 'heavy_snow' || condition === 'snow') && current.wind_speed_10m > 40) {
            finalCondition = 'blizzard';
        }
        // Check for hurricane-like conditions
        if (current.wind_gusts_10m > 120) {
            finalCondition = 'hurricane';
        }

        const weatherInfo = {
            condition: finalCondition,
            windSpeed: current.wind_speed_10m,
            windGusts: current.wind_gusts_10m,
            temperature: current.temperature_2m,
            feelsLike: current.apparent_temperature,
            snowfall: current.snowfall,
            precipitation: current.precipitation,
            visibility: current.visibility / 1000, // Convert to km
        };

        const severity = calculateSeverity(weatherInfo);
        const maritimerSaying = getMaritimerSaying(severity, finalCondition, current.temperature_2m);

        return {
            temperature: current.temperature_2m,
            feelsLike: current.apparent_temperature,
            windSpeed: current.wind_speed_10m,
            windGusts: current.wind_gusts_10m,
            precipitation: current.precipitation,
            snowfall: current.snowfall,
            humidity: current.relative_humidity_2m,
            visibility: current.visibility / 1000,
            condition: finalCondition,
            conditionCode: current.weather_code,
            isDay: current.is_day === 1,
            lastUpdated: new Date(),
            severity,
            maritimerSaying,
            shortStatus: getShortStatus(severity),
            isFucked: severity === 'fucked' || severity === 'apocalyptic',
        };
    } catch (error) {
        console.error('Error fetching weather data:', error);
        return null;
    }
}

/**
 * Get weather condition emoji
 */
export function getWeatherEmoji(condition: WeatherCondition, isDay: boolean): string {
    const emojis: Record<WeatherCondition, string> = {
        clear: isDay ? '☀️' : '🌙',
        cloudy: '☁️',
        fog: '🌫️',
        drizzle: '🌦️',
        rain: '🌧️',
        heavy_rain: '⛈️',
        freezing_rain: '🧊',
        snow: '🌨️',
        heavy_snow: '❄️',
        blizzard: '❄️',
        thunderstorm: '⛈️',
        hurricane: '🌪️',
        unknown: '🤷',
    };
    return emojis[condition];
}

/**
 * Get condition display name
 */
export function getConditionName(condition: WeatherCondition): string {
    const names: Record<WeatherCondition, string> = {
        clear: 'Clear',
        cloudy: 'Cloudy',
        fog: 'Foggy',
        drizzle: 'Drizzle',
        rain: 'Rain',
        heavy_rain: 'Heavy Rain',
        freezing_rain: 'Freezing Rain',
        snow: 'Snow',
        heavy_snow: 'Heavy Snow',
        blizzard: 'Blizzard',
        thunderstorm: 'Thunderstorm',
        hurricane: 'Hurricane',
        unknown: 'Unknown',
    };
    return names[condition];
}
