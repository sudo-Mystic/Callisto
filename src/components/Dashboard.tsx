import React from 'react';
import { useAppStore } from '../stores/appStore';
import '../styles/Dashboard.css';

const Dashboard: React.FC = () => {
  const { telemetry, metrics, settings } = useAppStore();

  if (!telemetry) {
    return (
      <div className="dashboard loading">
        <p>Waiting for vehicle data...</p>
      </div>
    );
  }

  const formatValue = (value: number | undefined, decimals: number = 0): string => {
    return value !== undefined ? value.toFixed(decimals) : '--';
  };

  return (
    <div className="dashboard">
      {settings.mechanicMode ? (
        /* Mechanic Mode - Detailed Grid View */
        <div className="mechanic-mode">
          <h2>Mechanic Mode - Sensor Grid</h2>
          
          <div className="sensor-grid">
            {/* Row 1: Primary Metrics */}
            <div className="sensor-card primary">
              <label>Speed</label>
              <div className="value large">{telemetry.speed || 0}</div>
              <div className="unit">km/h</div>
            </div>
            
            <div className="sensor-card primary">
              <label>RPM</label>
              <div className="value large">{telemetry.rpm || 0}</div>
              <div className="unit">rpm</div>
            </div>
            
            <div className="sensor-card primary">
              <label>Throttle</label>
              <div className="value large">{formatValue(telemetry.throttlePosition, 1)}</div>
              <div className="unit">%</div>
            </div>

            {/* Row 2: Engine Parameters */}
            <div className="sensor-card">
              <label>Engine Load</label>
              <div className="value">{telemetry.engineLoad || 0}</div>
              <div className="unit">%</div>
            </div>
            
            <div className="sensor-card">
              <label>Engine Temp</label>
              <div className="value">{telemetry.engineTemp || 0}</div>
              <div className="unit">°C</div>
            </div>
            
            <div className="sensor-card">
              <label>Intake Temp</label>
              <div className="value">{telemetry.intakeAirTemp || 0}</div>
              <div className="unit">°C</div>
            </div>

            {/* Row 3: Sensors */}
            <div className="sensor-card">
              <label>MAP Sensor</label>
              <div className="value">{telemetry.mapSensor || 0}</div>
              <div className="unit">kPa</div>
            </div>
            
            <div className="sensor-card">
              <label>Battery</label>
              <div className="value">{formatValue(telemetry.batteryVoltage, 2)}</div>
              <div className="unit">V</div>
            </div>
            
            <div className="sensor-card">
              <label>Fuel Economy</label>
              <div className="value">{telemetry.instantFuelEconomy || 0}</div>
              <div className="unit">km/l</div>
            </div>

            {/* Row 4: Distance & Fuel */}
            <div className="sensor-card">
              <label>Odometer</label>
              <div className="value">{formatValue(telemetry.odo, 1)}</div>
              <div className="unit">km</div>
            </div>
            
            <div className="sensor-card">
              <label>Trip Distance</label>
              <div className="value">{formatValue(telemetry.tripDistance, 1)}</div>
              <div className="unit">km</div>
            </div>
            
            <div className="sensor-card">
              <label>Fuel Injected</label>
              <div className="value">{telemetry.fuelInjected || 0}</div>
              <div className="unit">mL</div>
            </div>
          </div>

          {/* Status Flags */}
          <div className="status-flags">
            <h3>System Status</h3>
            <div className="flags-grid">
              <div className={`flag ${telemetry.sideStandStatus ? 'active' : ''}`}>
                Side Stand: {telemetry.sideStandStatus ? 'DOWN' : 'UP'}
              </div>
              <div className={`flag ${telemetry.isgFault ? 'error' : ''}`}>
                ISG: {telemetry.isgFault ? 'FAULT' : 'OK'}
              </div>
              <div className={`flag ${telemetry.fuelSensorFault ? 'error' : ''}`}>
                Fuel Sensor: {telemetry.fuelSensorFault ? 'FAULT' : 'OK'}
              </div>
              {telemetry.dtcCode !== undefined && telemetry.dtcCode > 0 && (
                <div className="flag error">
                  DTC Code: {telemetry.dtcCode}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Normal Mode - Driver-Friendly View */
        <div className="normal-mode">
          {/* Hero Display - Speed & RPM */}
          <div className="hero-section">
            <div className="speedometer">
              <div className="speed-value">{telemetry.speed || 0}</div>
              <div className="speed-label">km/h</div>
            </div>
            
            <div className="tachometer">
              <div className="rpm-bar">
                <div 
                  className="rpm-fill" 
                  style={{ width: `${Math.min((telemetry.rpm || 0) / 100, 100)}%` }}
                ></div>
              </div>
              <div className="rpm-value">{telemetry.rpm || 0} RPM</div>
            </div>
          </div>

          {/* Throttle Monitor */}
          <div className="card throttle-card">
            <h3>Throttle Position</h3>
            <div className="throttle-bar">
              <div 
                className="throttle-fill" 
                style={{ width: `${telemetry.throttlePosition || 0}%` }}
              ></div>
            </div>
            <div className="throttle-value">{formatValue(telemetry.throttlePosition, 1)}%</div>
          </div>

          {/* Key Metrics Grid */}
          <div className="metrics-grid">
            <div className="metric-card">
              <span className="metric-icon">🔋</span>
              <div className="metric-content">
                <label>Battery</label>
                <div className="metric-value">{formatValue(telemetry.batteryVoltage, 1)}V</div>
              </div>
            </div>

            <div className="metric-card">
              <span className="metric-icon">⚡</span>
              <div className="metric-content">
                <label>Engine Load</label>
                <div className="metric-value">{telemetry.engineLoad || 0}%</div>
              </div>
            </div>

            <div className="metric-card">
              <span className="metric-icon">⛽</span>
              <div className="metric-content">
                <label>Fuel Economy</label>
                <div className="metric-value">{telemetry.instantFuelEconomy || 0} km/l</div>
              </div>
            </div>

            <div className="metric-card">
              <span className="metric-icon">🌡️</span>
              <div className="metric-content">
                <label>Engine Temp</label>
                <div className="metric-value">{telemetry.engineTemp || 0}°C</div>
              </div>
            </div>

            <div className="metric-card">
              <span className="metric-icon">🛣️</span>
              <div className="metric-content">
                <label>Odometer</label>
                <div className="metric-value">{formatValue(telemetry.odo, 1)} km</div>
              </div>
            </div>

            <div className="metric-card">
              <span className="metric-icon">📍</span>
              <div className="metric-content">
                <label>Trip</label>
                <div className="metric-value">{formatValue(telemetry.tripDistance, 1)} km</div>
              </div>
            </div>
          </div>

          {/* Eco Score & Performance */}
          <div className="derived-metrics">
            <div className="card eco-card">
              <h3>Eco Score</h3>
              <div className={`eco-score grade-${metrics.ecoScore}`}>
                {metrics.ecoScore}
              </div>
              <p className="riding-style">{metrics.ridingStyle}</p>
            </div>

            {metrics.zeroToSixtyTime && (
              <div className="card performance-card">
                <h3>0-60 km/h</h3>
                <div className="performance-time">
                  {metrics.zeroToSixtyTime.toFixed(2)}s
                </div>
              </div>
            )}

            <div className="card range-card">
              <h3>Real-World Range</h3>
              <div className="range-value">
                {formatValue(metrics.realWorldRange, 0)} km
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
