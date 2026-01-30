import React, { useEffect } from 'react';
import { useVehicleStore } from '../store/vehicleStore';
import { bleService } from '../services/BleService';
import { Bluetooth, RefreshCw, Smartphone } from 'lucide-react';
import clsx from 'clsx';

export const ConnectionScreen: React.FC = () => {
  const { isConnected, isScanning, connectionStatus, device } = useVehicleStore();

  useEffect(() => {
    bleService.initialize();
  }, []);

  const handleScan = () => {
    if (!isScanning) {
      bleService.scan();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-slate-700 p-6 flex flex-col items-center">
            <div className={clsx("p-4 rounded-full mb-4 transition-all duration-500",
                isConnected ? "bg-green-500/20 text-green-400" :
                isScanning ? "bg-blue-500/20 text-blue-400 animate-pulse" : "bg-slate-600/30 text-slate-400"
            )}>
                <Bluetooth size={48} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
                {isConnected ? 'Connected' : 'Connect to Bike'}
            </h1>
            <p className="text-slate-400 mt-1">{connectionStatus}</p>
        </div>

        {/* Content */}
        <div className="p-8 flex flex-col gap-6">
            {isConnected ? (
                <div className="bg-slate-700/50 rounded-lg p-4 flex items-center gap-4 border border-slate-600">
                    <Smartphone className="text-slate-400" />
                    <div>
                        <p className="font-medium">{device?.name}</p>
                        <p className="text-xs text-slate-500 font-mono">{device?.deviceId}</p>
                    </div>
                </div>
            ) : (
                <div className="text-center text-slate-500 text-sm">
                    Make sure your bike ignition is ON and Bluetooth is enabled on your phone.
                </div>
            )}

            <button
                onClick={handleScan}
                disabled={isScanning || isConnected}
                className={clsx(
                    "flex items-center justify-center gap-2 w-full py-4 rounded-xl font-bold transition-all",
                    isScanning || isConnected
                        ? "bg-slate-700 text-slate-500 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20"
                )}
            >
                {isScanning ? (
                    <>
                        <RefreshCw className="animate-spin" size={20} />
                        Scanning...
                    </>
                ) : isConnected ? (
                    'Device Ready'
                ) : (
                    'Scan for Vehicle'
                )}
            </button>

            {isConnected && (
                <button
                    onClick={() => bleService.disconnect()}
                    className="text-red-400 text-sm hover:underline mt-2"
                >
                    Disconnect
                </button>
            )}
        </div>
      </div>

      <div className="mt-8 text-slate-500 text-xs">
          Callisto v1.0 • TVS Connect Alternative
      </div>
    </div>
  );
};
