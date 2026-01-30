import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.callisto.app',
  appName: 'Callisto',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    BluetoothLe: {
      displayStrings: {
        scanning: "Scanning for vehicle...",
        cancel: "Cancel",
        availableDevices: "Available vehicles",
        noDeviceFound: "No vehicle found",
      }
    }
  }
};

export default config;
