import { create } from 'zustand';
import {
  TelemetryData,
  BleConnectionState,
  AppSettings,
  DerivedMetrics,
  NavigationData,
} from '../types';

interface AppState {
  // Connection
  connection: BleConnectionState;
  setConnection: (state: Partial<BleConnectionState>) => void;

  // Telemetry
  telemetry: TelemetryData | null;
  updateTelemetry: (data: Partial<TelemetryData>) => void;

  // Navigation
  navigation: NavigationData | null;
  setNavigation: (data: NavigationData | null) => void;

  // Derived Metrics
  metrics: DerivedMetrics;
  updateMetrics: () => void;

  // Settings
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;

  // Logs (for CSV export)
  sensorLogs: TelemetryData[];
  addSensorLog: (data: TelemetryData) => void;
  clearSensorLogs: () => void;

  // Performance Tracking
  zeroToSixtyStart: number | null;
  startZeroToSixtyTimer: () => void;
  stopZeroToSixtyTimer: () => void;
}

const calculateEcoScore = (
  throttle: number,
  fuelEconomy: number
): 'A' | 'B' | 'C' | 'D' => {
  if (throttle < 30 && fuelEconomy > 40) return 'A';
  if (throttle < 50 && fuelEconomy > 30) return 'B';
  if (throttle < 70 && fuelEconomy > 20) return 'C';
  return 'D';
};

export const useAppStore = create<AppState>((set, get) => ({
  // Connection state
  connection: {
    isConnected: false,
    isScanning: false,
    deviceId: null,
    deviceName: null,
    error: null,
  },
  setConnection: (state) =>
    set((prev) => ({
      connection: { ...prev.connection, ...state },
    })),

  // Telemetry state
  telemetry: null,
  updateTelemetry: (data) =>
    set((prev) => {
      const newTelemetry = {
        ...(prev.telemetry || {}),
        ...data,
      } as TelemetryData;

      // Auto-log if enabled
      if (get().settings.logSensorData) {
        get().addSensorLog(newTelemetry);
      }

      // Check for 0-60 timer
      if (get().zeroToSixtyStart && newTelemetry.speed >= 60) {
        get().stopZeroToSixtyTimer();
      } else if (newTelemetry.speed === 0 && !get().zeroToSixtyStart) {
        // Auto-start timer when stopped
        setTimeout(() => {
          if (get().telemetry?.speed === 0) {
            get().startZeroToSixtyTimer();
          }
        }, 2000);
      }

      return { telemetry: newTelemetry };
    }),

  // Navigation state
  navigation: null,
  setNavigation: (data) => set({ navigation: data }),

  // Derived Metrics
  metrics: {
    ecoScore: 'B',
    zeroToSixtyTime: null,
    realWorldRange: 0,
    engineUsageHours: 0,
    ridingStyle: 'Moderate',
  },
  updateMetrics: () =>
    set((prev) => {
      const telemetry = get().telemetry;
      if (!telemetry) return prev;

      const ecoScore = calculateEcoScore(
        telemetry.throttlePosition,
        telemetry.instantFuelEconomy
      );

      // Calculate real-world range
      const fuelRemaining = 10; // Example: assume 10L tank
      const avgFuelEconomy = telemetry.instantFuelEconomy || 30;
      const realWorldRange = fuelRemaining * avgFuelEconomy;

      // Calculate engine usage hours (based on fuel injected)
      const engineUsageHours = (telemetry.fuelInjected || 0) / 3600; // Simplified

      let ridingStyle = 'Moderate';
      if (telemetry.throttlePosition > 70) ridingStyle = 'Aggressive';
      if (telemetry.throttlePosition < 30) ridingStyle = 'Eco-Friendly';

      return {
        metrics: {
          ...prev.metrics,
          ecoScore,
          realWorldRange,
          engineUsageHours,
          ridingStyle,
        },
      };
    }),

  // Settings
  settings: {
    mechanicMode: false,
    autoConnect: true,
    logSensorData: false,
    safetyGuardrails: true,
    riderName: 'Callisto',
  },
  updateSettings: (settings) =>
    set((prev) => ({
      settings: { ...prev.settings, ...settings },
    })),

  // Sensor Logs
  sensorLogs: [],
  addSensorLog: (data) =>
    set((prev) => ({
      sensorLogs: [...prev.sensorLogs, data].slice(-1000), // Keep last 1000
    })),
  clearSensorLogs: () => set({ sensorLogs: [] }),

  // Performance Tracking
  zeroToSixtyStart: null,
  startZeroToSixtyTimer: () => set({ zeroToSixtyStart: Date.now() }),
  stopZeroToSixtyTimer: () =>
    set((prev) => {
      if (!prev.zeroToSixtyStart) return prev;

      const time = (Date.now() - prev.zeroToSixtyStart) / 1000;
      return {
        zeroToSixtyStart: null,
        metrics: {
          ...prev.metrics,
          zeroToSixtyTime: time,
        },
      };
    }),
}));
