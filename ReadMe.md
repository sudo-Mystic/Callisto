# Callisto - Advanced Vehicle Interface

**Version:** 1.0.0  
**Platform:** Hybrid Mobile App (Vite + React + Capacitor)  
**Protocol:** Jupiter BLE Communication Protocol

---

## Overview

**Callisto** is a lightweight, high-performance alternative to the official TVS Connect app. It is designed for power users, mechanics, and enthusiasts who demand granular data access. Unlike the official app, which abstracts data into simple icons, Callisto visualizes raw telemetry, exposes hidden diagnostic sensors, and provides a superior navigation experience.

### Core Value Proposition

* **Transparency:** See exactly what the ECU sees (Engine Load, MAP, raw temps)
* **Performance:** Built on **Vite**, ensuring instant load times and 60fps animations
* **Control:** Direct access to vehicle parameters (timers, illumination, remote signals)
* **Safety:** Built-in guardrails prevent dangerous commands while vehicle is in motion

---

## Features

### ✅ Real-Time Dashboard
- **Pro Dashboard Mode:**
  - Live Tachometer with RPM visualization
  - Throttle Monitor with real-time bar graph (0-100%)
  - Engine Load display
  - Battery Precision (voltage to 0.1V accuracy)
  - Exact Fuel Injection metrics

- **Mechanic Mode:**
  - Detailed sensor grid view
  - All raw telemetry data points
  - System status flags
  - CSV data export for analysis

### 🔧 Diagnostic Center
- **DTC Scanner:** Decodes diagnostic trouble codes in plain English
- **Sensor Health Monitor:**
  - Intake Air Temperature
  - Manifold Air Pressure (MAP)
  - Engine Temperature
  - Battery Voltage monitoring
- **System Status Flags:**
  - Side Stand Sensor Status
  - ISG (Idle Start-Go) System Faults
  - Fuel Sensor status

### 🗺️ Advanced Navigation
- Turn-by-turn navigation displayed on cluster
- Protocol bridge for Mapbox → Jupiter Cluster IDs
- Smart ETA updates every 30 seconds
- Custom text display on cluster (2 lines, 15 chars each)

### 🎮 Command Center (Remote Control)
- **Find My Vehicle:** Activate horn/indicators remotely
- **Illumination Control:** Adjust cluster backlight (5 levels)
- **TSL Test:** Remote turn signal lamp testing
- **Custom Text:** Send messages to cluster display
- **Safety:** All controls auto-disabled when speed > 0 km/h

### 📊 Derived Features
- **Eco-Score Analyst:** A-D grade based on riding style
- **Performance Tracker:** Automatic 0-60 km/h timer
- **Real-World Range:** Calculated from actual fuel injection data
- **Maintenance Predictor:** Suggests service based on engine usage

---

## Technical Stack

- **Build Tool:** Vite (Fast HMR and optimized bundling)
- **Framework:** React 19 with TypeScript
- **Runtime:** Capacitor 8 (Native mobile capabilities)
- **Bluetooth:** `@capacitor-community/bluetooth-le` (GATT protocol)
- **State Management:** Zustand (Handles 100ms telemetry stream)
- **Maps:** Mapbox GL JS integration ready

---

## Project Structure

```
Callisto/
├── src/
│   ├── components/          # React UI components
│   │   ├── ConnectionScreen.tsx
│   │   ├── Dashboard.tsx
│   │   ├── DiagnosticCenter.tsx
│   │   ├── Navigation.tsx
│   │   ├── CommandCenter.tsx
│   │   └── Settings.tsx
│   ├── services/            # BLE communication
│   │   └── BleService.ts
│   ├── stores/              # State management
│   │   └── appStore.ts
│   ├── types/               # TypeScript definitions
│   │   └── index.ts
│   ├── styles/              # CSS modules
│   ├── App.tsx              # Main app component
│   └── main.tsx             # Entry point
├── capacitor.config.ts      # Capacitor configuration
├── vite.config.ts           # Vite build configuration
└── package.json             # Dependencies

```

---

## Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- For mobile deployment:
  - Android Studio (for Android)
  - Xcode (for iOS)

### Development Setup

```bash
# Clone the repository
git clone https://github.com/sudo-Mystic/Callisto.git
cd Callisto

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Mobile Deployment

```bash
# Sync web assets to native projects
npm run cap:sync

# Open in Android Studio
npm run cap:android

