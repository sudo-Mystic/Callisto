import { BleClient, type BleDevice } from '@capacitor-community/bluetooth-le';
import { useVehicleStore } from '../store/vehicleStore';

// Service UUIDs from documentation
const SERVICE_UUID = '5456534D-5647-5341-5342-454E544F5251';
const WRITE_CHARACTERISTIC_UUID = '00005352-0000-1000-8000-00805f9b34fb';
// const READ_CHARACTERISTIC_UUID = '00005354-0000-1000-8000-00805f9b34fb';

const JUPITER_NAME_PREFIX = 'TV'; // TVS bikes usually start with TVS

class BleService {
  private static instance: BleService;
  private cyclicInterval: any = null;
  private deviceId: string | null = null;

  private constructor() {}

  public static getInstance(): BleService {
    if (!BleService.instance) {
      BleService.instance = new BleService();
    }
    return BleService.instance;
  }

  async initialize() {
    try {
      await BleClient.initialize();
    } catch (error) {
      console.error('BLE initialize error', error);
    }
  }

  async scan(): Promise<void> {
    const store = useVehicleStore.getState();
    store.setScanning(true);
    store.setConnectionStatus('Scanning...');

    try {
      await BleClient.requestLEScan(
        {
          services: [SERVICE_UUID],
        },
        (result) => {
          if (result.device && result.device.name && (result.device.name.includes('Jupiter') || result.device.name.startsWith(JUPITER_NAME_PREFIX))) {
             this.connect(result.device);
             BleClient.stopLEScan();
          }
        }
      );

      // Timeout scan after 10 seconds
      setTimeout(async () => {
          // Check live state, not captured state
          const currentStore = useVehicleStore.getState();
          if (currentStore.isScanning) {
              await BleClient.stopLEScan();
              currentStore.setScanning(false);
              if (!currentStore.isConnected) {
                  currentStore.setConnectionStatus('Scan timeout');
              }
          }
      }, 10000);

    } catch (error) {
      console.error('Scan error', error);
      store.setScanning(false);
      store.setConnectionStatus('Scan failed');
    }
  }

  async connect(device: BleDevice): Promise<void> {
    const store = useVehicleStore.getState();
    store.setScanning(false);
    store.setConnectionStatus('Connecting...');

    try {
      await BleClient.connect(device.deviceId, (deviceId) => this.onDisconnect(deviceId));
      this.deviceId = device.deviceId;

      store.setConnected(true);
      store.setDevice({ deviceId: device.deviceId, name: device.name || 'Unknown' });
      store.setConnectionStatus('Connected');

      // Handshake
      await this.sendRiderName("Callisto User");

      // Start Cyclic Data
      this.startCyclicData();

    } catch (error) {
      console.error('Connection error', error);
      store.setConnectionStatus('Connection failed');
    }
  }

  async disconnect(): Promise<void> {
    if (this.deviceId) {
      try {
          await BleClient.disconnect(this.deviceId);
      } catch (error) {
          console.error("Error disconnecting:", error);
      } finally {
          this.onDisconnect(this.deviceId);
      }
    }
  }

  private onDisconnect(deviceId: string) {
    const store = useVehicleStore.getState();
    store.setConnected(false);
    store.setDevice(null);
    store.setConnectionStatus('Disconnected');
    this.stopCyclicData();
    this.deviceId = null;
    console.log(`Disconnected from ${deviceId}`);
  }

  // --- Packets ---

  async sendRiderName(name: string) {
      if (!this.deviceId) return;

      // Packet Structure: 0x5B (Start), 0x52 (ID), Name (17 bytes), 0xFF (End)
      // Max 17 chars.
      const nameBytes = new TextEncoder().encode(name.substring(0, 17));
      const payload = new Uint8Array(20);
      payload[0] = 0x5B;
      payload[1] = 0x52;

      for(let i = 0; i < 17; i++) {
          if (i < nameBytes.length) {
              payload[i + 2] = nameBytes[i];
          } else {
              payload[i + 2] = 0x00; // Padding
          }
      }
      payload[19] = 0xFF;

      await this.write(payload);
  }

  private startCyclicData() {
      if (this.cyclicInterval) clearInterval(this.cyclicInterval);

      this.cyclicInterval = setInterval(() => {
          this.sendMobileData();
      }, 1000); // 1Hz
  }

  private stopCyclicData() {
      if (this.cyclicInterval) {
          clearInterval(this.cyclicInterval);
          this.cyclicInterval = null;
      }
  }

  async sendMobileData() {
      if (!this.deviceId) return;

      const store = useVehicleStore.getState();
      const date = new Date();

      // Mobile Data Packet: 0x5B, 0x4A
      const packet = new Uint8Array(20);
      packet[0] = 0x5B;
      packet[1] = 0x4A;

      // Byte 2: Signal & Battery (Mocked for now: Signal 9, Battery 9 -> 0x99)
      packet[2] = 0x99;

      // Byte 3: Over Speed Limit (Mocked: 120)
      packet[3] = 120;

      // Byte 4, 5: Padding
      packet[4] = 0x00;
      packet[5] = 0x00;

      // Time
      packet[6] = date.getHours();
      packet[7] = date.getMinutes();
      packet[8] = date.getSeconds();
      packet[9] = date.getHours() >= 12 ? 1 : 0; // AM/PM

      // Byte 10: Missed Calls (0)
      packet[10] = 0;

      // Byte 11: Network Type (4G - Mocked)
      packet[11] = 13;

      // Date
      packet[12] = date.getDate();
      packet[13] = date.getMonth() + 1; // JS months are 0-indexed
      packet[14] = date.getFullYear() % 100;

      // Byte 15: Padding
      packet[15] = 0x00;

      // Byte 16: Voice Assist (0)
      packet[16] = 0x00;

      // Byte 17: Find My Vehicle (0 = Off)
      packet[17] = store.isFindMe ? 0x01 : 0x00;

      // Byte 18: Padding
      packet[18] = 0x00;

      // Byte 19: End
      packet[19] = 0xFF;

      await this.write(packet);
  }

  public async write(data: Uint8Array) {
      if (!this.deviceId) return;
      try {
          // Write without response as per protocol (Write Type 2)
          await BleClient.writeWithoutResponse(
              this.deviceId,
              SERVICE_UUID,
              WRITE_CHARACTERISTIC_UUID,
              new DataView(data.buffer)
          );
      } catch (e) {
          console.error('Write failed', e);
      }
  }
}

export const bleService = BleService.getInstance();
