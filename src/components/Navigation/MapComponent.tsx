import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { navigationBridge } from '../../services/NavigationBridge';

// Note: In a real app, this should be in an env variable
// Using a placeholder public token for development/demo purposes
mapboxgl.accessToken = 'pk.eyJ1Ijoiam9obmRvZSIsImEiOiJjbHpq...'; // Replace with valid token

export const MapComponent: React.FC = () => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const [zoom] = useState(14);

    useEffect(() => {
        if (map.current || !mapContainer.current) return;

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/dark-v11',
            center: [-74.5, 40], // Default center
            zoom: zoom
        });

        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

        // Mock navigation updates for demonstration since we don't have full Nav SDK here
        // In a real implementation, we would listen to 'route' events

        // Simulating a turn every 10 seconds
        let toggle = false;
        const interval = setInterval(() => {
            if (toggle) {
                navigationBridge.updateManeuver('right', 'turn');
                navigationBridge.updateProgress(500, 120, false);
            } else {
                navigationBridge.updateManeuver('left', 'turn');
                navigationBridge.updateProgress(200, 60, false);
            }
            toggle = !toggle;
        }, 10000);

        return () => clearInterval(interval);

    }, [zoom]);

    return (
        <div className="relative w-full h-full rounded-xl overflow-hidden shadow-2xl border border-slate-800">
            <div ref={mapContainer} className="absolute inset-0" />
            <div className="absolute top-4 left-4 bg-black/80 p-3 rounded-lg backdrop-blur-md">
                <h3 className="text-white font-bold text-sm">Navigation Active</h3>
                <p className="text-slate-400 text-xs">Simulating route data...</p>
            </div>
        </div>
    );
};
