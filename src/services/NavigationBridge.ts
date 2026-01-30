import { bleService } from './BleService';

// Pictogram Mapping (Mapbox -> Cluster ID)
export const NAV_ICONS: Record<string, number> = {
    'straight': 1,
    'turn-right': 2,
    'slight-right': 10,
    'sharp-right': 11,
    'turn-left': 12,
    'slight-left': 9,
    'sharp-left': 12, // Fallback
    'roundabout-left': 57,
    'roundabout-right': 57,
    'u-turn': 22,
    'arrive': 0,
};

export class NavigationBridge {
    private static instance: NavigationBridge;

    private constructor() {}

    public static getInstance(): NavigationBridge {
        if (!NavigationBridge.instance) {
            NavigationBridge.instance = new NavigationBridge();
        }
        return NavigationBridge.instance;
    }

    async updateManeuver(modifier: string, type: string) {
        let key = type;
        if (modifier) key = `${type}-${modifier}`;
        if (type === 'turn' && modifier) key = `turn-${modifier}`; // Ensure correct key formation
        if (type === 'depart') key = 'straight';
        if (type === 'arrive') key = 'arrive';

        const clusterId = NAV_ICONS[key] || 1;
        console.log(`Nav Update: ${key} -> ID ${clusterId}`);
        await this.sendPictogram(clusterId);
    }

    async updateProgress(distanceRemaining: number, durationRemaining: number, hasArrived: boolean) {
        await this.sendNavigationStatus(distanceRemaining, durationRemaining, hasArrived);
    }

    private async sendPictogram(id: number) {
        const packet = new Uint8Array(20);
        packet[0] = 0x5B;
        packet[1] = 0x50;

        const idStr = id.toString();
        const bytes = new TextEncoder().encode(idStr);
        packet.set(bytes, 2);

        packet[19] = 0xFF;

        await bleService.write(packet);
    }

    private async sendNavigationStatus(distance: number, duration: number, arrived: boolean) {
        const packet = new Uint8Array(20);
        packet[0] = 0x5A;
        packet[1] = 0x49;

        packet[2] = arrived ? 0x01 : 0x00;

        // Distance (uint16)
        packet[3] = (distance >> 8) & 0xFF;
        packet[4] = distance & 0xFF;

        // Time (uint16) - duration in minutes
        const minutes = Math.ceil(duration / 60);
        packet[5] = (minutes >> 8) & 0xFF;
        packet[6] = minutes & 0xFF;

        packet[19] = 0xFF;

        await bleService.write(packet);
    }
}

export const navigationBridge = NavigationBridge.getInstance();
