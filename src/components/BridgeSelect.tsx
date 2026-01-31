/**
 * Bridge Selection Page
 * Beautiful mobile-first design for selecting which bridge to check
 */

import type { TrafficData } from '../types/traffic';
import './BridgeSelect.css';

interface BridgeSelectProps {
    trafficData: TrafficData;
    onSelectBridge: (bridge: 'macdonald' | 'mackay') => void;
}

function getBridgeStatus(bridge: 'macdonald' | 'mackay', data: TrafficData): {
    isFucked: boolean;
    worstLevel: string;
} {
    const bridgeData = data[bridge];
    const levels = [bridgeData.halifaxBound.level, bridgeData.dartmouthBound.level];

    const hasHeavy = levels.includes('heavy');
    const hasClosed = levels.includes('closed');
    const hasModerate = levels.includes('moderate');

    if (hasClosed || hasHeavy) {
        return { isFucked: true, worstLevel: hasClosed ? 'closed' : 'heavy' };
    }
    if (hasModerate) {
        return { isFucked: false, worstLevel: 'moderate' };
    }
    return { isFucked: false, worstLevel: 'light' };
}

export function BridgeSelect({ trafficData, onSelectBridge }: BridgeSelectProps) {
    const macdonaldStatus = getBridgeStatus('macdonald', trafficData);
    const mackayStatus = getBridgeStatus('mackay', trafficData);

    // Get display text based on status
    const getStatusText = (status: { isFucked: boolean; worstLevel: string }) => {
        if (status.isFucked) return 'Yes';
        if (status.worstLevel === 'moderate') return 'Almost';
        return 'No';
    };

    return (
        <div className="bridge-select">
            {/* Header */}
            <header className="bridge-select__header">
                <h1 className="bridge-select__title">
                    Are The Bridges<br />
                    <span className="bridge-select__title-accent">Fucked?</span>
                </h1>
                <p className="bridge-select__subtitle">
                    Halifax Harbour Traffic Status
                </p>
            </header>

            {/* Bridge Cards */}
            <div className="bridge-select__cards">
                {/* Macdonald Bridge */}
                <button
                    className={`bridge-card ${macdonaldStatus.isFucked ? 'bridge-card--fucked' : 'bridge-card--good'}`}
                    onClick={() => onSelectBridge('macdonald')}
                    aria-label={`Check Macdonald Bridge status - currently ${macdonaldStatus.isFucked ? 'fucked' : 'not fucked'}`}
                >
                    <div className="bridge-card__content">
                        <span className="bridge-card__name">Macdonald</span>
                        <span className="bridge-card__full-name">Angus L. Macdonald Bridge</span>
                        <div className={`bridge-card__indicator bridge-card__indicator--${macdonaldStatus.worstLevel}`}>
                            <span className="bridge-card__status">
                                {getStatusText(macdonaldStatus)}
                            </span>
                        </div>
                    </div>
                    <div className="bridge-card__arrow">→</div>
                </button>

                {/* MacKay Bridge */}
                <button
                    className={`bridge-card ${mackayStatus.isFucked ? 'bridge-card--fucked' : 'bridge-card--good'}`}
                    onClick={() => onSelectBridge('mackay')}
                    aria-label={`Check MacKay Bridge status - currently ${mackayStatus.isFucked ? 'fucked' : 'not fucked'}`}
                >
                    <div className="bridge-card__content">
                        <span className="bridge-card__name">MacKay</span>
                        <span className="bridge-card__full-name">A. Murray MacKay Bridge</span>
                        <div className={`bridge-card__indicator bridge-card__indicator--${mackayStatus.worstLevel}`}>
                            <span className="bridge-card__status">
                                {getStatusText(mackayStatus)}
                            </span>
                        </div>
                    </div>
                    <div className="bridge-card__arrow">→</div>
                </button>
            </div>

            {/* Footer */}
            <footer className="bridge-select__footer">
                <p className="bridge-select__updated">
                    Updated {trafficData.lastUpdated.toLocaleTimeString('en-CA', {
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </p>
                <p className="bridge-select__source">
                    Data from halifaxharbourbridges.ca
                </p>
                <img
                    src="/arethebridgesfuckedlogo.webp"
                    alt="Are The Bridges Fucked Logo"
                    className="bridge-select__logo"
                />
            </footer>
        </div>
    );
}

export default BridgeSelect;
