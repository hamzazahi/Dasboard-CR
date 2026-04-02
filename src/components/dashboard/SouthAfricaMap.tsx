"use client";

import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default markers in Leaflet with Next.js
const fixLeafletIcon = () => {
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    });
};

interface ProvinceData {
    name: string;
    amount: number;
    value: number;
    variant: string;
    topScreeningType?: string;
    topScreeningCount?: number;
}

interface SouthAfricaMapProps {
    provinces: ProvinceData[];
}

const PROVINCE_COORDS: Record<string, [number, number]> = {
    'Gauteng': [-26.2041, 28.0473],
    'Western Cape': [-33.9258, 18.4232],
    'KwaZulu-Natal': [-29.8587, 31.0218],
    'Eastern Cape': [-32.2968, 26.4194],
    'Limpopo': [-23.4013, 29.4179],
    'Mpumalanga': [-25.5653, 30.5279],
    'North West': [-26.6638, 25.2837],
    'Northern Cape': [-28.7282, 24.7499],
    'Free State': [-29.0852, 26.1596],
};

const PROVINCE_ABBR: Record<string, string> = {
    'Gauteng': 'GP',
    'Western Cape': 'WC',
    'KwaZulu-Natal': 'KZN',
    'Eastern Cape': 'EC',
    'Limpopo': 'LP',
    'Mpumalanga': 'MP',
    'North West': 'NW',
    'Northern Cape': 'NC',
    'Free State': 'FS',
};

function MapResizer() {
    const map = useMap();
    useEffect(() => {
        setTimeout(() => {
            map.invalidateSize();
        }, 100);
    }, [map]);
    return null;
}

export default function SouthAfricaMap({ provinces }: SouthAfricaMapProps) {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        fixLeafletIcon();
    }, []);

    if (!isClient) return <div className="h-[400px] w-full bg-slate-100 animate-pulse rounded-xl" />;

    const maxAmount = Math.max(...provinces.map(p => p.amount), 1);

    return (
        <div className="h-[400px] w-full rounded-xl overflow-hidden border border-slate-200 shadow-inner bg-slate-50 relative z-0">
            <MapContainer
                center={[-29.6, 24.9]}
                zoom={5}
                scrollWheelZoom={false}
                style={{ height: "100%", width: "100%", background: "#f8fafc" }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapResizer />
                {provinces.map((province) => {
                    const coords = PROVINCE_COORDS[province.name];
                    if (!coords) return null;

                    const radius = 10 + (province.amount / maxAmount) * 20;
                    const abbr = PROVINCE_ABBR[province.name] || province.name.substring(0, 2);

                    // Determine color based on density
                    let color = "#10b981"; // Green
                    if (province.value > 40) color = "#ef4444"; // Red
                    else if (province.value > 20) color = "#f59e0b"; // Orange
                    else if (province.value > 10) color = "#3b82f6"; // Blue

                    const customIcon = L.divIcon({
                        html: `
                            <div style="
                                width: ${radius * 2}px; 
                                height: ${radius * 2}px; 
                                background-color: ${color}; 
                                border: 2px solid white; 
                                border-radius: 50%; 
                                display: flex; 
                                align-items: center; 
                                justify-content: center; 
                                color: white; 
                                font-weight: bold; 
                                font-size: 10px;
                                box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
                                opacity: 0.9;
                            ">
                                ${abbr}
                            </div>
                        `,
                        className: "",
                        iconSize: [radius * 2, radius * 2],
                    });

                    return (
                        <Marker key={province.name} position={coords} icon={customIcon}>
                            <Tooltip direction="top" offset={[0, -radius]} opacity={1}>
                                <div className="font-bold text-slate-900">{province.name}</div>
                                <div className="text-xs text-slate-600">{province.amount} Screenings (${province.value}%)</div>
                            </Tooltip>
                            <Popup>
                                <div className="p-1">
                                    <h4 className="font-bold text-lg mb-1">{province.name}</h4>
                                    <div className="grid grid-cols-2 gap-4 mt-2">
                                        <div>
                                            <p className="text-[10px] uppercase text-slate-400 font-bold">Total</p>
                                            <p className="text-xl font-bold">{province.amount}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase text-slate-400 font-bold">Share</p>
                                            <p className="text-xl font-bold text-primary">{province.value}%</p>
                                        </div>
                                    </div>
                                    {province.topScreeningType && (
                                        <div className="mt-2 pt-2 border-t border-slate-100">
                                            <p className="text-[10px] uppercase text-slate-400 font-bold">Top Condition</p>
                                            <p className="text-sm font-medium">{province.topScreeningType}</p>
                                        </div>
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
}
