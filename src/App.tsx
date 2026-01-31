/**
 * Are The Bridges Fucked .Ca
 * Main Application Component
 * 
 * Now with weather integration and Environment Canada alerts! ⛈️🌨️🚨
 */

import { useState } from 'react';
import { useTrafficData } from './hooks/useTrafficData';
import { useWeatherData } from './hooks/useWeatherData';
import { useWeatherAlerts } from './hooks/useWeatherAlerts';
import { BridgeSelect } from './components/BridgeSelect';
import { BridgeDetail } from './components/BridgeDetail';
import { WeatherBanner } from './components/WeatherWidget';
import { WeatherOverlay } from './components/WeatherOverlay';
import { WeatherAlertBanner, WeatherAlertList } from './components/WeatherAlert';
import { alertTypeToCondition } from './services/alertsApi';
import type { WeatherCondition, WeatherSeverity } from './types/weather';
import './App.css';

type View = 'select' | 'detail';
type SelectedBridge = 'macdonald' | 'mackay' | null;

function App() {
  const { trafficData, isLoading, error, refetch } = useTrafficData();
  const { weatherData } = useWeatherData();
  const { activeAlerts, upcomingAlerts, mostSevereAlert } = useWeatherAlerts();
  const [view, setView] = useState<View>('select');
  const [selectedBridge, setSelectedBridge] = useState<SelectedBridge>(null);

  const handleSelectBridge = (bridge: 'macdonald' | 'mackay') => {
    setSelectedBridge(bridge);
    setView('detail');
  };

  const handleBack = () => {
    setView('select');
    setSelectedBridge(null);
  };

  // Determine overlay condition - prioritize active alerts over current weather
  const getOverlayCondition = (): { condition: WeatherCondition; severity: WeatherSeverity } | null => {
    // If there's an active severe alert, use its condition for the overlay
    if (mostSevereAlert && mostSevereAlert.isActive) {
      const alertCondition = alertTypeToCondition(mostSevereAlert.type);
      if (alertCondition) {
        const alertSeverity: WeatherSeverity =
          mostSevereAlert.severity === 'extreme' ? 'apocalyptic' :
            mostSevereAlert.severity === 'severe' ? 'fucked' :
              mostSevereAlert.severity === 'moderate' ? 'rough' : 'meh';
        return {
          condition: alertCondition as WeatherCondition,
          severity: alertSeverity
        };
      }
    }

    // Fall back to current weather data
    if (weatherData) {
      return {
        condition: weatherData.condition,
        severity: weatherData.severity
      };
    }

    return null;
  };

  const overlayData = getOverlayCondition();

  // Loading state
  if (isLoading && !trafficData) {
    return (
      <>
        <div className="app-background" />
        {overlayData && (
          <WeatherOverlay
            condition={overlayData.condition}
            severity={overlayData.severity}
            isDay={weatherData?.isDay ?? true}
          />
        )}
        <div className="loading-container">
          <div className="loading-spinner" />
          <p className="loading-text">Checking bridge status...</p>
        </div>
      </>
    );
  }

  // Error state
  if (error && !trafficData) {
    return (
      <>
        <div className="app-background" />
        {overlayData && (
          <WeatherOverlay
            condition={overlayData.condition}
            severity={overlayData.severity}
            isDay={weatherData?.isDay ?? true}
          />
        )}
        <div className="error-container">
          <span className="error-icon">🌉</span>
          <h1>Oops!</h1>
          <p className="error-message">
            Couldn't connect to bridge data.<br />
            {error}
          </p>
          <button className="retry-button" onClick={refetch}>
            Try Again
          </button>
        </div>
      </>
    );
  }

  // No data available
  if (!trafficData) {
    return (
      <>
        <div className="app-background" />
        {overlayData && (
          <WeatherOverlay
            condition={overlayData.condition}
            severity={overlayData.severity}
            isDay={weatherData?.isDay ?? true}
          />
        )}
        <div className="error-container">
          <span className="error-icon">🤷</span>
          <h1>No Data</h1>
          <p className="error-message">Unable to fetch bridge traffic data.</p>
          <button className="retry-button" onClick={refetch}>
            Try Again
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="app-background" />

      {/* Weather overlay - uses alert condition if active, otherwise current weather */}
      {overlayData && (
        <WeatherOverlay
          condition={overlayData.condition}
          severity={overlayData.severity}
          isDay={weatherData?.isDay ?? true}
        />
      )}

      {/* Active weather alert banner - prominent display */}
      {mostSevereAlert && mostSevereAlert.isActive && (
        <WeatherAlertBanner alert={mostSevereAlert} />
      )}

      {/* Weather condition banner (if no active alert) */}
      {weatherData && !mostSevereAlert?.isActive && (
        <WeatherBanner weather={weatherData} />
      )}

      {/* Main content */}
      {view === 'select' && (
        <BridgeSelect
          trafficData={trafficData}
          weatherData={weatherData}
          onSelectBridge={handleSelectBridge}
        />
      )}

      {view === 'detail' && selectedBridge && (
        <BridgeDetail
          bridge={selectedBridge}
          trafficData={trafficData}
          onBack={handleBack}
        />
      )}

      {/* Upcoming alerts list (shown at bottom when on select view) */}
      {view === 'select' && (activeAlerts.length > 0 || upcomingAlerts.length > 0) && (
        <WeatherAlertList
          activeAlerts={activeAlerts.filter(a => a.id !== mostSevereAlert?.id)}
          upcomingAlerts={upcomingAlerts}
        />
      )}
    </>
  );
}

export default App;
