/**
 * Bridge Detail Page
 * Shows the big YES/NO status and detailed traffic information
 */

import type { TrafficData, Bridge, TrafficLevel } from '../types/traffic';
import { getCameraImageUrl } from '../services/trafficApi';
import './BridgeDetail.css';

interface BridgeDetailProps {
    bridge: 'macdonald' | 'mackay';
    trafficData: TrafficData;
    onBack: () => void;
}

function getBridgeDisplayName(bridge: 'macdonald' | 'mackay'): { short: string; full: string } {
    if (bridge === 'macdonald') {
        return { short: 'Macdonald', full: 'Angus L. Macdonald Bridge' };
    }
    return { short: 'MacKay', full: 'A. Murray MacKay Bridge' };
}

function getTrafficLevelLabel(level: TrafficLevel): string {
    switch (level) {
        case 'light': return 'Light';
        case 'moderate': return 'Moderate';
        case 'heavy': return 'Heavy';
        case 'closed': return 'CLOSED';
        default: return 'Unknown';
    }
}

function isBridgeFucked(bridgeData: Bridge): {
    isFucked: boolean;
    reason: string;
    severity: 'good' | 'moderate' | 'bad' | 'critical';
} {
    const levels = [bridgeData.halifaxBound.level, bridgeData.dartmouthBound.level];

    const closedCount = levels.filter(l => l === 'closed').length;
    const heavyCount = levels.filter(l => l === 'heavy').length;
    const moderateCount = levels.filter(l => l === 'moderate').length;

    if (closedCount > 0) {
        return {
            isFucked: true,
            reason: closedCount === 2 ? 'Both directions closed!' : 'One direction closed!',
            severity: 'critical'
        };
    }
    if (heavyCount >= 2) {
        return {
            isFucked: true,
            reason: 'Heavy traffic both ways',
            severity: 'bad'
        };
    }
    if (heavyCount === 1) {
        return {
            isFucked: true,
            reason: 'Heavy traffic one direction',
            severity: 'bad'
        };
    }
    if (moderateCount >= 2) {
        return {
            isFucked: false,
            reason: 'Moderate traffic both ways',
            severity: 'moderate'
        };
    }
    if (moderateCount === 1) {
        return {
            isFucked: false,
            reason: 'Mostly light traffic',
            severity: 'good'
        };
    }
    return {
        isFucked: false,
        reason: 'Smooth sailing!',
        severity: 'good'
    };
}