# Open in Xcode
npm run cap:ios
```

---

## Protocol Implementation

### Connection Flow
1. **Scan:** App scans for Service UUID `5456...5251`
2. **Connect:** Establishes GATT connection
3. **Auth:** Sends Rider Name Packet (`0x5B, 0x52`) as handshake
4. **Sync:** Starts sending Cyclic Mobile Data (`0x5B, 0x4A`) every 1000ms

### Packet Structure
All packets follow a fixed 20-byte structure:
```
Byte 0:     Start Byte (0x5A or 0x5B)
Byte 1:     Packet ID
Bytes 2-18: Payload (17 bytes)
Byte 19:    End Byte (0xFF)
```

### Supported Vehicles
- Jupiter U279
- Jupiter U745
- NTorq U812 (partial support)
- Zest U714 (partial support)

---

## Key Features in Detail

### Mobile Data Packet
Sent every second to keep connection alive and sync data:
- Current time (hour, minute, second, AM/PM)
- Current date (day, month, year)
- Battery level (0-9 scale)
- Network signal strength (0-9 scale)
- Missed call count
- Network type
- Over-speed limit setting
- Find My Vehicle flag

### Incoming Telemetry Frames
- **SpeedOMeter1 (0x10):** Speed, RPM, throttle, odometer, fuel level
- **SpeedOMeter2 (0x11):** Diagnostics, DTC codes, system flags
- **SpeedOMeter3 (0x19):** Fuel economy, ISS data
- **SpeedOMeter4 (0x18):** Engine load, temps, MAP sensor, battery voltage

### Data Conversion Examples
- **Battery Voltage:** `raw_value * 0.1 = Volts` (e.g., 124 → 12.4V)
- **Odometer:** `raw_value / 10 = km`
- **Throttle Position:** `raw_value / 2 = %`
- **Engine RPM:** Direct 2-byte value (little-endian)

---

## Usage Guide

### First-Time Connection
1. Turn on vehicle ignition
2. Enable Bluetooth on mobile device
3. Open Callisto app
4. Tap "Scan for Vehicle"
5. Select your vehicle from list
6. Connection established!

### Dashboard Modes
- **Normal Mode:** Driver-friendly view with speedometer, tachometer, key metrics
- **Mechanic Mode:** Toggle in Settings for detailed sensor grid

### Navigation
1. Enter destination in Navigation screen
2. Tap "Start Navigation"
3. Turn instructions appear on cluster display
4. Distance and ETA update automatically
5. Tap "End Navigation" when complete

### Remote Commands
All remote control features are in Command Center:
- **Find Vehicle:** One-tap to activate horn/lights
- **Illumination:** Slider to adjust brightness (1-5)
- **TSL Test:** Toggle to test turn signals
- **Custom Text:** Send messages to cluster (max 15 chars/line)

### Safety Features
- Speed-based guardrails (auto-disable controls when moving)
- Disclaimer warnings for dangerous operations
- Configurable in Settings

---

## Configuration

### Settings
- **Mechanic Mode:** Show detailed sensor data
- **Auto Connect:** Automatically connect to last vehicle
- **Log Sensor Data:** Enable CSV export
- **Safety Guardrails:** Disable controls when speed > 0
- **Rider Name:** Custom name on cluster (max 15 chars)

---

## Data Logging & Export

### CSV Export
1. Enable "Log Sensor Data" in Settings
2. Drive with app connected
3. Go to Diagnostic Center
4. Tap "Export to CSV"
5. Data saved with timestamp

### CSV Columns
- Timestamp, Speed, RPM, Throttle, Engine Load
- Battery Voltage, Engine Temp, Intake Temp, MAP Sensor
- Fuel Economy, Odometer, Trip Distance
- GPS coordinates (if available)

---

## Safety & Disclaimer

⚠️ **WARNING:** This app allows direct control of vehicle functions.

### Safety Guidelines
- **DO NOT** send control commands while vehicle is in motion
- **DO NOT** modify calibration settings without proper knowledge
- **ALWAYS** enable "Safety Guardrails" in Settings
- **UNDERSTAND** that this is an unofficial app

### Liability
This app is provided "as is" without warranty. Use at your own risk. The developers are not responsible for any damage to your vehicle or injuries resulting from app usage.

**Important:** This is an unofficial app and is NOT endorsed by TVS Motor Company.

---

## Troubleshooting

### Connection Issues
- **Can't find vehicle:** Ensure ignition is ON and Bluetooth is enabled
- **Connection drops:** Check vehicle battery is healthy (>12V)
- **No data received:** Try disconnecting and reconnecting

### Data Issues
- **Incorrect readings:** Some values may need calibration
- **Missing data:** Not all vehicle models support all sensors
- **Delayed updates:** Normal due to BLE bandwidth limits

### App Issues
- **App crashes:** Clear app data and reinstall
- **Slow performance:** Disable "Log Sensor Data" if not needed
- **Build errors:** Run `npm install` and rebuild

---

## Development

### Building from Source
```bash
# Install dependencies
npm install

# Run TypeScript compiler
npm run build

# Run development server with hot reload
npm run dev
```

### Code Structure
- **BleService.ts:** Handles all Bluetooth communication
- **appStore.ts:** Zustand state management
- **types/index.ts:** TypeScript definitions for protocol
- **Components:** React UI components for each screen

### Protocol Reference
See the complete protocol documentation in the codebase:
- Packet types and IDs
- Byte mappings for all frames
- Conversion formulas
- Display capabilities

---

## Roadmap

### Version 1.1 (Planned)
- [ ] Real Mapbox integration
- [ ] GPS route recording
- [ ] Cloud sync for ride data
- [ ] Multi-vehicle support
- [ ] Dark/Light theme toggle

### Version 2.0 (Future)
- [ ] Advanced analytics dashboard
- [ ] Social features (ride sharing)
- [ ] OTA firmware updates
- [ ] Predictive maintenance AI

---

## Contributing

Contributions are welcome! Please follow these guidelines:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

## License

This project is licensed under the ISC License.

---

## Acknowledgments

- Protocol reverse-engineered from TVS Connect app
- Built with modern web technologies (Vite, React, Capacitor)
- Community feedback and testing

---

## Contact & Support

- **GitHub Issues:** Report bugs or request features
- **Discussions:** Ask questions or share experiences
- **Email:** (Add your contact email if desired)

---

**Built with ❤️ for the TVS Jupiter community**

**Disclaimer:** This is an independent project and is not affiliated with or endorsed by TVS Motor Company.