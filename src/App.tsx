/**
 * Are The Bridges Fucked .Ca
 * Main Application Component
 * 
 * Now with weather integration! ⛈️🌨️
 */

import { useState } from 'react';
import { useTrafficData } from './hooks/useTrafficData';
import { useWeatherData } from './hooks/useWeatherData';
import { BridgeSelect } from './components/BridgeSelect';
import { BridgeDetail } from './components/BridgeDetail';
import { WeatherBanner } from './components/WeatherWidget';
import { WeatherOverlay } from './components/WeatherOverlay';
import './App.css';

type View = 'select' | 'detail';
type SelectedBridge = 'macdonald' | 'mackay' | null;

function App() {
  const { trafficData, isLoading, error, refetch } = useTrafficData();
  const { weatherData } = useWeatherData();
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

  // Loading state
  if (isLoading && !trafficData) {
    return (
      <>
        <div className="app-background" />
        {weatherData && (
          <WeatherOverlay
            condition={weatherData.condition}
            severity={weatherData.severity}
            isDay={weatherData.isDay}
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
        {weatherData && (
          <WeatherOverlay
            condition={weatherData.condition}
            severity={weatherData.severity}
            isDay={weatherData.isDay}
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
        {weatherData && (
          <WeatherOverlay
            condition={weatherData.condition}
            severity={weatherData.severity}
            isDay={weatherData.isDay}
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
      {weatherData && (
        <WeatherOverlay
          condition={weatherData.condition}
          severity={weatherData.severity}
          isDay={weatherData.isDay}
        />
      )}
      {weatherData && <WeatherBanner weather={weatherData} />}
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
    </>
  );
}

export default App;
