import { useEffect, useState } from 'react';
import { bleService } from './services/BleService';
import { useAppStore } from './stores/appStore';
import Dashboard from './components/Dashboard';
import DiagnosticCenter from './components/DiagnosticCenter';
import Navigation from './components/Navigation';
import CommandCenter from './components/CommandCenter';
import ConnectionScreen from './components/ConnectionScreen';
import Settings from './components/Settings';
import './styles/global.css';

type Screen = 'connection' | 'dashboard' | 'diagnostics' | 'navigation' | 'command' | 'settings';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('connection');
  const { connection, updateTelemetry, updateMetrics } = useAppStore();

  useEffect(() => {
    // Initialize BLE
    bleService.initialize().catch(console.error);

    // Set up data callback
    bleService.onData((data) => {
      updateTelemetry(data);
      updateMetrics();
    });
  }, [updateTelemetry, updateMetrics]);

  useEffect(() => {
    // Auto-navigate to dashboard when connected
    if (connection.isConnected && currentScreen === 'connection') {
      setCurrentScreen('dashboard');
    } else if (!connection.isConnected && currentScreen !== 'connection') {
      setCurrentScreen('connection');
    }
  }, [connection.isConnected, currentScreen]);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'connection':
        return <ConnectionScreen />;
      case 'dashboard':
        return <Dashboard />;
      case 'diagnostics':
        return <DiagnosticCenter />;
      case 'navigation':
        return <Navigation />;
      case 'command':
        return <CommandCenter />;
      case 'settings':
        return <Settings />;
      default:
        return <ConnectionScreen />;
    }
  };

  return (
    <div className="app">
      {/* Header */}
      {connection.isConnected && (
        <header className="app-header">
          <div className="header-content">
            <h1>Callisto</h1>
            <div className="connection-status">
              <span className="status-dot pulse"></span>
              <span>Connected</span>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="app-content">
        {renderScreen()}
      </main>

      {/* Bottom Navigation */}
      {connection.isConnected && (
        <nav className="bottom-nav">
          <button
            className={currentScreen === 'dashboard' ? 'active' : ''}
            onClick={() => setCurrentScreen('dashboard')}
          >
            <span>📊</span>
            <span>Dashboard</span>
          </button>
          <button
            className={currentScreen === 'diagnostics' ? 'active' : ''}
            onClick={() => setCurrentScreen('diagnostics')}
          >
            <span>🔧</span>
            <span>Diagnostics</span>
          </button>
          <button
            className={currentScreen === 'navigation' ? 'active' : ''}
            onClick={() => setCurrentScreen('navigation')}
          >
            <span>🗺️</span>
            <span>Navigate</span>
          </button>
          <button
            className={currentScreen === 'command' ? 'active' : ''}
            onClick={() => setCurrentScreen('command')}
          >
            <span>🎮</span>
            <span>Control</span>
          </button>
          <button
            className={currentScreen === 'settings' ? 'active' : ''}
            onClick={() => setCurrentScreen('settings')}
          >
            <span>⚙️</span>
            <span>Settings</span>
          </button>
        </nav>
      )}
    </div>
  );
}

export default App;
