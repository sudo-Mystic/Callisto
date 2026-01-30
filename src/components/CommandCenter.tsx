import React, { useState } from 'react';
import { bleService } from '../services/BleService';
import { useAppStore } from '../stores/appStore';
import '../styles/CommandCenter.css';

const CommandCenter: React.FC = () => {
  const [illumination, setIllumination] = useState(3);
  const [tslTest, setTslTest] = useState(false);
  const { telemetry, settings } = useAppStore();

  const handleFindVehicle = async () => {
    if (settings.safetyGuardrails && (telemetry?.speed || 0) > 0) {
      alert('Cannot use Find Vehicle while moving (Speed > 0)');
      return;
    }

    try {
      await bleService.findVehicle();
      alert('Vehicle location signal sent! Horn and indicators should activate.');
    } catch (error) {
      console.error('Find vehicle failed:', error);
      alert('Failed to send find vehicle signal');
    }
  };

  const handleIlluminationChange = async (level: number) => {
    setIllumination(level);
    try {
      await bleService.setIllumination(level);
    } catch (error) {
      console.error('Failed to set illumination:', error);
    }
  };

  const handleTSLTest = async (enable: boolean) => {
    if (settings.safetyGuardrails && (telemetry?.speed || 0) > 0) {
      alert('Cannot test turn signals while moving (Speed > 0)');
      return;
    }

    setTslTest(enable);
    try {
      await bleService.testTurnSignals(enable);
    } catch (error) {
      console.error('TSL test failed:', error);
    }
  };

  const handleCustomText = async (line: 1 | 2) => {
    const text = prompt(`Enter text for line ${line} (max 15 characters):`);
    if (text) {
      try {
        await bleService.sendCustomText(line, text.slice(0, 15));
        alert(`Text sent to cluster line ${line}`);
      } catch (error) {
        console.error('Failed to send custom text:', error);
        alert('Failed to send text');
      }
    }
  };

  return (
    <div className="command-center">
      <div className="container">
        <h2>Command Center</h2>

        {/* Safety Warning */}
        {settings.safetyGuardrails && (telemetry?.speed || 0) > 0 && (
          <div className="card warning-card">
            <h3>⚠️ Safety Warning</h3>
            <p>Some controls are disabled while vehicle is in motion (Speed: {telemetry?.speed} km/h)</p>
          </div>
        )}

        {/* Find My Vehicle */}
        <div className="card">
          <h3>📍 Find My Vehicle</h3>
          <p>Activate horn and indicators to locate your vehicle</p>
          <button
            className="btn btn-primary btn-large"
            onClick={handleFindVehicle}
            disabled={settings.safetyGuardrails && (telemetry?.speed || 0) > 0}
          >
            🔊 Find Vehicle
          </button>
        </div>

        {/* Illumination Control */}
        <div className="card">
          <h3>💡 Cluster Illumination</h3>
          <p>Adjust dashboard backlight brightness (1-5)</p>
          <div className="illumination-control">
            <div className="illumination-slider">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  className={`level-btn ${illumination === level ? 'active' : ''}`}
                  onClick={() => handleIlluminationChange(level)}
                >
                  {level}
                </button>
              ))}
            </div>
            <div className="illumination-preview">
              <div
                className="brightness-indicator"
                style={{ opacity: illumination * 0.2 }}
              ></div>
              <p>Level {illumination}</p>
            </div>
          </div>
        </div>

        {/* Turn Signal Test */}
        <div className="card">
          <h3>🚦 Turn Signal Lamp Test</h3>
          <p>Test turn signal lights remotely</p>
          <div className="tsl-control">
            <button
              className={`btn ${tslTest ? 'btn-danger' : 'btn-primary'}`}
              onClick={() => handleTSLTest(!tslTest)}
              disabled={settings.safetyGuardrails && (telemetry?.speed || 0) > 0}
            >
              {tslTest ? '⏹️ Stop TSL Test' : '▶️ Start TSL Test'}
            </button>
          </div>
        </div>

        {/* Custom Text Display */}
        <div className="card">
          <h3>📝 Custom Text Display</h3>
          <p>Send custom messages to cluster display</p>
          <div className="text-controls">
            <button className="btn btn-secondary" onClick={() => handleCustomText(1)}>
              Set Line 1
            </button>
            <button className="btn btn-secondary" onClick={() => handleCustomText(2)}>
              Set Line 2
            </button>
          </div>
          <p className="text-info">Max 15 characters per line</p>
        </div>

        {/* Vehicle Control Info */}
        <div className="card">
          <h3>ℹ️ Remote Control Features</h3>
          <ul className="feature-list">
            <li>Find My Vehicle: Activates horn and indicators</li>
            <li>Illumination: 5 brightness levels for cluster backlight</li>
            <li>TSL Test: Remote turn signal lamp testing</li>
            <li>Custom Text: Display messages on cluster (2 lines)</li>
          </ul>
          <p className="safety-note">
            <strong>Safety:</strong> Controls are automatically disabled when vehicle speed exceeds 0 km/h
          </p>
        </div>
      </div>
    </div>
  );
};

export default CommandCenter;
