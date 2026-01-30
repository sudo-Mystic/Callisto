import React from 'react';
import { useAppStore } from '../stores/appStore';
import '../styles/DiagnosticCenter.css';

const DiagnosticCenter: React.FC = () => {
  const { telemetry, sensorLogs, clearSensorLogs } = useAppStore();

  if (!telemetry) {
    return (
      <div className="diagnostic-center">
        <p>No telemetry data available</p>
      </div>
    );
  }

  const exportToCSV = () => {
    if (sensorLogs.length === 0) {
      alert('No data to export');
      return;
    }

    // Create CSV content
    const headers = [
      'Timestamp',
      'Speed',
      'RPM',
      'Throttle',
      'Engine Load',
      'Battery Voltage',
      'Engine Temp',
      'Intake Temp',
      'MAP Sensor',
      'Fuel Economy',
      'Odometer',
      'Trip Distance',
    ];

    const rows = sensorLogs.map((log) => [
      new Date(log.timestamp).toISOString(),
      log.speed,
      log.rpm,
      log.throttlePosition,
      log.engineLoad,
      log.batteryVoltage,
      log.engineTemp,
      log.intakeAirTemp,
      log.mapSensor,
      log.instantFuelEconomy,
      log.odo,
      log.tripDistance,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');

    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `callisto-log-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getDTCDescription = (code: number): string => {
    const dtcMap: Record<number, string> = {
      0: 'No Fault',
      1: 'Engine Temperature Sensor',
      2: 'Throttle Position Sensor',
      3: 'MAP Sensor Fault',
      4: 'Fuel System Fault',
      5: 'Ignition System Fault',
    };
    return dtcMap[code] || `Unknown Code: ${code}`;
  };

  return (
    <div className="diagnostic-center">
      <div className="container">
        <h2>Diagnostic Center</h2>

        {/* DTC Scanner */}
        <div className="card">
          <h3>🔍 DTC Scanner</h3>
          <div className={`dtc-display ${telemetry.dtcCode ? 'error' : 'success'}`}>
            {telemetry.dtcCode ? (
              <>
                <div className="dtc-code">Code: {telemetry.dtcCode}</div>
                <div className="dtc-description">{getDTCDescription(telemetry.dtcCode)}</div>
                {telemetry.milBlinkCode && (
                  <div className="mil-code">MIL Blink: {telemetry.milBlinkCode}</div>
                )}
              </>
            ) : (
              <div className="no-fault">✓ No Active Fault Codes</div>
            )}
          </div>
        </div>

        {/* Sensor Health Monitor */}
        <div className="card">
          <h3>🔧 Sensor Health Monitor</h3>
          <div className="sensor-health-grid">
            <div className="health-item">
              <label>Intake Air Temperature</label>
              <div className="health-value">{telemetry.intakeAirTemp || 0}°C</div>
              <div className="health-status ok">Normal</div>
            </div>

            <div className="health-item">
              <label>MAP Sensor</label>
              <div className="health-value">{telemetry.mapSensor || 0} kPa</div>
              <div className="health-status ok">Normal</div>
            </div>

            <div className="health-item">
              <label>Engine Temperature</label>
              <div className="health-value">{telemetry.engineTemp || 0}°C</div>
              <div className={`health-status ${(telemetry.engineTemp || 0) > 100 ? 'warning' : 'ok'}`}>
                {(telemetry.engineTemp || 0) > 100 ? 'High' : 'Normal'}
              </div>
            </div>

            <div className="health-item">
              <label>Battery Voltage</label>
              <div className="health-value">{telemetry.batteryVoltage?.toFixed(2) || 0}V</div>
              <div className={`health-status ${(telemetry.batteryVoltage || 0) < 12 ? 'warning' : 'ok'}`}>
                {(telemetry.batteryVoltage || 0) < 12 ? 'Low' : 'Normal'}
              </div>
            </div>
          </div>
        </div>

        {/* System Status Flags */}
        <div className="card">
          <h3>⚠️ System Status Flags</h3>
          <div className="status-flags-list">
            <div className={`status-flag ${telemetry.sideStandStatus ? 'active' : ''}`}>
              <span className="flag-icon">🛑</span>
              <span className="flag-label">Side Stand Sensor</span>
              <span className="flag-status">{telemetry.sideStandStatus ? 'DOWN' : 'UP'}</span>
            </div>

            <div className={`status-flag ${telemetry.isgFault ? 'error' : ''}`}>
              <span className="flag-icon">🔄</span>
              <span className="flag-label">ISG System</span>
              <span className="flag-status">{telemetry.isgFault ? 'FAULT' : 'OK'}</span>
            </div>

            <div className={`status-flag ${telemetry.fuelSensorFault ? 'error' : ''}`}>
              <span className="flag-icon">⛽</span>
              <span className="flag-label">Fuel Sensor</span>
              <span className="flag-status">{telemetry.fuelSensorFault ? 'FAULT' : 'OK'}</span>
            </div>
          </div>
        </div>

        {/* Data Logging */}
        <div className="card">
          <h3>📊 Data Logging</h3>
          <p className="log-info">
            Logged Data Points: <strong>{sensorLogs.length}</strong>
          </p>
          <div className="log-actions">
            <button className="btn btn-primary" onClick={exportToCSV}>
              Export to CSV
            </button>
            <button
              className="btn btn-danger"
              onClick={() => {
                if (confirm('Clear all sensor logs?')) {
                  clearSensorLogs();
                }
              }}
            >
              Clear Logs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticCenter;
