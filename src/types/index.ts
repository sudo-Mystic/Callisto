// Protocol Start Bytes
export enum StartByte {
  MOBILE_TO_CLUSTER = 0x5B, // 91 - Mobile to Cluster
  CLUSTER_TO_MOBILE = 0x5A, // 90 - Cluster to Mobile
}

// Protocol End Byte
export const END_BYTE = 0xFF; // 255

// Protocol Packet Types (Data IDs)
export enum PacketType {
  // Incoming from Cluster (preceded by 0x5A)
  SPEEDOMETER_1 = 0x10, // Main telemetry (RPM, Speed, Throttle)
  SPEEDOMETER_2 = 0x11, // Secondary telemetry (Diagnostics, DTC)
  SPEEDOMETER_3 = 0x19, // Fuel economy and ISS data
  SPEEDOMETER_4 = 0x18, // Engine diagnostics (Load, MAP, Temps, Fuel)
  CALIBRATION_RESPONSE = 0x37, // Calibration response
  
  // Outgoing to Cluster
  MOBILE_DATA = 0x4A,   // Cyclic keep-alive (preceded by 0x5B)
  RIDER_NAME = 0x52,    // Authentication handshake (preceded by 0x5B)
  CUSTOM_TEXT_1 = 0x4C, // Custom text line 1 (preceded by 0x5B)
  CUSTOM_TEXT_2 = 0x63, // Custom text line 2 (preceded by 0x5B)
  NAVIGATION_PICTOGRAM = 0x50, // Turn instruction (preceded by 0x5B)
  NAVIGATION_STATUS = 0x49,  // ETA and distance (preceded by 0x5A)
  VEHICLE_CONTROL = 0xF1, // Remote control (preceded by 0x5A)
  CALIBRATION = 0x73,   // Calibration commands (preceded by 0x5B)
}

// Vehicle Telemetry Data
export interface TelemetryData {
  // From SpeedOMeter1 (0x10)
  speed: number;           // km/h
  rpm: number;             // RPM
  throttlePosition: number; // 0-100%
  odo: number;             // km
  tripDistance: number;    // km
  
  // From SpeedOMeter2 (0x11)
  gear: number;            // Current gear
  dtcCode: number;         // Diagnostic Trouble Code
  milBlinkCode: number;    // MIL (Check Engine Light) code
  
  // From SpeedOMeter4 (0x18)
  engineLoad: number;      // % (0-100)
  batteryVoltage: number;  // Volts (e.g., 12.4V)
  fuelInjected: number;    // mL
  intakeAirTemp: number;   // °C
  mapSensor: number;       // kPa (Manifold Absolute Pressure)
  engineTemp: number;      // °C
  instantFuelEconomy: number; // km/l
  
  // System flags
  sideStandStatus: boolean;
  isgFault: boolean;
  fuelSensorFault: boolean;
  
  // Timestamps
  timestamp: number;       // Unix timestamp
}

// Diagnostic Data
export interface DiagnosticData {
  dtcCode: number;
  dtcDescription: string;
  sensorHealth: {
    intakeTemp: number;
    mapSensor: number;
    engineTemp: number;
    batteryVoltage: number;
  };
  systemFlags: {
    sideStand: boolean;
    isgFault: boolean;
    fuelSensorFault: boolean;
  };
}

// Navigation Data
export interface NavigationData {
  turnType: number;        // Mapbox turn type mapped to cluster ID
  distance: number;        // Distance to destination (m)
  eta: number;             // Estimated time (seconds)
  currentManeuver: string; // Human-readable instruction
}

// Derived Features
export interface DerivedMetrics {
  ecoScore: 'A' | 'B' | 'C' | 'D';
  zeroToSixtyTime: number | null; // seconds
  realWorldRange: number;         // km
  engineUsageHours: number;       // hours
  ridingStyle: string;
}

// Bluetooth Connection State
export interface BleConnectionState {
  isConnected: boolean;
  isScanning: boolean;
  deviceId: string | null;
  deviceName: string | null;
  error: string | null;
}

// Vehicle Control Commands
export interface VehicleControlCommand {
  findVehicle: boolean;      // Horn + Indicators
  illuminationLevel: number; // 1-5
  testTurnSignals: boolean;  // TSL test
  riderName: string;         // Custom name on cluster
}

// Settings
export interface AppSettings {
  mechanicMode: boolean;
  autoConnect: boolean;
  logSensorData: boolean;
  safetyGuardrails: boolean; // Disable controls when speed > 0
  riderName: string;
}

// Service UUIDs (TVS Connect Protocol)
export const SERVICE_UUID = '54565320-4252-4944-4745-5F5553425F5251';
export const CHARACTERISTIC_WRITE_UUID = '54565320-4252-4944-4745-5F5553425F5257';
export const CHARACTERISTIC_NOTIFY_UUID = '54565320-4252-4944-4745-5F5553425F524E';
