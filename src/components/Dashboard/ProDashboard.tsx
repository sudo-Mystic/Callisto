import React from 'react';
import { useVehicleStore } from '../../store/vehicleStore';
import { Gauge, Battery, Fuel, Zap, Thermometer, Activity } from 'lucide-react';

const StatCard: React.FC<{ label: string; value: string | number; unit: string; icon: React.ReactNode; color?: string }> = ({ label, value, unit, icon, color = "text-blue-400" }) => (
    <div className="bg-slate-800 p-4 rounded-xl flex flex-col justify-between relative overflow-hidden">
        <div className={`absolute top-2 right-2 opacity-20 ${color}`}>
            {icon}
        </div>
        <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold">{label}</span>
        <div className="flex items-baseline gap-1 mt-2">
            <span className="text-2xl font-bold text-white">{value}</span>
            <span className="text-sm text-slate-500">{unit}</span>
        </div>
    </div>
);

export const ProDashboard: React.FC = () => {
    const { telemetry } = useVehicleStore();

    // Calculate RPM percentage for visualization (Assuming 9000 RPM max)
    const rpmPercent = Math.min((telemetry.rpm / 9000) * 100, 100);

    // Calculate Engine Load Color (Unused variable removed for lint)
    // const loadColor = telemetry.engineLoad > 80 ? 'bg-red-500' : telemetry.engineLoad > 50 ? 'bg-yellow-500' : 'bg-green-500';

    return (
        <div className="flex flex-col h-screen bg-slate-950 p-4 pb-20 overflow-y-auto">
            {/* Top Bar: RPM & Speed */}
            <div className="flex flex-col items-center justify-center py-6 relative">

                {/* RPM Bar */}
                <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden mb-4 relative">
                    <div
                        className="h-full bg-gradient-to-r from-blue-600 via-purple-500 to-red-500 transition-all duration-150 ease-out"
                        style={{ width: `${rpmPercent}%` }}
                    />
                    <div className="absolute top-0 w-full h-full flex justify-between px-2 text-[10px] text-slate-500 items-center font-mono">
                         <span>0</span><span>3k</span><span>6k</span><span>9k</span>
                    </div>
                </div>

                {/* Speed */}
                <div className="flex flex-col items-center">
                    <span className="text-8xl font-black text-white tracking-tighter leading-none font-mono">
                        {telemetry.speed}
                    </span>
                    <span className="text-slate-500 uppercase font-bold tracking-widest text-sm mt-2">km/h</span>
                </div>

                {/* RPM Value */}
                <div className="absolute top-6 right-0 text-right">
                    <span className="text-xl font-bold text-slate-300 font-mono">{telemetry.rpm}</span>
                    <span className="block text-xs text-slate-600 uppercase">RPM</span>
                </div>
            </div>

            {/* Grid Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <StatCard
                    label="Throttle"
                    value={telemetry.throttlePosition.toFixed(0)}
                    unit="%"
                    icon={<Gauge size={32} />}
                    color="text-emerald-400"
                />
                <StatCard
                    label="Engine Load"
                    value={telemetry.engineLoad}
                    unit="%"
                    icon={<Activity size={32} />}
                    color="text-orange-400"
                />
                <StatCard
                    label="Battery"
                    value={telemetry.batteryVoltage.toFixed(1)}
                    unit="V"
                    icon={<Battery size={32} />}
                    color={telemetry.batteryVoltage < 12.0 ? "text-red-400" : "text-green-400"}
                />
                <StatCard
                    label="Fuel Level"
                    value={telemetry.fuelLevel}
                    unit="%"
                    icon={<Fuel size={32} />}
                    color={telemetry.fuelLevel < 20 ? "text-red-400" : "text-blue-400"}
                />
            </div>

            {/* Detailed Telemetry Row */}
            <div className="bg-slate-900 rounded-xl p-4 grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                    <div className="flex justify-center mb-1 text-slate-500"><Thermometer size={16} /></div>
                    <div className="text-lg font-bold">{telemetry.coolantTemp}°</div>
                    <div className="text-[10px] text-slate-600 uppercase">Coolant</div>
                </div>
                <div className="text-center border-x border-slate-800">
                    <div className="flex justify-center mb-1 text-slate-500"><Zap size={16} /></div>
                    <div className="text-lg font-bold">{telemetry.mapSensor}</div>
                    <div className="text-[10px] text-slate-600 uppercase">MAP (kPa)</div>
                </div>
                <div className="text-center">
                    <div className="flex justify-center mb-1 text-slate-500"><Fuel size={16} /></div>
                    <div className="text-lg font-bold">{telemetry.distanceToEmpty}</div>
                    <div className="text-[10px] text-slate-600 uppercase">Range (km)</div>
                </div>
            </div>

            {/* Exclusive Data */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                 <h3 className="text-slate-400 text-xs uppercase font-bold mb-3">Trip Analytics</h3>
                 <div className="flex justify-between items-center mb-2">
                     <span className="text-slate-500 text-sm">Fuel Injected</span>
                     <span className="text-white font-mono">{telemetry.fuelInjectionVolume} mL</span>
                 </div>
                 <div className="flex justify-between items-center mb-2">
                     <span className="text-slate-500 text-sm">Avg Speed</span>
                     <span className="text-white font-mono">{telemetry.averageSpeed} km/h</span>
                 </div>
                 <div className="flex justify-between items-center">
                     <span className="text-slate-500 text-sm">Odometer</span>
                     <span className="text-white font-mono">{telemetry.odometer.toFixed(1)} km</span>
                 </div>
            </div>

        </div>
    );
};
