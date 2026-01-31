/**
 * Weather Types for Halifax Weather Integration
 * Using Open-Meteo API data structures
 */

export type WeatherSeverity = 'fine' | 'meh' | 'rough' | 'fucked' | 'apocalyptic';

export type WeatherCondition =
    | 'clear'
    | 'cloudy'
    | 'fog'
    | 'drizzle'
    | 'rain'
    | 'heavy_rain'
    | 'freezing_rain'
    | 'snow'
    | 'heavy_snow'
    | 'blizzard'
    | 'thunderstorm'
    | 'hurricane'
    | 'unknown';

export interface WeatherData {
    temperature: number;           // Celsius
    feelsLike: number;            // Wind chill / Humidex
    windSpeed: number;            // km/h
    windGusts: number;            // km/h
    precipitation: number;        // mm
    snowfall: number;             // cm
    humidity: number;             // %
    visibility: number;           // km
    condition: WeatherCondition;
    conditionCode: number;        // WMO weather code
    isDay: boolean;
    lastUpdated: Date;

    // Computed fun stuff
    severity: WeatherSeverity;
    maritimerSaying: string;
    shortStatus: string;
    isFucked: boolean;
}

export interface WeatherAlert {
    type: 'warning' | 'watch' | 'advisory';
    title: string;
    description: string;
    severity: 'minor' | 'moderate' | 'severe' | 'extreme';
}

// Open-Meteo API response types
export interface OpenMeteoResponse {
    latitude: number;
    longitude: number;
    current: {
        time: string;
        interval: number;
        temperature_2m: number;
        apparent_temperature: number;
        relative_humidity_2m: number;
        weather_code: number;
        wind_speed_10m: number;
        wind_gusts_10m: number;
        precipitation: number;
        snowfall: number;
        visibility: number;
        is_day: number;
    };
}
