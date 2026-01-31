import React, { useState } from 'react';
import { useVehicleStore } from '../../store/vehicleStore';
import { AlertTriangle, CheckCircle, Activity, Thermometer, Zap } from 'lucide-react';
import clsx from 'clsx';

const DiagnosticCard: React.FC<{ label: string; value: string | number; unit?: string; status?: 'normal' | 'warning' | 'error'; icon: React.ReactNode }> = ({ label, value, unit, status = 'normal', icon }) => (
    <div className={clsx("p-4 rounded-xl border flex flex-col justify-between",
        status === 'error' ? "bg-red-500/10 border-red-500/50" :
        status === 'warning' ? "bg-yellow-500/10 border-yellow-500/50" : "bg-slate-800 border-slate-700"
    )}>
        <div className="flex justify-between items-start mb-2">
            <span className="text-slate-400 text-xs uppercase font-bold">{label}</span>
            <div className={clsx("p-1.5 rounded-lg",
                 status === 'error' ? "bg-red-500 text-white" :
                 status === 'warning' ? "bg-yellow-500 text-black" : "bg-slate-700 text-slate-400"
            )}>
                {icon}
            </div>
        </div>
        <div>
            <span className="text-xl font-mono font-bold">{value}</span>
            {unit && <span className="text-sm text-slate-500 ml-1">{unit}</span>}
        </div>
    </div>
);

export const DiagnosticCenter: React.FC = () => {
    const { telemetry } = useVehicleStore();
    const [activeTab, setActiveTab] = useState<'sensors' | 'dtc'>('sensors');

    // Simulate DTCs if MIL is on (Since we don't have a full DTC map yet)
    const dtcList = telemetry.malfunctionIndicator
        ? [
            { code: 'P0101', description: 'MAF Sensor Range', simulated: true },
            { code: 'P0300', description: 'Random Misfire', simulated: true }
          ]
        : [];

    return (
        <div className="p-4 pb-24 h-full overflow-y-auto bg-slate-950">
            <h1 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Activity className="text-blue-500" />
                Diagnostic Center
            </h1>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 bg-slate-900 p-1 rounded-lg">
                <button
                    onClick={() => setActiveTab('sensors')}
                    className={clsx("flex-1 py-2 rounded-md text-sm font-bold transition-all", activeTab === 'sensors' ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white")}
                >
                    Live Sensors
                </button>
                <button
                    onClick={() => setActiveTab('dtc')}
                    className={clsx("flex-1 py-2 rounded-md text-sm font-bold transition-all", activeTab === 'dtc' ? "bg-red-600 text-white shadow-lg" : "text-slate-400 hover:text-white")}
                >
                    DTC Scanner
                </button>
            </div>

            {activeTab === 'sensors' ? (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                         <DiagnosticCard
                             label="Intake Air Temp"
                             value={telemetry.intakeAirTemp}
                             unit="°C"
                             icon={<Thermometer size={16} />}
                         />
                         <DiagnosticCard
                             label="MAP Sensor"
                             value={telemetry.mapSensor}
                             unit="kPa"
                             icon={<Activity size={16} />}
                         />
                         <DiagnosticCard
                             label="Battery Voltage"
                             value={telemetry.batteryVoltage.toFixed(2)}
                             unit="V"
                             status={telemetry.batteryVoltage < 12.0 ? 'warning' : 'normal'}
                             icon={<Zap size={16} />}
                         />
                         <DiagnosticCard
                             label="Engine Load"
                             value={telemetry.engineLoad}
                             unit="%"
                             icon={<Activity size={16} />}
                         />
                         <DiagnosticCard
                             label="Fuel Inj. Vol"
                             value={telemetry.fuelInjectionVolume}
                             unit="mL"
                             icon={<Activity size={16} />}
                         />
                         <DiagnosticCard
                             label="Throttle Pos"
                             value={telemetry.throttlePosition.toFixed(1)}
                             unit="%"
                             icon={<Activity size={16} />}
                         />
                    </div>

                    <div className="bg-slate-900 p-4 rounded-xl">
                        <h3 className="text-slate-400 text-xs font-bold mb-3 uppercase">System Status</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span>ISG System</span>
                                <span className={clsx("text-xs font-bold px-2 py-1 rounded", telemetry.isgStatus ? "bg-green-500/20 text-green-400" : "bg-slate-700 text-slate-400")}>
                                    {telemetry.isgStatus ? "ACTIVE" : "INACTIVE"}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Side Stand</span>
                                <span className={clsx("text-xs font-bold px-2 py-1 rounded", telemetry.sideStandStatus ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400")}>
                                    {telemetry.sideStandStatus ? "DOWN" : "UP"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="bg-slate-900 p-6 rounded-xl flex flex-col items-center justify-center min-h-[200px]">
                         {telemetry.malfunctionIndicator ? (
                             <>
                                <div className="p-4 bg-red-500/20 rounded-full mb-4 animate-pulse">
                                    <AlertTriangle size={48} className="text-red-500" />
                                </div>
                                <h2 className="text-xl font-bold text-red-500 mb-2">Faults Detected</h2>
                                <p className="text-slate-400 text-center text-sm mb-6">The ECU has reported the following diagnostic trouble codes.</p>

                                <div className="w-full space-y-2">
                                    {dtcList.map((dtc, idx) => (
                                        <div key={idx} className="bg-red-950/50 border border-red-900/50 p-3 rounded-lg flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <AlertTriangle size={16} className="text-red-500" />
                                                <span className="font-mono text-red-200">{dtc.code} - {dtc.description}</span>
                                            </div>
                                            {dtc.simulated && (
                                                <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded uppercase font-bold">Simulated</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                             </>
                         ) : (
                             <>
                                <div className="p-4 bg-green-500/20 rounded-full mb-4">
                                    <CheckCircle size={48} className="text-green-500" />
                                </div>
                                <h2 className="text-xl font-bold text-green-500 mb-2">All Systems Normal</h2>
                                <p className="text-slate-400 text-center text-sm">No diagnostic trouble codes found.</p>
                             </>
                         )}
                    </div>

                    <button
                        disabled={true}
                        title="Requires restart — not yet implemented"
                        className="w-full py-4 bg-slate-800 text-slate-300 font-bold rounded-xl disabled:opacity-50 cursor-not-allowed transition-colors"
                    >
                        Clear DTCs (Requires Restart)
                    </button>
                </div>
            )}
        </div>
    );
};
