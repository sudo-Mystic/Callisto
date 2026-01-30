import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { ConnectionScreen } from './components/ConnectionScreen';
import { ProDashboard } from './components/Dashboard/ProDashboard';
import { MapComponent } from './components/Navigation/MapComponent';
import { DiagnosticCenter } from './components/Diagnostics/DiagnosticCenter';
import { CommandCenter } from './components/Controls/CommandCenter';
import { useVehicleStore } from './store/vehicleStore';
import { Navigation, Gauge, Activity, Sliders } from 'lucide-react';
import clsx from 'clsx';
import './index.css';

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { isConnected } = useVehicleStore();
    if (!isConnected) {
        return <Navigate to="/" replace />;
    }
    return <>{children}</>;
};

const BottomNav = () => {
    const location = useLocation();

    const navItems = [
        { path: '/dashboard', icon: <Gauge size={20} />, label: 'DASH' },
        { path: '/navigation', icon: <Navigation size={20} />, label: 'NAV' },
        { path: '/diagnostics', icon: <Activity size={20} />, label: 'DIAG' },
        { path: '/controls', icon: <Sliders size={20} />, label: 'CMD' },
    ];

    return (
        <div className="fixed bottom-0 w-full bg-slate-900 border-t border-slate-800 p-2 pb-6 z-50">
            <div className="flex justify-around items-center">
                {navItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={clsx(
                            "flex flex-col items-center py-2 px-4 rounded-xl transition-all",
                            location.pathname === item.path ? "text-blue-400 bg-blue-500/10" : "text-slate-500 hover:text-slate-300"
                        )}
                    >
                        {item.icon}
                        <span className="text-[10px] font-bold mt-1">{item.label}</span>
                    </Link>
                ))}
            </div>
        </div>
    );
}

function App() {
  const { isConnected, telemetry } = useVehicleStore();

  return (
    <Router>
      <div className="min-h-screen bg-black text-white relative">
        <Routes>
          <Route path="/" element={isConnected ? <Navigate to="/dashboard" /> : <ConnectionScreen />} />
          <Route
            path="/dashboard"
            element={
                <ProtectedRoute>
                    <ProDashboard />
                </ProtectedRoute>
            }
          />
          <Route
            path="/navigation"
            element={
                <ProtectedRoute>
                    <div className="h-screen w-full p-4 pb-24 flex flex-col">
                        <h1 className="text-xl font-bold mb-4 flex justify-between items-center">
                            Navigation
                            <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-400 font-mono">
                                {telemetry.speed} km/h
                            </span>
                        </h1>
                        <div className="flex-1">
                             <MapComponent />
                        </div>
                    </div>
                </ProtectedRoute>
            }
          />
          <Route
            path="/diagnostics"
            element={
                <ProtectedRoute>
                    <DiagnosticCenter />
                </ProtectedRoute>
            }
          />
          <Route
            path="/controls"
            element={
                <ProtectedRoute>
                    <CommandCenter />
                </ProtectedRoute>
            }
          />
        </Routes>

        {isConnected && <BottomNav />}
      </div>
    </Router>
  );
}

export default App;
