import React from 'react';
import { bleService } from '../services/BleService';
import { useAppStore } from '../stores/appStore';
import '../styles/Settings.css';

const Settings: React.FC = () => {
  const { settings, updateSettings, connection, setConnection } = useAppStore();

  const handleDisconnect = async () => {
    try {
      await bleService.disconnect();
      setConnection({
        isConnected: false,
        deviceId: null,
        deviceName: null,
      });
    } catch (error) {
      console.error('Disconnect failed:', error);
    }
  };

  return (
    <div className="settings">
      <div className="container">
        <h2>Settings</h2>

        {/* Connection Info */}
        <div className="card">
          <h3>🔗 Connection</h3>
          <div className="connection-info">
            <div className="info-row">
              <span>Status:</span>
              <span className={connection.isConnected ? 'status-connected' : 'status-disconnected'}>
                {connection.isConnected ? '✓ Connected' : '✗ Disconnected'}
              </span>
            </div>
            {connection.deviceName && (
              <div className="info-row">
                <span>Device:</span>
                <span>{connection.deviceName}</span>
              </div>
            )}
            {connection.deviceId && (
              <div className="info-row">
                <span>ID:</span>
                <span className="device-id">{connection.deviceId}</span>
              </div>
            )}
          </div>
          {connection.isConnected && (
            <button className="btn btn-danger" onClick={handleDisconnect}>
              Disconnect
            </button>
          )}
        </div>

        {/* App Settings */}
        <div className="card">
          <h3>⚙️ App Settings</h3>
          
          <div className="setting-item">
            <div className="setting-info">
              <label>Mechanic Mode</label>
              <p>Show detailed sensor grid instead of driver-friendly view</p>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.mechanicMode}
                onChange={(e) => updateSettings({ mechanicMode: e.target.checked })}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <label>Auto Connect</label>
              <p>Automatically connect to last known vehicle on app start</p>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.autoConnect}
                onChange={(e) => updateSettings({ autoConnect: e.target.checked })}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <label>Log Sensor Data</label>
              <p>Continuously log telemetry data for CSV export</p>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.logSensorData}
                onChange={(e) => updateSettings({ logSensorData: e.target.checked })}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <label>Safety Guardrails</label>
              <p>Disable remote controls when speed &gt; 0 km/h</p>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.safetyGuardrails}
                onChange={(e) => updateSettings({ safetyGuardrails: e.target.checked })}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        {/* Rider Name */}
        <div className="card">
          <h3>👤 Rider Name</h3>
          <p>Name displayed on vehicle cluster</p>
          <input
            type="text"
            className="rider-name-input"
            value={settings.riderName}
            onChange={(e) => updateSettings({ riderName: e.target.value.slice(0, 15) })}
            maxLength={15}
            placeholder="Enter rider name"
          />
          <p className="input-hint">Max 15 characters</p>
        </div>

        {/* About */}
        <div className="card">
          <h3>ℹ️ About Callisto</h3>
          <div className="about-info">
            <p><strong>Version:</strong> 1.0.0</p>
            <p><strong>Build:</strong> Vite + React + Capacitor</p>
            <p><strong>Protocol:</strong> Jupiter BLE</p>
            <p><strong>Description:</strong> Advanced Vehicle Interface for TVS Jupiter</p>
          </div>
          <div className="about-features">
            <h4>Features:</h4>
            <ul>
              <li>Real-time telemetry monitoring</li>
              <li>Diagnostic trouble code reading</li>
              <li>Turn-by-turn navigation display</li>
              <li>Remote vehicle control</li>
              <li>Ride data logging and CSV export</li>
              <li>Performance metrics tracking</li>
            </ul>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="card warning-card">
          <h3>⚠️ Safety Disclaimer</h3>
          <p>
            <strong>Warning:</strong> This app allows direct control of vehicle functions.
            Use with caution and only when vehicle is parked and safe to operate.
          </p>
          <ul>
            <li>Do not send control commands while vehicle is in motion</li>
            <li>Do not modify calibration settings without proper knowledge</li>
            <li>Enable "Safety Guardrails" to prevent accidental control activation</li>
            <li>This is an unofficial app and not endorsed by TVS Motor Company</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Settings;
