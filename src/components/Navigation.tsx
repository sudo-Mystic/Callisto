import React, { useState } from 'react';
import { bleService } from '../services/BleService';
import { useAppStore } from '../stores/appStore';
import '../styles/Navigation.css';

const Navigation: React.FC = () => {
  const [destination, setDestination] = useState('');
  const [isNavigating, setIsNavigating] = useState(false);
  const { navigation, setNavigation } = useAppStore();

  const startNavigation = () => {
    if (!destination) {
      alert('Please enter a destination');
      return;
    }

    // Mock navigation data (in real app, integrate Mapbox)
    setIsNavigating(true);
    setNavigation({
      turnType: 2, // Right turn
      distance: 500,
      eta: 600,
      currentManeuver: 'Turn right in 500m',
    });

    // Send navigation data to cluster
    bleService.sendNavigationTurn(2); // Right turn
    bleService.sendNavigationETA(500, 10, false); // 500m, 10 min, not arrived
  };

  const stopNavigation = () => {
    setIsNavigating(false);
    setNavigation(null);
    bleService.sendCustomText(1, 'Navigation ended');
  };

  const simulateTurn = (turnType: number, description: string) => {
    bleService.sendNavigationTurn(turnType);
    bleService.sendCustomText(1, description);
    
    setNavigation({
      ...navigation,
      turnType,
      currentManeuver: description,
      distance: Math.floor(Math.random() * 1000),
      eta: Math.floor(Math.random() * 1800),
    } as any);
  };

  return (
    <div className="navigation">
      <div className="container">
        <h2>Navigation</h2>

        {!isNavigating ? (
          <div className="card">
            <h3>🗺️ Start Navigation</h3>
            <div className="nav-form">
              <input
                type="text"
                className="nav-input"
                placeholder="Enter destination..."
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
              <button className="btn btn-primary" onClick={startNavigation}>
                Start Navigation
              </button>
            </div>
            <p className="nav-info">
              Navigation instructions will be displayed on your vehicle cluster
            </p>
          </div>
        ) : (
          <>
            <div className="card nav-active">
              <h3>📍 Active Navigation</h3>
              {navigation && (
                <div className="nav-status">
                  <div className="nav-destination">
                    <strong>To:</strong> {destination}
                  </div>
                  <div className="nav-maneuver">{navigation.currentManeuver}</div>
                  <div className="nav-details">
                    <span>Distance: {navigation.distance}m</span>
                    <span>ETA: {Math.floor(navigation.eta / 60)} min</span>
                  </div>
                </div>
              )}
              <button className="btn btn-danger" onClick={stopNavigation}>
                End Navigation
              </button>
            </div>

            {/* Demo Controls */}
            <div className="card">
              <h3>🎮 Simulate Turn Instructions</h3>
              <p className="demo-info">Test different turn types on cluster</p>
              <div className="turn-buttons">
                <button
                  className="btn btn-secondary"
                  onClick={() => simulateTurn(1, 'Continue straight')}
                >
                  ⬆️ Straight
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => simulateTurn(2, 'Turn right')}
                >
                  ➡️ Right
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => simulateTurn(11, 'Turn left')}
                >
                  ⬅️ Left
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => simulateTurn(10, 'Slight right')}
                >
                  ↗️ Slight Right
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => simulateTurn(12, 'Sharp left')}
                >
                  ↙️ Sharp Left
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => simulateTurn(22, 'Make U-turn')}
                >
                  ↩️ U-Turn
                </button>
              </div>
            </div>
          </>
        )}

        {/* Features Info */}
        <div className="card">
          <h3>ℹ️ Navigation Features</h3>
          <ul className="feature-list">
            <li>Turn-by-turn directions on cluster display</li>
            <li>Real-time distance and ETA updates</li>
            <li>Automatic arrival notifications</li>
            <li>Smart ETA that updates every 30 seconds</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Navigation;
