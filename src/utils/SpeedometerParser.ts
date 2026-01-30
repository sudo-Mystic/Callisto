// Packet headers
const START_BYTE_5A = 0x5A;
// const START_BYTE_5B = 0x5B; // Unused for now

// Packet IDs
const PACKET_ID_SPEEDOMETER_1 = 0x10; // Speed, RPM, Throttle, Fuel, Odo
const PACKET_ID_SPEEDOMETER_2 = 0x11; // DTC, Flags, ISS
const PACKET_ID_SPEEDOMETER_3 = 0x19; // Fuel Economy, DTE
const PACKET_ID_SPEEDOMETER_4 = 0x18; // Load, Battery, Fuel Inj, Temps

export interface TelemetryData {
    // SpeedOMeter1
    speed: number;
    rpm: number;
    odometer: number;
    fuelLevel: number;
    throttlePosition: number;
    averageSpeed: number;
    topSpeed: number;
    gear: number; // Inferred or from raw bytes if available? (Usually not direct, but let's see)

    // SpeedOMeter4
    engineLoad: number;
    batteryVoltage: number;
    fuelInjectionVolume: number;
    coolantTemp: number;
    intakeAirTemp: number;
    mapSensor: number; // kPa

    // SpeedOMeter2 (Diagnostics)
    malfunctionIndicator: boolean;
    sideStandStatus: boolean;
    isgStatus: boolean;

    // SpeedOMeter3
    distanceToEmpty: number;
    instantFuelEconomy: number;
}

export const initialTelemetry: TelemetryData = {
    speed: 0,
    rpm: 0,
    odometer: 0,
    fuelLevel: 0,
    throttlePosition: 0,
    averageSpeed: 0,
    topSpeed: 0,
    gear: 0,
    engineLoad: 0,
    batteryVoltage: 0,
    fuelInjectionVolume: 0,
    coolantTemp: 0,
    intakeAirTemp: 0,
    mapSensor: 0,
    malfunctionIndicator: false,
    sideStandStatus: false,
    isgStatus: false,
    distanceToEmpty: 0,
    instantFuelEconomy: 0,
};

export class SpeedometerParser {

    static parse(data: DataView, currentData: TelemetryData): TelemetryData {
        const startByte = data.getUint8(0);
        if (startByte !== START_BYTE_5A) return currentData;

        const packetId = data.getUint8(1);
        const newData = { ...currentData };

        switch (packetId) {
            case PACKET_ID_SPEEDOMETER_1:
                return SpeedometerParser.parseFrame1(data, newData);
            case PACKET_ID_SPEEDOMETER_2:
                return SpeedometerParser.parseFrame2(data, newData);
            case PACKET_ID_SPEEDOMETER_3:
                return SpeedometerParser.parseFrame3(data, newData);
            case PACKET_ID_SPEEDOMETER_4:
                return SpeedometerParser.parseFrame4(data, newData);
            default:
                return currentData;
        }
    }

    private static parseFrame1(data: DataView, telemetry: TelemetryData): TelemetryData {
        // Byte 2: Speed (km/h)
        telemetry.speed = data.getUint8(2);

        // Byte 3-5: Odometer (3 bytes) -> Value / 10 = km
        // Big Endian? Usually. Let's assume standard network byte order.
        // Documentation says "Odometer (3 bytes)".
        const odoRaw = (data.getUint8(3) << 16) | (data.getUint8(4) << 8) | data.getUint8(5);
        telemetry.odometer = odoRaw / 10.0;

        // Byte 6: Fuel Level (0-100%)
        telemetry.fuelLevel = data.getUint8(6);

        // Byte 7: Avg Speed
        telemetry.averageSpeed = data.getUint8(7);

        // Byte 9: Top Speed
        telemetry.topSpeed = data.getUint8(9);

        // Byte 10: Throttle Position (Value / 2 = %)
        telemetry.throttlePosition = data.getUint8(10) / 2.0;

        // Byte 17-18: Engine RPM
        telemetry.rpm = data.getUint16(17, false); // Big Endian

        return telemetry;
    }

    private static parseFrame2(data: DataView, telemetry: TelemetryData): TelemetryData {
        // Byte 8: MIL Blink Code (If > 0, MIL is likely on)
        telemetry.malfunctionIndicator = data.getUint8(8) > 0;

        // Note: Side stand is often in "Vehicle State" flags.
        // Documentation says: Byte 6: ISS High/Low / Vehicle State 2
        // We'll need to dig deeper into flags if we want side stand.
        // For now let's assume bit 0 of Byte 6 is ISS status as per doc.
        telemetry.isgStatus = (data.getUint8(6) & 0x01) === 1;

        return telemetry;
    }

    private static parseFrame3(data: DataView, telemetry: TelemetryData): TelemetryData {
        // Byte 10: Instant Fuel Economy (km/l ?) - Doc says "Instantaneous Fuel Economy"
        telemetry.instantFuelEconomy = data.getUint8(10); // Maybe check scaling?

        // Byte 12-13: Distance To Empty
        telemetry.distanceToEmpty = data.getUint16(12, false);

        return telemetry;
    }

    private static parseFrame4(data: DataView, telemetry: TelemetryData): TelemetryData {
        // Byte 2: Engine Load (%)
        telemetry.engineLoad = data.getUint8(2);

        // Byte 5: MAP (kPa)
        telemetry.mapSensor = data.getUint8(5);

        // Byte 7: Intake Air Temp (C)
        telemetry.intakeAirTemp = data.getUint8(7);

        // Byte 8: Engine Temp (C)
        telemetry.coolantTemp = data.getUint8(8);

        // Byte 11: Battery Voltage (Value * 0.1 = Volts)
        telemetry.batteryVoltage = data.getUint8(11) * 0.1;

        // Byte 16-17: Fuel Injection Volume (mL?)
        telemetry.fuelInjectionVolume = data.getUint16(16, false);

        return telemetry;
    }
}
