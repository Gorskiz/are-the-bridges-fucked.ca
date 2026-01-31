/**
 * Weather Widget Component
 * Displays current Halifax weather with Maritimer charm
 */

import type { WeatherData } from '../types/weather';
import { getWeatherEmoji, getConditionName } from '../services/weatherApi';
import './WeatherWidget.css';

interface WeatherWidgetProps {
    weather: WeatherData;
    compact?: boolean;
}

export function WeatherWidget({ weather, compact = false }: WeatherWidgetProps) {
    const emoji = getWeatherEmoji(weather.condition, weather.isDay);
    const conditionName = getConditionName(weather.condition);

    // Format temperature
    const temp = Math.round(weather.temperature);
    const feelsLike = Math.round(weather.feelsLike);

    if (compact) {
        return (
            <div className={`weather-widget weather-widget--compact weather-widget--${weather.severity}`}>
                <span className="weather-widget__emoji">{emoji}</span>
                <span className="weather-widget__temp">{temp}°C</span>
            </div>
        );
    }

    return (
        <div className={`weather-widget weather-widget--${weather.severity}`}>
            <div className="weather-widget__main">
                <span className="weather-widget__emoji">{emoji}</span>
                <div className="weather-widget__info">
                    <span className="weather-widget__temp">{temp}°C</span>
                    <span className="weather-widget__condition">{conditionName}</span>
                </div>
            </div>

            {weather.feelsLike !== weather.temperature && (
                <div className="weather-widget__feels-like">
                    Feels like {feelsLike}°C
                </div>
            )}

            {weather.windSpeed > 20 && (
                <div className="weather-widget__wind">
                    💨 {Math.round(weather.windSpeed)} km/h
                </div>
            )}
        </div>
    );
}

/**
 * Weather Status Banner
 * Shows prominent weather status when conditions are rough
 */
interface WeatherBannerProps {
    weather: WeatherData;
}

export function WeatherBanner({ weather }: WeatherBannerProps) {
    // Only show banner for rough or worse conditions
    if (weather.severity === 'fine' || weather.severity === 'meh') {
        return null;
    }

    const emoji = getWeatherEmoji(weather.condition, weather.isDay);

    return (
        <div className={`weather-banner weather-banner--${weather.severity}`}>
            <div className="weather-banner__content">
                <span className="weather-banner__emoji">{emoji}</span>
                <div className="weather-banner__text">
                    <span className="weather-banner__status">{weather.shortStatus}</span>
                    <span className="weather-banner__saying">{weather.maritimerSaying}</span>
                </div>
                <span className="weather-banner__emoji">{emoji}</span>
            </div>
        </div>
    );
}

/**
 * Weather Card - Larger display for detailed weather info
 */
interface WeatherCardProps {
    weather: WeatherData;
}

export function WeatherCard({ weather }: WeatherCardProps) {
    const emoji = getWeatherEmoji(weather.condition, weather.isDay);
    const conditionName = getConditionName(weather.condition);

    const temp = Math.round(weather.temperature);
    const feelsLike = Math.round(weather.feelsLike);

    return (
        <div className={`weather-card weather-card--${weather.severity}`}>
            <div className="weather-card__header">
                <span className="weather-card__emoji">{emoji}</span>
                <div className="weather-card__title">
                    <span className="weather-card__temp">{temp}°C</span>
                    <span className="weather-card__condition">{conditionName}</span>
                </div>
            </div>

            <div className="weather-card__status">
                <span className="weather-card__status-text">{weather.shortStatus}</span>
            </div>

            <p className="weather-card__saying">{weather.maritimerSaying}</p>

            <div className="weather-card__details">
                {weather.feelsLike !== weather.temperature && (
                    <div className="weather-card__detail">
                        <span className="weather-card__detail-label">Feels Like</span>
                        <span className="weather-card__detail-value">{feelsLike}°C</span>
                    </div>
                )}
                <div className="weather-card__detail">
                    <span className="weather-card__detail-label">Wind</span>
                    <span className="weather-card__detail-value">{Math.round(weather.windSpeed)} km/h</span>
                </div>
                {weather.windGusts > weather.windSpeed + 10 && (
                    <div className="weather-card__detail">
                        <span className="weather-card__detail-label">Gusts</span>
                        <span className="weather-card__detail-value">{Math.round(weather.windGusts)} km/h</span>
                    </div>
                )}
                <div className="weather-card__detail">
                    <span className="weather-card__detail-label">Humidity</span>
                    <span className="weather-card__detail-value">{weather.humidity}%</span>
                </div>
                {weather.snowfall > 0 && (
                    <div className="weather-card__detail">
                        <span className="weather-card__detail-label">Snowfall</span>
                        <span className="weather-card__detail-value">{weather.snowfall} cm</span>
                    </div>
                )}
            </div>
        </div>
    );
}

export default WeatherWidget;
