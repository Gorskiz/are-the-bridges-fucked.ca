/**
 * Weather Alert Display Component
 * Prominently displays active Environment Canada weather alerts
 */

import type { WeatherAlert } from '../services/alertsApi';
import { getAlertEmoji, getAlertColor, formatTimeRemaining, formatAlertTime } from '../services/alertsApi';
import './WeatherAlert.css';

interface WeatherAlertBannerProps {
    alert: WeatherAlert;
    compact?: boolean;
}

interface WeatherAlertListProps {
    activeAlerts: WeatherAlert[];
    upcomingAlerts: WeatherAlert[];
}

/**
 * Prominent alert banner for active severe weather
 */
export function WeatherAlertBanner({ alert, compact = false }: WeatherAlertBannerProps) {
    const emoji = getAlertEmoji(alert.type);
    const color = getAlertColor(alert.severity);

    if (compact) {
        return (
            <div
                className={`alert-banner alert-banner--compact alert-banner--${alert.severity}`}
                style={{ '--alert-color': color } as React.CSSProperties}
            >
                <span className="alert-banner__emoji">{emoji}</span>
                <span className="alert-banner__title">{alert.title}</span>
                <span className="alert-banner__time">{formatTimeRemaining(alert.expires)}</span>
            </div>
        );
    }

    return (
        <div
            className={`alert-banner alert-banner--${alert.severity}`}
            style={{ '--alert-color': color } as React.CSSProperties}
            role="alert"
            aria-live="assertive"
        >
            <div className="alert-banner__header">
                <span className="alert-banner__icon">{emoji}</span>
                <div className="alert-banner__title-group">
                    <h2 className="alert-banner__title">
                        {alert.isActive ? '⚠️ ACTIVE ALERT' : '📅 UPCOMING'}
                    </h2>
                    <p className="alert-banner__type">{alert.title}</p>
                </div>
                <div className="alert-banner__badge">
                    {alert.severity.toUpperCase()}
                </div>
            </div>

            <p className="alert-banner__headline">{alert.headline}</p>

            <div className="alert-banner__details">
                <div className="alert-banner__timing">
                    <span className="alert-banner__label">Effective:</span>
                    <span>{formatAlertTime(alert.effective)} AST</span>
                </div>
                <div className="alert-banner__timing">
                    <span className="alert-banner__label">Expires:</span>
                    <span>{formatAlertTime(alert.expires)} AST</span>
                </div>
                <div className="alert-banner__timing alert-banner__timing--remaining">
                    <span className="alert-banner__label">⏱️</span>
                    <span>{formatTimeRemaining(alert.expires)}</span>
                </div>
            </div>

            {alert.instruction && (
                <p className="alert-banner__instruction">
                    <strong>💡 What to do:</strong> {alert.instruction}
                </p>
            )}

            <p className="alert-banner__source">
                Source: Environment Canada • Halifax Metro Area
            </p>
        </div>
    );
}

/**
 * List of all alerts (active + upcoming)
 */
export function WeatherAlertList({ activeAlerts, upcomingAlerts }: WeatherAlertListProps) {
    if (activeAlerts.length === 0 && upcomingAlerts.length === 0) {
        return null;
    }

    return (
        <div className="alert-list">
            {activeAlerts.length > 0 && (
                <div className="alert-list__section">
                    <h3 className="alert-list__heading alert-list__heading--active">
                        🚨 Active Alerts ({activeAlerts.length})
                    </h3>
                    {activeAlerts.map(alert => (
                        <WeatherAlertCard key={alert.id} alert={alert} />
                    ))}
                </div>
            )}

            {upcomingAlerts.length > 0 && (
                <div className="alert-list__section">
                    <h3 className="alert-list__heading alert-list__heading--upcoming">
                        📅 Upcoming Alerts ({upcomingAlerts.length})
                    </h3>
                    {upcomingAlerts.map(alert => (
                        <WeatherAlertCard key={alert.id} alert={alert} isUpcoming />
                    ))}
                </div>
            )}
        </div>
    );
}

/**
 * Individual alert card
 */
function WeatherAlertCard({ alert, isUpcoming = false }: { alert: WeatherAlert; isUpcoming?: boolean }) {
    const emoji = getAlertEmoji(alert.type);
    const color = getAlertColor(alert.severity);

    return (
        <div
            className={`alert-card alert-card--${alert.severity} ${isUpcoming ? 'alert-card--upcoming' : ''}`}
            style={{ '--alert-color': color } as React.CSSProperties}
        >
            <div className="alert-card__header">
                <span className="alert-card__emoji">{emoji}</span>
                <div className="alert-card__info">
                    <h4 className="alert-card__title">{alert.title}</h4>
                    <p className="alert-card__timing">
                        {isUpcoming ? (
                            <>Starts: {formatAlertTime(alert.effective)} AST</>
                        ) : (
                            <>Expires: {formatAlertTime(alert.expires)} AST • {formatTimeRemaining(alert.expires)}</>
                        )}
                    </p>
                </div>
                <span className={`alert-card__badge alert-card__badge--${alert.severity}`}>
                    {alert.severity}
                </span>
            </div>
            <p className="alert-card__description">{alert.headline}</p>
        </div>
    );
}

/**
 * Floating alert indicator (small, shows in corner when alerts exist)
 */
export function AlertIndicator({ count, severity }: { count: number; severity: string }) {
    if (count === 0) return null;

    return (
        <div className={`alert-indicator alert-indicator--${severity}`}>
            <span className="alert-indicator__icon">⚠️</span>
            <span className="alert-indicator__count">{count}</span>
        </div>
    );
}
