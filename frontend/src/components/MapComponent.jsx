import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

// Import CSS
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet icon not appearing in React
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom Icons
const junctionIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const vehicleIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Component to handle map view updates
const RecenterMap = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center, map.getZoom());
        }
    }, [center, map]);
    return null;
};

const MapComponent = ({ junction, vehiclePosition, distance, signalStatus }) => {
    // Delhi Coordinates
    const defaultCenter = [28.6140, 77.2185];
    const junctionPos = junction ? [junction.lat, junction.lng] : defaultCenter;
    const vehiclePos = vehiclePosition ? [vehiclePosition.lat, vehiclePosition.lng] : junctionPos;

    const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'));

    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsDarkMode(document.documentElement.classList.contains('dark'));
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    return (
        <div className="relative w-full h-[450px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-lg bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
            <MapContainer
                center={junctionPos}
                zoom={16}
                style={{
                    height: '100%',
                    width: '100%',
                    zIndex: 1,
                    filter: isDarkMode ? 'invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%)' : 'none'
                }}
                zoomControl={false}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                <RecenterMap center={junctionPos} />

                <Marker position={junctionPos} icon={junctionIcon}>
                    <Popup>
                        <div className="font-bold">Intersection: {junction?.name || "Target"}</div>
                    </Popup>
                </Marker>

                <Marker position={vehiclePos} icon={vehicleIcon}>
                    <Popup>
                        <div className="font-bold">Active Vehicle</div>
                        <div>{distance}m to signal</div>
                    </Popup>
                </Marker>

                <Polyline
                    positions={[vehiclePos, junctionPos]}
                    color="#000080"
                    weight={3}
                    dashArray="5, 10"
                />
            </MapContainer>

            {/* Simple Overlay for Status */}
            <div className="absolute top-4 left-4 z-[1000]">
                <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur shadow-xl border-t-2 border-t-saffron dark:border-slate-800 p-3 rounded-lg">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Live GIS Telemetry</p>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                        <span className="text-xs font-black text-slate-800 dark:text-blue-100 uppercase tracking-tighter">{junction?.name || "Initializing..."}</span>
                    </div>
                </div>
            </div>

            <div className="absolute bottom-4 right-4 z-[1000]">
                <div className={`px-3 py-1.5 rounded-lg shadow-lg backdrop-blur-md border border-white/20 flex items-center gap-2 ${signalStatus === 'GREEN' ? 'bg-green-600/90 text-white' : signalStatus === 'RED' ? 'bg-red-600/90 text-white' : 'bg-amber-500/90 text-white'}`}>
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{signalStatus || "IDLE"}</span>
                </div>
            </div>
        </div>
    );
};

export default MapComponent;