export function BridgeDetail({ bridge, trafficData, onBack }: BridgeDetailProps) {
    const bridgeData = trafficData[bridge];
    const displayName = getBridgeDisplayName(bridge);
    const status = isBridgeFucked(bridgeData);

    // Determine display text based on status
    const getAnswerText = () => {
        if (status.isFucked) return 'YES';
        if (status.severity === 'moderate') return 'ALMOST';
        return 'NO';
    };

    // Determine answer class variant
    const getAnswerVariant = () => {
        if (status.isFucked) return 'yes';
        if (status.severity === 'moderate') return 'almost';
        return 'no';
    };

    return (
        <div className="bridge-detail">
            {/* Back Button */}
            <button className="bridge-detail__back" onClick={onBack} aria-label="Go back to bridge selection">
                <span className="bridge-detail__back-arrow">←</span>
                <span>Back</span>
            </button>

            {/* Hero Section with Big YES/NO/ALMOST */}
            <section className={`bridge-detail__hero bridge-detail__hero--${status.severity}`}>
                <h1 className="bridge-detail__bridge-name">{displayName.short}</h1>
                <p className="bridge-detail__bridge-full">{displayName.full}</p>

                <div className={`bridge-detail__answer bridge-detail__answer--${getAnswerVariant()}`}>
                    <span className="bridge-detail__answer-text">
                        {getAnswerText()}
                    </span>
                </div>

                <p className="bridge-detail__reason">{status.reason}</p>
            </section>

            {/* Traffic Details */}
            <section className="bridge-detail__traffic">
                <h2 className="bridge-detail__section-title">Traffic Status</h2>

                <div className="bridge-detail__directions">
                    {/* Halifax Bound */}
                    <div className={`direction-card direction-card--${bridgeData.halifaxBound.level}`}>
                        <div className="direction-card__header">
                            <span className="direction-card__direction">→ Halifax</span>
                            <span className={`direction-card__level direction-card__level--${bridgeData.halifaxBound.level}`}>
                                {getTrafficLevelLabel(bridgeData.halifaxBound.level)}
                            </span>
                        </div>
                        <div className="direction-card__visual">
                            <div className={`traffic-indicator traffic-indicator--${bridgeData.halifaxBound.level}`}>
                                <div className="traffic-indicator__bar"></div>
                                <div className="traffic-indicator__bar"></div>
                                <div className="traffic-indicator__bar"></div>
                            </div>
                        </div>
                    </div>

                    {/* Dartmouth Bound */}
                    <div className={`direction-card direction-card--${bridgeData.dartmouthBound.level}`}>
                        <div className="direction-card__header">
                            <span className="direction-card__direction">→ Dartmouth</span>
                            <span className={`direction-card__level direction-card__level--${bridgeData.dartmouthBound.level}`}>
                                {getTrafficLevelLabel(bridgeData.dartmouthBound.level)}
                            </span>
                        </div>
                        <div className="direction-card__visual">
                            <div className={`traffic-indicator traffic-indicator--${bridgeData.dartmouthBound.level}`}>
                                <div className="traffic-indicator__bar"></div>
                                <div className="traffic-indicator__bar"></div>
                                <div className="traffic-indicator__bar"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Live Cameras */}
            <section className="bridge-detail__cameras">
                <h2 className="bridge-detail__section-title">Live Cameras</h2>

                <div className="bridge-detail__camera-grid">
                    {/* Halifax Bound Camera */}
                    <div className="camera-card">
                        <div className="camera-card__header">
                            <span className="camera-card__live-badge">LIVE</span>
                            <span className="camera-card__label">Halifax Bound</span>
                        </div>
                        <div className="camera-card__image-container">
                            <img
                                src={getCameraImageUrl(bridgeData.halifaxBound.cameraUrl)}
                                alt={`${displayName.short} Bridge Halifax bound camera`}
                                className="camera-card__image"
                                loading="lazy"
                            />
                        </div>
                    </div>

                    {/* Dartmouth Bound Camera */}
                    <div className="camera-card">
                        <div className="camera-card__header">
                            <span className="camera-card__live-badge">LIVE</span>
                            <span className="camera-card__label">Dartmouth Bound</span>
                        </div>
                        <div className="camera-card__image-container">
                            <img
                                src={getCameraImageUrl(bridgeData.dartmouthBound.cameraUrl)}
                                alt={`${displayName.short} Bridge Dartmouth bound camera`}
                                className="camera-card__image"
                                loading="lazy"
                            />
                        </div>
                    </div>
                </div>
                <div className="bridge-detail__camera-credit">
                    <small>
                        Camera feeds courtesy of <a href="https://halifaxharbourbridges.ca/" target="_blank" rel="noopener noreferrer">Halifax Harbour Bridges</a>
                    </small>
                </div>
            </section>

            {/* Footer */}
            <footer className="bridge-detail__footer">
                <p className="bridge-detail__updated">
                    Updated {trafficData.lastUpdated.toLocaleTimeString('en-CA', {
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </p>
                <p className="bridge-detail__disclaimer">
                    Data sourced from <a href="https://halifaxharbourbridges.ca/" target="_blank" rel="noopener noreferrer">halifaxharbourbridges.ca</a>
                </p>
                <img
                    src="/arethebridgesfuckedlogo.webp"
                    alt="Are The Bridges Fucked Logo"
                    className="bridge-detail__logo"
                />
            </footer>
        </div>
    );
}

export default BridgeDetail;
