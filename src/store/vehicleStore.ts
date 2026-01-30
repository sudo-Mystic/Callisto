import { create } from 'zustand';
import { initialTelemetry, type TelemetryData } from '../utils/SpeedometerParser';

interface DeviceInfo {
  deviceId: string;
  name: string;
}

interface VehicleState {
  isConnected: boolean;
  isScanning: boolean;
  device: DeviceInfo | null;
  connectionStatus: string;
  telemetry: TelemetryData;
  isFindMe: boolean;

  // Actions
  setScanning: (scanning: boolean) => void;
  setConnected: (connected: boolean) => void;
  setDevice: (device: DeviceInfo | null) => void;
  setConnectionStatus: (status: string) => void;
  updateTelemetry: (data: Partial<TelemetryData>) => void;
  setFindMe: (enabled: boolean) => void;
}

export const useVehicleStore = create<VehicleState>((set) => ({
  isConnected: false,
  isScanning: false,
  device: null,
  connectionStatus: 'Disconnected',
  telemetry: initialTelemetry,
  isFindMe: false,

  setScanning: (scanning) => set({ isScanning: scanning }),
  setConnected: (connected) => set({ isConnected: connected }),
  setDevice: (device) => set({ device }),
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  updateTelemetry: (data) => set((state) => ({ telemetry: { ...state.telemetry, ...data } })),
  setFindMe: (enabled) => set({ isFindMe: enabled }),
}));
