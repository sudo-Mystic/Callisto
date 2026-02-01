import React, { useState } from 'react';
import { BleDevice } from '@capacitor-community/bluetooth-le';
import { bleService } from '../services/BleService';
import { useAppStore } from '../stores/appStore';
import '../styles/ConnectionScreen.css';

const ConnectionScreen: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<BleDevice[]>([]);
  const [scanError, setScanError] = useState<string | null>(null);
  const { setConnection } = useAppStore();

  const handleScan = async () => {
    setIsScanning(true);
    setDevices([]);
    setScanError(null);
    setConnection({ isScanning: true, error: null });

    try {
      await bleService.scan((device) => {
        setDevices((prev) => {
          // Avoid duplicates
          if (prev.find((d) => d.deviceId === device.deviceId)) {
            return prev;
          }
          return [...prev, device];
        });
      });

      setTimeout(() => {
        setIsScanning(false);
        setConnection({ isScanning: false });
      }, 10000);
    } catch (error) {
      console.error('Scan failed:', error);
      setIsScanning(false);
      const errorMessage = error instanceof Error ? error.message : 'Failed to scan for devices';
      setScanError(errorMessage);
      setConnection({
        isScanning: false,
        error: errorMessage,
      });
    }
  };

  const handleConnect = async (device: BleDevice) => {
    setConnection({ error: null });

    try {
      await bleService.connect(device.deviceId);
      setConnection({
        isConnected: true,
        deviceId: device.deviceId,
        deviceName: device.name || 'Unknown Device',
        error: null,
      });
    } catch (error) {
      console.error('Connection failed:', error);
      setConnection({
        isConnected: false,
        error: 'Failed to connect to device',
      });
    }
  };

  return (
    <div className="connection-screen">
      <div className="connection-container">
        <div className="logo-section">
          <h1 className="app-title">Callisto</h1>
          <p className="app-subtitle">Advanced Vehicle Interface</p>
        </div>

        <div className="scan-section">
          {!isScanning && devices.length === 0 && (
            <button className="btn btn-primary scan-btn" onClick={handleScan}>
              Scan for Vehicle
            </button>
          )}

          {scanError && (
            <div className="error-message">
              <p>{scanError}</p>
              <button className="btn btn-secondary" onClick={() => setScanError(null)}>
                Dismiss
              </button>
            </div>
          )}

          {isScanning && (
            <div className="scanning-indicator">
              <div className="spinner spin"></div>
              <p>Scanning for vehicles...</p>
            </div>
          )}

          {devices.length > 0 && (
            <div className="devices-list">
              <h3>Available Vehicles</h3>
              {devices.map((device) => (
                <div key={device.deviceId} className="device-card">
                  <div className="device-info">
                    <h4>{device.name || 'Unknown Device'}</h4>
                    <p className="device-id">{device.deviceId}</p>
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleConnect(device)}
                  >
                    Connect
                  </button>
                </div>
              ))}
            </div>
          )}

          {!isScanning && devices.length > 0 && (
            <button className="btn btn-secondary rescan-btn" onClick={handleScan}>
              Scan Again
            </button>
          )}
        </div>

        <div className="info-section">
          <div className="info-card">
            <h4>💡 How to Connect</h4>
            <ol>
              <li>Turn on your vehicle's ignition</li>
              <li>Enable Bluetooth on your device</li>
              <li>Tap "Scan for Vehicle"</li>
              <li>Select your vehicle from the list</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectionScreen;
