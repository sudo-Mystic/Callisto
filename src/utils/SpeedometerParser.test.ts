import { describe, it, expect } from 'vitest';
import { SpeedometerParser, initialTelemetry } from './SpeedometerParser';

describe('SpeedometerParser', () => {

    it('should parse SpeedOMeter1 correctly', () => {
        // Frame 1: 0x5A, 0x10, Speed, Odo(3), Fuel, AvgSpeed, TripStatus, TopSpeed, Throttle, ...
        // Index:      0     1      2     3,4,5     6      7          8          9          10
        // Value:    0x5A  0x10    60    0,1,0    50     40         0          80         100 (50%)

        const buffer = new ArrayBuffer(20);
        const view = new DataView(buffer);

        view.setUint8(0, 0x5A);
        view.setUint8(1, 0x10);
        view.setUint8(2, 60); // Speed 60 km/h

        // Odometer: 100.0 km -> 1000 raw
        view.setUint8(3, 0x00);
        view.setUint8(4, 0x03);
        view.setUint8(5, 0xE8); // 0x03E8 = 1000

        view.setUint8(6, 50); // Fuel 50%
        view.setUint8(7, 40); // Avg Speed 40
        view.setUint8(9, 80); // Top Speed 80
        view.setUint8(10, 100); // Throttle 100 -> 50%

        // RPM at 17,18: 5000 RPM -> 0x1388
        view.setUint16(17, 5000, false);

        const result = SpeedometerParser.parse(view, initialTelemetry);

        expect(result.speed).toBe(60);
        expect(result.odometer).toBe(100.0);
        expect(result.fuelLevel).toBe(50);
        expect(result.averageSpeed).toBe(40);
        expect(result.topSpeed).toBe(80);
        expect(result.throttlePosition).toBe(50);
        expect(result.rpm).toBe(5000);
    });

    it('should parse SpeedOMeter4 correctly', () => {
        // Frame 4: 0x5A, 0x18, Load, ..., MAP, ..., IAT, EngineTemp, ..., Voltage, ...
        // Index:      0     1     2         5        7        8              11

        const buffer = new ArrayBuffer(20);
        const view = new DataView(buffer);

        view.setUint8(0, 0x5A);
        view.setUint8(1, 0x18);
        view.setUint8(2, 75); // Load 75%
        view.setUint8(5, 101); // MAP 101 kPa
        view.setUint8(7, 30); // IAT 30C
        view.setUint8(8, 90); // Engine Temp 90C
        view.setUint8(11, 124); // Voltage 124 -> 12.4V

        const result = SpeedometerParser.parse(view, initialTelemetry);

        expect(result.engineLoad).toBe(75);
        expect(result.mapSensor).toBe(101);
        expect(result.intakeAirTemp).toBe(30);
        expect(result.coolantTemp).toBe(90);
        expect(result.batteryVoltage).toBeCloseTo(12.4);
    });
});
