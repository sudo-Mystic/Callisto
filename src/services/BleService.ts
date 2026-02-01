import { BleClient, BleDevice, ScanResult } from '@capacitor-community/bluetooth-le';
import {
  SERVICE_UUID,
  CHARACTERISTIC_WRITE_UUID,
  CHARACTERISTIC_NOTIFY_UUID,
  PacketType,
  StartByte,
  END_BYTE,
  TelemetryData,
} from '../types';

class BleService {
  private deviceId: string | null = null;
  private isConnected = false;
  private keepAliveInterval: NodeJS.Timeout | null = null;
  private onDataCallback: ((data: TelemetryData) => void) | null = null;
  private initialized = false;
  private initializationError: string | null = null;
  private initializationPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    // Return existing promise if already initializing
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.doInitialize();
    return this.initializationPromise;
  }

  private async doInitialize(): Promise<void> {
    try {
      // Check if Web Bluetooth API is available
      if (typeof navigator === 'undefined' || !navigator.bluetooth) {
        throw new Error('Web Bluetooth is not supported in this browser. Please use Chrome, Edge, or Opera on a desktop or Android device.');
      }

      await BleClient.initialize();
      this.initialized = true;
      this.initializationError = null;
      console.log('BLE initialized');
    } catch (error) {
      this.initialized = false;
      this.initializationError = error instanceof Error ? error.message : 'Failed to initialize Bluetooth';
      console.error('Failed to initialize BLE:', error);
      throw error;
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getInitializationError(): string | null {
    return this.initializationError;
  }

  async ensureInitialized(): Promise<void> {
    if (this.initialized) {
      return;
    }
    if (this.initializationError) {
      throw new Error(this.initializationError);
    }
    await this.initialize();
  }

  async scan(onDeviceFound: (device: BleDevice) => void): Promise<void> {
    // Ensure BLE is initialized before scanning
    await this.ensureInitialized();

    try {
      await BleClient.requestLEScan(
        {
          services: [SERVICE_UUID],
        },
        (result: ScanResult) => {
          onDeviceFound(result.device);
        }
      );

      // Stop scanning after 10 seconds
      setTimeout(async () => {
        await BleClient.stopLEScan();
      }, 10000);
    } catch (error) {
      console.error('Failed to scan:', error);
      throw error;
    }
  }

  async connect(deviceId: string): Promise<void> {
    try {
      await BleClient.connect(deviceId, () => {
        console.log('Device disconnected');
        this.handleDisconnect();
      });

      this.deviceId = deviceId;
      this.isConnected = true;

      // Start notifications
      await BleClient.startNotifications(
        deviceId,
        SERVICE_UUID,
        CHARACTERISTIC_NOTIFY_UUID,
        (value) => {
          this.handleIncomingData(value);
        }
      );

      // Send handshake (Rider Name Packet)
      await this.sendHandshake();

      // Start keep-alive
      this.startKeepAlive();

      console.log('Connected to device:', deviceId);
    } catch (error) {
      console.error('Failed to connect:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.deviceId && this.isConnected) {
      try {
        this.stopKeepAlive();
        await BleClient.disconnect(this.deviceId);
        this.handleDisconnect();
      } catch (error) {
        console.error('Failed to disconnect:', error);
      }
    }
  }

  private handleDisconnect(): void {
    this.isConnected = false;
    this.deviceId = null;
    this.stopKeepAlive();
  }

  private async sendHandshake(): Promise<void> {
    if (!this.deviceId) return;

    // Rider Name Packet: 0x5B, 0x52, <name>, 0xFF
    const riderName = 'Callisto';
    const packet = new Uint8Array(20);
    packet[0] = StartByte.MOBILE_TO_CLUSTER; // 0x5B
    packet[1] = PacketType.RIDER_NAME; // 0x52
    
    // Encode rider name as ASCII (max 15 displayable chars, 17 bytes available)
    for (let i = 0; i < riderName.length && i < 17; i++) {
      packet[i + 2] = riderName.charCodeAt(i);
    }
    
    // Pad remaining bytes with 0x00
    for (let i = riderName.length + 2; i < 19; i++) {
      packet[i] = 0x00;
    }
    
    packet[19] = END_BYTE; // 0xFF

    await this.writeData(packet);
  }

  private startKeepAlive(): void {
    this.stopKeepAlive();
    
    this.keepAliveInterval = setInterval(async () => {
      if (!this.deviceId || !this.isConnected) return;

      // Mobile Data Packet (0x5B, 0x4A)
      const packet = this.createMobileDataPacket();
      
      try {
        await this.writeData(packet);
      } catch (error) {
        console.error('Keep-alive failed:', error);
      }
    }, 1000); // Every 1 second
  }

  private createMobileDataPacket(): Uint8Array {
    const packet = new Uint8Array(20);
    const now = new Date();
    
    // Byte 0: Start Byte
    packet[0] = StartByte.MOBILE_TO_CLUSTER; // 0x5B
    
    // Byte 1: Packet ID
    packet[1] = PacketType.MOBILE_DATA; // 0x4A
    
    // Byte 2: Signal & Battery (packed nibbles)
    // Upper nibble: Signal (0-9), Lower nibble: Battery (0-9)
    const signal = 9; // Max signal
    const battery = Math.floor(9 * (typeof navigator !== 'undefined' && 'getBattery' in navigator ? 0.8 : 0.8)); // Assume 80%
    packet[2] = (signal << 4) | battery;
    
    // Byte 3: Over Speed Limit (120 km/h for Jupiter)
    packet[3] = 120;
    
    // Bytes 4-5: Padding
    packet[4] = 0x00;
    packet[5] = 0x00;
    
    // Byte 6: Hour (0-23)
    packet[6] = now.getHours();
    
    // Byte 7: Minute (0-59)
    packet[7] = now.getMinutes();
    
    // Byte 8: Second (0-59)
    packet[8] = now.getSeconds();
    
    // Byte 9: AM/PM (0=AM, 1=PM)
    packet[9] = now.getHours() >= 12 ? 1 : 0;
    
    // Byte 10: Missed Calls
    packet[10] = 0;
    
    // Byte 11: Network Type (assume 4G)
    packet[11] = 4;
    
    // Byte 12: Day (1-31)
    packet[12] = now.getDate();
    
    // Byte 13: Month (0-11 from Calendar.MONTH)
    packet[13] = now.getMonth();
    
    // Byte 14: Year (last 2 digits)
    packet[14] = now.getFullYear() % 100;
    
    // Byte 15: Padding
    packet[15] = 0x00;
    
    // Byte 16: Voice Assist (packed nibbles)
    packet[16] = 0x00;
    
    // Byte 17: Find My Vehicle (0=Off, 1=On)
    packet[17] = 0x00;
    
    // Byte 18: Padding
    packet[18] = 0x00;
    
    // Byte 19: End Byte
    packet[19] = END_BYTE; // 0xFF
    
    return packet;
  }

  private stopKeepAlive(): void {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
  }

  private async writeData(data: Uint8Array): Promise<void> {
    if (!this.deviceId) throw new Error('Not connected');

    const dataView = new DataView(data.buffer);
    await BleClient.write(
      this.deviceId,
      SERVICE_UUID,
      CHARACTERISTIC_WRITE_UUID,
      dataView
    );
  }

  private handleIncomingData(value: DataView): void {
    const data = new Uint8Array(value.buffer);
    
    // Check start byte
    if (data[0] !== StartByte.CLUSTER_TO_MOBILE) {
      console.warn('Invalid start byte:', data[0]);
      return;
    }
    
    const packetType = data[1];

    try {
      const telemetry = this.parsePacket(packetType, data);
      if (telemetry && this.onDataCallback) {
        // Merge with default values to ensure all required fields are present
        const completeTelemetry: TelemetryData = {
          speed: 0,
          rpm: 0,
          throttlePosition: 0,
          odo: 0,
          tripDistance: 0,
          gear: 0,
          dtcCode: 0,
          milBlinkCode: 0,
          engineLoad: 0,
          batteryVoltage: 0,
          fuelInjected: 0,
          intakeAirTemp: 0,
          mapSensor: 0,
          engineTemp: 0,
          instantFuelEconomy: 0,
          sideStandStatus: false,
          isgFault: false,
          fuelSensorFault: false,
          timestamp: Date.now(),
          ...telemetry,
        };
        this.onDataCallback(completeTelemetry);
      }
    } catch (error) {
      console.error('Failed to parse packet:', error);
    }
  }

  private parsePacket(packetType: number, data: Uint8Array): Partial<TelemetryData> | null {
    switch (packetType) {
      case PacketType.SPEEDOMETER_1:
        return this.parseSpeedometer1(data);
      case PacketType.SPEEDOMETER_2:
        return this.parseSpeedometer2(data);
      case PacketType.SPEEDOMETER_3:
        return this.parseSpeedometer3(data);
      case PacketType.SPEEDOMETER_4:
        return this.parseSpeedometer4(data);
      default:
        return null;
    }
  }

  private parseSpeedometer1(data: Uint8Array): Partial<TelemetryData> {
    // SpeedOMeter1 (0x5A, 0x10) - Main telemetry
    
    // Byte 2: Speed (km/h)
    const speed = data[2];
    
    // Bytes 3-5: Odometer (3 bytes, /10 for km)
    const odo = ((data[5] << 16) | (data[4] << 8) | data[3]) / 10.0;
    
    // Byte 6: Fuel Level (0-100%)
    // const fuelLevel = data[6];
    
    // Byte 7: Average Speed
    // const avgSpeed = data[7];
    
    // Byte 9: Top Speed
    // const topSpeed = data[9];
    
    // Byte 10: Throttle Position (/2 for %)
    const throttlePosition = data[10] / 2.0;
    
    // Byte 11: Illumination & BT Pair Mode (packed)
    // const backlightIllumination = (data[11] >> 4) & 0x0F;
    // const btPairMode = data[11] & 0x0F;
    
    // Byte 13: Time 60 KMPH (*10 for ms)
    // const time60Kmph = data[13] * 10;
    
    // Bytes 14-16: Trip F Meter (3 bytes, /10 for km)
    const tripDistance = ((data[16] << 16) | (data[15] << 8) | data[14]) / 10.0;
    
    // Bytes 17-18: Engine RPM (2 bytes, little-endian)
    const rpm = (data[18] << 8) | data[17];

    return {
      speed,
      rpm,
      throttlePosition,
      odo,
      tripDistance,
      timestamp: Date.now(),
    };
  }

  private parseSpeedometer2(data: Uint8Array): Partial<TelemetryData> {
    // SpeedOMeter2 (0x5A, 0x11) - Diagnostics
    
    // Byte 2: Fuel Sensor Failure
    const fuelSensorFault = data[2] !== 0;
    
    // Byte 8: MIL Blink Code
    const milBlinkCode = data[8];
    
    // Byte 10: Vehicle Diagnostics (DTC)
    const dtcCode = data[10];
    
    // Byte 11: ISG Blink Code
    const isgBlinkCode = data[11];
    
    // Byte 6: ISS High/Low & Vehicle State 2
    // const issHighLow = data[6] & 0x01;
    
    // System flags
    const isgFault = isgBlinkCode !== 0;
    const sideStandStatus = (data[3] & 0x01) !== 0; // Example bit

    return {
      dtcCode,
      milBlinkCode,
      fuelSensorFault,
      isgFault,
      sideStandStatus,
      timestamp: Date.now(),
    };
  }

  private parseSpeedometer3(data: Uint8Array): Partial<TelemetryData> {
    // SpeedOMeter3 (0x5A, 0x19) - Fuel economy
    
    // Byte 9: Average Fuel Economy
    // const avgFuelEconomy = data[9];
    
    // Byte 10: Instantaneous Fuel Economy
    const instantFuelEconomy = data[10];
    
    // Bytes 12-13: Distance To Empty (2 bytes)
    // const distanceToEmpty = (data[13] << 8) | data[12];

    return {
      instantFuelEconomy,
      timestamp: Date.now(),
    };
  }

  private parseSpeedometer4(data: Uint8Array): Partial<TelemetryData> {
    // SpeedOMeter4 (0x5A, 0x18) - Engine parameters
    
    // Byte 2: Engine Load (%)
    const engineLoad = data[2];
    
    // Byte 11: Battery Voltage (*0.1 for Volts)
    const batteryVoltage = parseFloat((data[11] * 0.1).toFixed(2));
    
    // Bytes 16-17: Fuel Injection Volume (2 bytes)
    const fuelInjected = (data[17] << 8) | data[16];
    
    // Byte 7: Intake Air Temperature (°C, direct value)
    const intakeAirTemp = data[7];
    
    // Byte 5: MAP Sensor (kPa)
    const mapSensor = data[5];
    
    // Byte 8: Engine Temperature (°C)
    const engineTemp = data[8];

    return {
      engineLoad,
      batteryVoltage,
      fuelInjected,
      intakeAirTemp,
      mapSensor,
      engineTemp,
      timestamp: Date.now(),
    };
  }

  onData(callback: (data: TelemetryData) => void): void {
    this.onDataCallback = callback;
  }

  async sendNavigationTurn(turnType: number): Promise<void> {
    if (!this.deviceId || !this.isConnected) return;

    // Navigation Pictogram: 0x5B, 0x50, <turn_id>
    const packet = new Uint8Array(20);
    packet[0] = StartByte.MOBILE_TO_CLUSTER; // 0x5B
    packet[1] = PacketType.NAVIGATION_PICTOGRAM; // 0x50
    packet[2] = turnType; // Turn instruction ID
    
    // Pad remaining
    for (let i = 3; i < 19; i++) {
      packet[i] = 0x00;
    }
    
    packet[19] = END_BYTE; // 0xFF

    await this.writeData(packet);
  }

  async sendNavigationETA(distance: number, eta: number, arrived: boolean): Promise<void> {
    if (!this.deviceId || !this.isConnected) return;

    // Navigation Status: 0x5A, 0x49
    const packet = new Uint8Array(20);
    packet[0] = StartByte.CLUSTER_TO_MOBILE; // 0x5A (as per spec)
    packet[1] = PacketType.NAVIGATION_STATUS; // 0x49
    
    // Byte 2: Arrived Status (0=En Route, 1=Arrived)
    packet[2] = arrived ? 1 : 0;
    
    // Bytes 3-4: Distance to Dest (2 bytes, meters)
    packet[3] = distance & 0xFF;
    packet[4] = (distance >> 8) & 0xFF;
    
    // Bytes 5-6: Time to Dest (2 bytes, minutes)
    packet[5] = eta & 0xFF;
    packet[6] = (eta >> 8) & 0xFF;
    
    // Pad remaining
    for (let i = 7; i < 19; i++) {
      packet[i] = 0x00;
    }
    
    packet[19] = END_BYTE; // 0xFF

    await this.writeData(packet);
  }

  async sendCustomText(line: 1 | 2, text: string): Promise<void> {
    if (!this.deviceId || !this.isConnected) return;

    const packetId = line === 1 ? PacketType.CUSTOM_TEXT_1 : PacketType.CUSTOM_TEXT_2;
    const packet = new Uint8Array(20);
    
    packet[0] = StartByte.MOBILE_TO_CLUSTER; // 0x5B
    packet[1] = packetId; // 0x4C or 0x63
    
    // Encode text (max 15 displayable chars, 17 bytes available)
    const maxLength = Math.min(text.length, 17);
    for (let i = 0; i < maxLength; i++) {
      const char = text.charCodeAt(i);
      // Replace non-ASCII with 'X'
      packet[i + 2] = char > 127 ? 88 : char;
    }
    
    // Pad remaining
    for (let i = maxLength + 2; i < 19; i++) {
      packet[i] = 0x00;
    }
    
    packet[19] = END_BYTE; // 0xFF

    await this.writeData(packet);
  }

  async sendVehicleControl(illumination: number, tslTest: boolean): Promise<void> {
    if (!this.deviceId || !this.isConnected) return;

    // Vehicle Control: 0x5A, 0xF1
    const packet = new Uint8Array(20);
    const now = new Date();
    
    packet[0] = StartByte.CLUSTER_TO_MOBILE; // 0x5A (as per spec)
    packet[1] = PacketType.VEHICLE_CONTROL; // 0xF1
    
    // Byte 2: Illumination (1-5)
    packet[2] = Math.max(1, Math.min(5, illumination));
    
    // Byte 3: Command ID
    packet[3] = 0x09;
    
    // Bytes 4-5: Reserved
    packet[4] = 0x00;
    packet[5] = 0x00;
    
    // Byte 6: TSL Status (0=Off, 1=On)
    packet[6] = tslTest ? 1 : 0;
    
    // Bytes 7-8: Reserved
    packet[7] = 0x00;
    packet[8] = 0x00;
    
    // Bytes 9-11: Date (Day, Month, Year)
    packet[9] = now.getDate();
    packet[10] = now.getMonth() + 1;
    packet[11] = now.getFullYear() % 100;
    
    // Byte 12: Call Info Command
    packet[12] = 0x01;
    
    // Byte 13: Reserved
    packet[13] = 0x01;
    
    // Bytes 14-18: Padding
    for (let i = 14; i < 19; i++) {
      packet[i] = 0x00;
    }
    
    packet[19] = END_BYTE; // 0xFF

    await this.writeData(packet);
  }

  async findVehicle(): Promise<void> {
    // Set Find My Vehicle flag in Mobile Data packet
    if (!this.deviceId || !this.isConnected) return;

    const packet = this.createMobileDataPacket();
    packet[17] = 0x01; // Enable Find My Vehicle

    await this.writeData(packet);
  }

  async setIllumination(level: number): Promise<void> {
    await this.sendVehicleControl(level, false);
  }

  async testTurnSignals(enable: boolean): Promise<void> {
    const currentIllumination = 3; // Default
    await this.sendVehicleControl(currentIllumination, enable);
  }

  getConnectionStatus(): { isConnected: boolean; deviceId: string | null } {
    return {
      isConnected: this.isConnected,
      deviceId: this.deviceId,
    };
  }
}

export const bleService = new BleService();
