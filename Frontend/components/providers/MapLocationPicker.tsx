// components/features/shop/MapLocationPicker.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/Input";
import { ExternalLink, Globe, Search, Navigation, Loader2 } from "lucide-react";
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
  const mapInstanceRef = useRef<import("leaflet").Map | null>(null);
  const markerRef = useRef<import("leaflet").Marker | null>(null);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");

  const updatePinnedLocation = useCallback(
    (lat: number, lng: number, placeName?: string) => {
      const query = placeName
        ? `${placeName} (${lat.toFixed(6)},${lng.toFixed(6)})`
        : `${lat.toFixed(6)},${lng.toFixed(6)}`;
      const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        query
      )}`;
      onChangeRef.current(mapUrl);
    },
    []
  );

  // Sync external URL changes (e.g., manual paste or async shop load) to map view & pin
  useEffect(() => {
    const rawUrl = value || initialLocationUrl;
    if (!rawUrl || !mapInstanceRef.current || !markerRef.current) return;

    const decoded = (() => {
      try {
        return decodeURIComponent(rawUrl);
      } catch {
        return rawUrl;
      }
    })();

    const coordMatch = decoded.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[2]);
      const currentPos = markerRef.current.getLatLng();

      if (
        !Number.isNaN(lat) &&
        !Number.isNaN(lng) &&
        (Math.abs(currentPos.lat - lat) > 0.0001 ||
          Math.abs(currentPos.lng - lng) > 0.0001)
      ) {
        mapInstanceRef.current.setView([lat, lng], 16);
        markerRef.current.setLatLng([lat, lng]);
      }
    }
  }, [value, initialLocationUrl]);

  // Initialize Interactive Map
  useEffect(() => {
    let isMounted = true;

    const initMap = async () => {
      const L = (await import("leaflet")).default;
      if (!isMounted || !mapContainerRef.current || mapInstanceRef.current) return;

      const customIcon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      });

      let defaultLat = 22.5726;
      let defaultLng = 88.3639;

      const rawUrl = value || initialLocationUrl;
      const decoded = (() => {
        try {
          return decodeURIComponent(rawUrl);
        } catch {
          return rawUrl;
        }
      })();

      const coordMatch = decoded.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
      if (coordMatch) {
        defaultLat = parseFloat(coordMatch[1]);
        defaultLng = parseFloat(coordMatch[2]);
      }

      const map = L.map(mapContainerRef.current).setView(
        [defaultLat, defaultLng],
        15
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      const marker = L.marker([defaultLat, defaultLng], {
        draggable: true,
        icon: customIcon,
      }).addTo(map);

      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        updatePinnedLocation(pos.lat, pos.lng);
      });

      map.on("click", async (e: import("leaflet").LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        updatePinnedLocation(lat, lng);

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          );
          if (res.ok) {
            const data = await res.json();
            if (data?.name || data?.display_name) {
              const label = data.name || data.display_name.split(",")[0];
              updatePinnedLocation(lat, lng, label);
            }
          }
        } catch {
          // Coordinates already saved as fallback
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
        markerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updatePinnedLocation]);

  const handleSearchCity = async () => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    setSearching(true);
    setError("");

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
          trimmed
        )}`
      );
      if (!res.ok) {
        throw new Error("Search request failed");
      }

      const results = await res.json();
      if (Array.isArray(results) && results.length > 0) {
        const lat = parseFloat(results[0].lat);
        const lon = parseFloat(results[0].lon);
        mapInstanceRef.current?.setView([lat, lon], 17);
        markerRef.current?.setLatLng([lat, lon]);
        updatePinnedLocation(lat, lon, trimmed);
      } else {
        setError("Location not found. Try a nearby landmark, street, or pincode.");
      }
    } catch {
      setError("Failed to search location. Please try again or pin directly on the map.");
    } finally {
      setSearching(false);
    }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
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
        setError("Unable to retrieve your location. Please check browser location permissions.");
        setLocating(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="space-y-3">
      {error && (
        <div className="px-3.5 py-2.5 bg-red-50 border border-red-200 text-red-700 rounded-sm text-xs font-medium">
          {error}
        </div>
      )}

      <div className="bg-slate-50 border border-slate-300 rounded-sm p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (error) setError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSearchCity();
                }
              }}
              className="w-full pl-9 pr-3 py-2 border rounded-sm text-xs sm:text-sm border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-700 focus:border-teal-700"
              placeholder="Search area, street, pincode, or landmark..."
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSearchCity}
              disabled={searching || !searchQuery.trim()}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-sm text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer shrink-0 disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              {searching && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Find</span>
            </button>

            <button
              type="button"
              onClick={handleDetectLocation}
              disabled={locating}
              className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-sm text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
            >
              <Navigation className={`w-3.5 h-3.5 ${locating ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">
                {locating ? "Locating..." : "Detect GPS"}
              </span>
            </button>
          </div>
        </div>

        <div
          ref={mapContainerRef}
          className="w-full h-72 rounded-sm overflow-hidden border border-slate-300 z-0"
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500">
          <span>
            * Click anywhere on the map or drag the marker pin to auto-generate the store URL.
          </span>
          {value && (
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-teal-700 hover:text-teal-800 hover:underline inline-flex items-center gap-1 font-semibold shrink-0"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Verify on Google Maps</span>
              <ExternalLink className="w-3 h-3" />
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