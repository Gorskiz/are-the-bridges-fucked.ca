/**
 * Are The Bridges Fucked .Ca
 * Main Application Component
 */

import { useState } from 'react';
import { useTrafficData } from './hooks/useTrafficData';
import { BridgeSelect } from './components/BridgeSelect';
import { BridgeDetail } from './components/BridgeDetail';
import './App.css';

type View = 'select' | 'detail';
type SelectedBridge = 'macdonald' | 'mackay' | null;

function App() {
  const { trafficData, isLoading, error, refetch } = useTrafficData();
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
      {view === 'select' && (
        <BridgeSelect
          trafficData={trafficData}
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
