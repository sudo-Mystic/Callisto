import { type TelemetryData } from './SpeedometerParser';

export const calculateEcoScore = (telemetry: TelemetryData): { score: string, color: string } => {
    // Logic: Correlate Throttle > 50% with Instant Fuel Economy < 30km/l (Mock threshold)
    // Simple heuristic for now

    // In a real app, this would use a history buffer.
    // For now, instantaneous snapshot.

    let points = 100;

    if (telemetry.throttlePosition > 50) points -= 20;
    if (telemetry.rpm > 6000) points -= 30;
    if (telemetry.speed > 80) points -= 10;

    if (points >= 90) return { score: 'A+', color: 'text-green-400' };
    if (points >= 80) return { score: 'A', color: 'text-green-500' };
    if (points >= 70) return { score: 'B', color: 'text-yellow-400' };
    if (points >= 60) return { score: 'C', color: 'text-orange-500' };
    return { score: 'D', color: 'text-red-500' };
};

export const predictRange = (telemetry: TelemetryData): number => {
    // Logic: Ignore DTE. Calculate based on Fuel Level * Avg Consumption
    // Let's assume tank capacity is 6L for Jupiter.
    const tankCapacity = 6.0;
    const currentFuelLiters = (telemetry.fuelLevel / 100) * tankCapacity;

    // Use Avg Fuel Economy if available, else assume 45 km/l
    // telemetry.averageFuelEconomy is not in our parsed struct yet (Frame 3 byte 9),
    // let's assume we might have instantFuelEconomy or just use a constant.
    const economy = telemetry.instantFuelEconomy > 0 ? telemetry.instantFuelEconomy : 45;

    return Math.floor(currentFuelLiters * economy);
};

export const getMaintenanceStatus = (odometer: number): { status: string, color: string, nextService: number } => {
    const serviceInterval = 3000; // 3000 km
    const nextService = Math.ceil(odometer / serviceInterval) * serviceInterval;
    const dueIn = nextService - odometer;

    if (dueIn < 100) return { status: 'SERVICE DUE', color: 'text-red-500', nextService };
    if (dueIn < 500) return { status: 'SERVICE SOON', color: 'text-yellow-500', nextService };
    return { status: 'GOOD', color: 'text-green-500', nextService };
};
