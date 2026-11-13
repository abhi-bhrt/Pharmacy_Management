"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/Input";
import { MapPin, ExternalLink, Globe, Search, Navigation } from "lucide-react";
import "leaflet/dist/leaflet.css";

interface MapLocationPickerProps {
    value: string;
    initialLocationUrl?: string;
    onChange: (url: string) => void;
}

export function MapLocationPicker({
    value,
    initialLocationUrl = "",
    onChange,
}: MapLocationPickerProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const markerRef = useRef<any>(null);

    const [searchQuery, setSearchQuery] = useState("");
    const [locating, setLocating] = useState(false);
    const [error, setError] = useState("");

    // Helper: Generate Google Maps URL from coordinates & auto-fill parent state
    const updatePinnedLocation = (lat: number, lng: number, placeName?: string) => {
        const query = placeName
            ? `${placeName} (${lat.toFixed(6)},${lng.toFixed(6)})`
            : `${lat.toFixed(6)},${lng.toFixed(6)}`;
        const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
        onChange(mapUrl);
    };

    // Initialize Interactive Map
    useEffect(() => {
        let isMounted = true;

        const initMap = async () => {
            const L = (await import("leaflet")).default;
            if (!isMounted || !mapContainerRef.current || mapInstanceRef.current) return;

            // Fix default Leaflet marker icon issue in Next.js
            const customIcon = L.icon({
                iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
                iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
                shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
                iconSize: [25, 41],
                iconAnchor: [12, 41],
            });

            // Default center (Kolkata) or parse initialLocationUrl if present
            let defaultLat = 22.5726;
            let defaultLng = 88.3639;

            const coordMatch = (value || initialLocationUrl).match(/(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
            if (coordMatch) {
                defaultLat = parseFloat(coordMatch[1]);
                defaultLng = parseFloat(coordMatch[2]);
            }

            const map = L.map(mapContainerRef.current).setView([defaultLat, defaultLng], 15);

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: "&copy; OpenStreetMap contributors",
            }).addTo(map);

            const marker = L.marker([defaultLat, defaultLng], {
                draggable: true,
                icon: customIcon,
            }).addTo(map);

            // Auto-fill when marker is dragged
            marker.on("dragend", () => {
                const pos = marker.getLatLng();
                updatePinnedLocation(pos.lat, pos.lng);
            });

            // Auto-fill immediately when user clicks anywhere on the map
            map.on("click", async (e: any) => {
                const { lat, lng } = e.latlng;
                marker.setLatLng([lat, lng]);
                updatePinnedLocation(lat, lng);

                // Optional: Reverse geocode to get shop/street name automatically
                try {
                    const res = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
                    );
                    const data = await res.json();
                    if (data?.name || data?.display_name) {
                        const label = data.name || data.display_name.split(",")[0];
                        updatePinnedLocation(lat, lng, label);
                    }
                } catch {
                    // Coordinates already saved above as fallback
                }
            });

            mapInstanceRef.current = map;
            markerRef.current = marker;
        };

        initMap();

        return () => {
            isMounted = false;
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    // Search location via OpenStreetMap Nominatim
    const handleSearchCity = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        setError("");

        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
            );
            const results = await res.json();
            if (results && results.length > 0) {
                const lat = parseFloat(results[0].lat);
                const lon = parseFloat(results[0].lon);
                mapInstanceRef.current?.setView([lat, lon], 17);
                markerRef.current?.setLatLng([lat, lon]);
                updatePinnedLocation(lat, lon, searchQuery.trim());
            } else {
                setError("Location not found. Try a nearby landmark or area.");
            }
        } catch {
            setError("Failed to search location.");
        }
    };

    // GPS Detect
    const handleDetectLocation = () => {
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser");
            return;
        }

        setLocating(true);
        setError("");

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                mapInstanceRef.current?.setView([latitude, longitude], 18);
                markerRef.current?.setLatLng([latitude, longitude]);
                updatePinnedLocation(latitude, longitude);
                setLocating(false);
            },
            () => {
                setError("Unable to retrieve your location. Check browser permissions.");
                setLocating(false);
            },
            { timeout: 10000, enableHighAccuracy: true }
        );
    };

    return (
        <div className="space-y-4">
            {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-xs">
                    {error}
                </div>
            )}

            <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 space-y-4">
                <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleSearchCity(e);
                                }
                            }}
                            className="w-full pl-9 pr-3 py-2 border rounded-md text-sm border-zinc-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#2a9d8f]"
                            placeholder="Search area, street or landmark..."
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={handleSearchCity}
                            className="px-4 py-2 bg-zinc-300 hover:bg-zinc-800 text-white rounded-md text-xs font-semibold transition-colors cursor-pointer shrink-0"
                        >
                            Find
                        </button>
                        <button
                            type="button"
                            onClick={handleDetectLocation}
                            disabled={locating}
                            className="px-3.5 py-2 bg-teal-50 hover:bg-teal-100 text-[#2a9d8f] border border-teal-200 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
                        >
                            <Navigation className={`w-3.5 h-3.5 ${locating ? "animate-spin" : ""}`} />
                            <span className="hidden sm:inline">{locating ? "Locating..." : "Detect Location"}</span>
                        </button>
                    </div>
                </div>

                {/* Interactive Map Container */}
                <div
                    ref={mapContainerRef}
                    className="w-full h-72 rounded-lg overflow-hidden border border-zinc-300 z-0"
                />

                <div className="flex items-center justify-between text-[11px] text-zinc-500">
                    <span>* Click anywhere on the map or drag the pin—the URL below updates automatically.</span>
                    {value && (
                        <a
                            href={value}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#2a9d8f] hover:underline flex items-center gap-1 font-medium shrink-0"
                        >
                            <Globe className="w-3.5 h-3.5" />
                            Test Google Map Link <ExternalLink className="w-3 h-3" />
                        </a>
                    )}
                </div>

                <Input
                    label="Google Map URL (Auto-filled)"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Click on the map above to auto-generate URL..."
                />
            </div>
        </div>
    );
}