import React, { useState, useRef, useEffect } from 'react';
import { bleService } from '../../services/BleService';
import { Sliders, Sun, Search, Power } from 'lucide-react';
import clsx from 'clsx';
import { useVehicleStore } from '../../store/vehicleStore';

export const CommandCenter: React.FC = () => {
    const { telemetry, isFindMe, setFindMe } = useVehicleStore();
    const [illumination, setIllumination] = useState(3);
    const [isTestRunning, setTestRunning] = useState(false);

    // Safety: Disable controls if speed > 0
    const isMoving = telemetry.speed > 0;

    // Refs for safe async operations
    const isMounted = useRef(false);
    const tslTimeout = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
            if (tslTimeout.current) {
                clearTimeout(tslTimeout.current);
            }
        };
    }, []);

    const handleIlluminationChange = async (val: number) => {
        if (isMoving) return;
        setIllumination(val);
        // Vehicle Control Packet (0xF1) - Byte 2 is Illumination (1-5)
        const packet = new Uint8Array(20);
        packet[0] = 0x5A;
        packet[1] = 0xF1;
        packet[2] = val; // Illumination
        packet[3] = 0x09; // Command ID
        packet[19] = 0xFF;

        await bleService.write(packet);
    };

    const toggleFindMyVehicle = async () => {
        // Toggle global state, BleService will pick it up in next cycle
        setFindMe(!isFindMe);
    };

    const runTslTest = async () => {
        if (isMoving) return;
        if (isTestRunning) return;

        setTestRunning(true);

        // Toggle TSL on
        const packetOn = new Uint8Array(20);
        packetOn[0] = 0x5A;
        packetOn[1] = 0xF1;
        packetOn[6] = 0x01; // TSL On
        packetOn[19] = 0xFF;
        await bleService.write(packetOn);

        tslTimeout.current = setTimeout(async () => {
            if (!isMounted.current) return;

            // Toggle TSL off
            const packetOff = new Uint8Array(20);
            packetOff[0] = 0x5A;
            packetOff[1] = 0xF1;
            packetOff[6] = 0x00; // TSL Off
            packetOff[19] = 0xFF;
            await bleService.write(packetOff);

            if (isMounted.current) {
                setTestRunning(false);
            }
        }, 3000);
    };

    return (
        <div className="p-4 pb-24 h-full overflow-y-auto bg-slate-950">
            <h1 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Sliders className="text-purple-500" />
                Command Center
            </h1>

            {isMoving && (
                <div className="bg-red-500/20 border border-red-500/50 p-4 rounded-xl mb-6 text-red-200 text-sm font-bold flex items-center gap-2">
                    <Power size={16} />
                    Controls disabled while moving
                </div>
            )}

            <div className={clsx("space-y-6", isMoving && "opacity-50 pointer-events-none")}>

                {/* Illumination Control */}
                <div className="bg-slate-900 p-5 rounded-xl border border-slate-800">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-yellow-500/20 rounded-lg text-yellow-500">
                                <Sun size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold">Cluster Brightness</h3>
                                <p className="text-xs text-slate-500">Adjust dashboard backlight</p>
                            </div>
                        </div>
                        <span className="font-mono text-xl font-bold">{illumination}</span>
                    </div>

                    <input
                        type="range"
                        min="1"
                        max="5"
                        step="1"
                        value={illumination}
                        onChange={(e) => handleIlluminationChange(parseInt(e.target.value))}
                        disabled={isMoving}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-2 font-mono">
                        <span>MIN</span>
                        <span>MAX</span>
                    </div>
                </div>

                {/* Find My Vehicle */}
                <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg text-blue-500">
                            <Search size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold">Find My Vehicle</h3>
                            <p className="text-xs text-slate-500">Trigger horn & indicators</p>
                        </div>
                    </div>
                    <button
                        onClick={toggleFindMyVehicle}
                        className={clsx("p-3 rounded-lg transition-colors font-bold text-sm",
                            isFindMe ? "bg-red-600 hover:bg-red-500 text-white" : "bg-blue-600 hover:bg-blue-500 text-white"
                        )}
                    >
                        {isFindMe ? 'STOP LOCATING' : 'LOCATE'}
                    </button>
                </div>

                 {/* TSL Test */}
                 <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/20 rounded-lg text-green-500">
                            <Power size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold">TSL Diagnostic</h3>
                            <p className="text-xs text-slate-500">Test turn signals (3s pulse)</p>
                        </div>
                    </div>
                    <button
                        onClick={runTslTest}
                        disabled={isTestRunning || isMoving}
                        className={clsx("p-3 rounded-lg transition-colors font-bold text-sm",
                            isTestRunning ? "bg-slate-700 text-slate-500" : "bg-green-600 hover:bg-green-500 text-white"
                        )}
                    >
                        {isTestRunning ? 'TESTING...' : 'RUN TEST'}
                    </button>
                </div>

            </div>
        </div>
    );
};
