import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Circle, Autocomplete } from '@react-google-maps/api';
import { MapPin, Search, AlertTriangle, CheckCircle, Loader2, Navigation } from 'lucide-react';
import { GOOGLE_MAPS_API_KEY, MAP_LIBRARIES, DARK_MAP_STYLE } from '../config/maps';

interface LocationPickerMapProps {
  initialLat: number;
  initialLng: number;
  collegeLat?: number;
  collegeLng?: number;
  collegeName?: string;
  serviceRadiusKm?: number;
  onLocationChange: (lat: number, lng: number, distanceKm: number, isWithinRadius: boolean) => void;
  onAddressSelect?: (formattedAddress: string, placeName?: string) => void;
}

function calculateHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}

export const LocationPickerMap: React.FC<LocationPickerMapProps> = ({
  initialLat,
  initialLng,
  collegeLat,
  collegeLng,
  collegeName = 'College Campus',
  serviceRadiusKm = 10.0,
  onLocationChange,
  onAddressSelect,
}) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: MAP_LIBRARIES,
  });

  const [position, setPosition] = useState<{ lat: number; lng: number }>({
    lat: initialLat || 28.5645,
    lng: initialLng || 77.3345,
  });

  const [searchAddress, setSearchAddress] = useState('');
  const [geocoding, setGeocoding] = useState(false);
  const [searchStatus, setSearchStatus] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const mapRef = useRef<google.maps.Map | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const collegePos =
    collegeLat != null && collegeLng != null ? { lat: collegeLat, lng: collegeLng } : null;

  const distanceKm = collegePos
    ? calculateHaversineKm(collegePos.lat, collegePos.lng, position.lat, position.lng)
    : 0;
  const isWithinRadius = distanceKm <= serviceRadiusKm;

  useEffect(() => {
    onLocationChange(position.lat, position.lng, distanceKm, isWithinRadius);
  }, [position, distanceKm, isWithinRadius]);

  const updateLocation = useCallback(
    (newLat: number, newLng: number, label?: string) => {
      const fixedLat = parseFloat(newLat.toFixed(6));
      const fixedLng = parseFloat(newLng.toFixed(6));
      setPosition({ lat: fixedLat, lng: fixedLng });

      if (mapRef.current) {
        mapRef.current.panTo({ lat: fixedLat, lng: fixedLng });
        mapRef.current.setZoom(15);
      }

      if (label) {
        setSearchStatus({ type: 'success', message: `Found: ${label}` });
      }
    },
    []
  );

  // Reverse geocode to get human-readable address on map click/marker drag
  const reverseGeocode = useCallback(
    (lat: number, lng: number) => {
      if (!window.google || !window.google.maps) return;
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const formatted = results[0].formatted_address;
          setSearchAddress(formatted);
          if (onAddressSelect) {
            onAddressSelect(formatted);
          }
        }
      });
    },
    [onAddressSelect]
  );

  const handleMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const newLat = e.latLng.lat();
      const newLng = e.latLng.lng();
      updateLocation(newLat, newLng);
      reverseGeocode(newLat, newLng);
    }
  };

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const newLat = e.latLng.lat();
      const newLng = e.latLng.lng();
      updateLocation(newLat, newLng);
      reverseGeocode(newLat, newLng);
    }
  };

  // Triggered when user selects a suggestion from the Google Places Autocomplete dropdown
  const handlePlaceChanged = () => {
    if (!autocompleteRef.current) return;
    const place = autocompleteRef.current.getPlace();

    if (place && place.geometry && place.geometry.location) {
      const newLat = place.geometry.location.lat();
      const newLng = place.geometry.location.lng();
      const addressLabel = place.formatted_address || place.name || searchAddress;
      setSearchAddress(addressLabel);
      updateLocation(newLat, newLng, addressLabel);

      if (onAddressSelect) {
        onAddressSelect(addressLabel, place.name);
      }
      setSearchStatus({ type: 'success', message: `Located: ${addressLabel}` });
    } else if (searchAddress.trim()) {
      handleSearchLocation();
    }
  };

  // Multi-strategy address search with Google Places, Google Geocoder, and Nominatim fallbacks
  const handleSearchLocation = async (e?: React.FormEvent | React.MouseEvent | React.KeyboardEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const query = searchAddress.trim();
    if (!query) {
      setSearchStatus({ type: 'error', message: 'Please enter a location or address to search.' });
      return;
    }

    setGeocoding(true);
    setSearchStatus({ type: 'info', message: `Searching for "${query}"...` });

    // Strategy 1: Try Google Places TextSearch / findPlaceFromQuery if map is loaded
    if (window.google && window.google.maps && mapRef.current) {
      try {
        const placesService = new google.maps.places.PlacesService(mapRef.current);
        const searchRequest: google.maps.places.FindPlaceFromPhoneNumberRequest | google.maps.places.TextSearchRequest = {
          query: query,
          fields: ['name', 'geometry', 'formatted_address'],
          locationBias: collegePos
            ? new google.maps.LatLng(collegePos.lat, collegePos.lng)
            : undefined,
        };

        const placesPromise = new Promise<{ lat: number; lng: number; label: string } | null>(
          (resolve) => {
            placesService.textSearch(searchRequest, (results, status) => {
              if (
                status === google.maps.places.PlacesServiceStatus.OK &&
                results &&
                results.length > 0 &&
                results[0].geometry?.location
              ) {
                const loc = results[0].geometry.location;
                resolve({
                  lat: loc.lat(),
                  lng: loc.lng(),
                  label: results[0].name || results[0].formatted_address || query,
                });
              } else {
                resolve(null);
              }
            });
          }
        );

        const placeResult = await placesPromise;
        if (placeResult) {
          updateLocation(placeResult.lat, placeResult.lng, placeResult.label);
          if (onAddressSelect) onAddressSelect(placeResult.label);
          setGeocoding(false);
          return;
        }
      } catch (err) {
        console.warn('Google Places textSearch failed, attempting geocoder fallback...', err);
      }

      // Strategy 2: Try Google Maps Geocoder
      try {
        const geocoder = new google.maps.Geocoder();
        const geocodePromise = new Promise<{ lat: number; lng: number; label: string } | null>(
          (resolve) => {
            geocoder.geocode(
              {
                address: query,
                bounds: collegePos
                  ? new google.maps.LatLngBounds(
                      { lat: collegePos.lat - 0.2, lng: collegePos.lng - 0.2 },
                      { lat: collegePos.lat + 0.2, lng: collegePos.lng + 0.2 }
                    )
                  : undefined,
              },
              (results, status) => {
                if (status === 'OK' && results && results.length > 0 && results[0].geometry?.location) {
                  const loc = results[0].geometry.location;
                  resolve({
                    lat: loc.lat(),
                    lng: loc.lng(),
                    label: results[0].formatted_address || query,
                  });
                } else {
                  resolve(null);
                }
              }
            );
          }
        );

        const geocodeResult = await geocodePromise;
        if (geocodeResult) {
          updateLocation(geocodeResult.lat, geocodeResult.lng, geocodeResult.label);
          if (onAddressSelect) onAddressSelect(geocodeResult.label);
          setGeocoding(false);
          return;
        }
      } catch (err) {
        console.warn('Google Geocoder failed, attempting open-street fallback...', err);
      }
    }

    // Strategy 3: OpenStreetMap Nominatim Free Geocoder Fallback (100% resilient)
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data) && data.length > 0) {
          const item = data[0];
          const newLat = parseFloat(item.lat);
          const newLng = parseFloat(item.lon);
          const label = item.display_name || query;
          updateLocation(newLat, newLng, label);
          if (onAddressSelect) onAddressSelect(label);
          setGeocoding(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Nominatim fallback query failed', err);
    }

    // If all strategies yielded no result:
    setGeocoding(false);
    setSearchStatus({
      type: 'error',
      message: `No results found for "${query}". Try typing a known landmark (e.g. Sector 18 Noida, Metro Station) or click directly on the map.`,
    });
  };

  if (!isLoaded) {
    return (
      <div className="h-56 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center text-slate-500 text-xs">
        {loadError ? `Map Error: ${loadError.message}` : 'Loading Google Maps...'}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Search Bar with Google Autocomplete */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 z-10 pointer-events-none" />
          <Autocomplete
            onLoad={(autocomplete) => {
              autocompleteRef.current = autocomplete;
              if (collegePos) {
                // Bias autocomplete results towards the college locality
                const circle = new google.maps.Circle({
                  center: collegePos,
                  radius: serviceRadiusKm * 1000,
                });
                const bounds = circle.getBounds();
                if (bounds) {
                  autocomplete.setBounds(bounds);
                }
              }
            }}
            onPlaceChanged={handlePlaceChanged}
          >
            <input
              type="text"
              placeholder="Search address, landmark, metro station..."
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSearchLocation(e);
                }
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
            />
          </Autocomplete>
        </div>
        <button
          type="button"
          onClick={handleSearchLocation}
          disabled={geocoding}
          className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow transition flex items-center gap-1 disabled:opacity-50 cursor-pointer shrink-0"
        >
          {geocoding ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" /> Locating...
            </>
          ) : (
            'Search'
          )}
        </button>
      </div>

      {/* Search Feedback Notification */}
      {searchStatus && (
        <div
          className={`p-2 rounded-lg text-[11px] flex items-center justify-between gap-2 border ${
            searchStatus.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              : searchStatus.type === 'error'
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-300'
              : 'bg-sky-500/10 border-sky-500/20 text-sky-300'
          }`}
        >
          <div className="flex items-center gap-1.5 truncate">
            {searchStatus.type === 'success' && <CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-400" />}
            {searchStatus.type === 'error' && <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400" />}
            {searchStatus.type === 'info' && <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin text-sky-400" />}
            <span className="truncate">{searchStatus.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setSearchStatus(null)}
            className="text-slate-400 hover:text-white text-xs px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Map Container */}
      <div className="h-60 rounded-xl overflow-hidden border border-slate-800 relative">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={position}
          zoom={14}
          onLoad={(map) => {
            mapRef.current = map;
          }}
          onClick={handleMapClick}
          options={{
            styles: DARK_MAP_STYLE,
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          }}
        >
          {/* Pickup / Campus Location Marker */}
          <Marker
            position={position}
            draggable={true}
            onDragEnd={handleMarkerDragEnd}
            title={collegePos ? "Pickup Location (Drag to adjust)" : (collegeName || "College Location (Drag to adjust)")}
            animation={google.maps.Animation.DROP}
          />

          {/* Reference Campus Marker (When picking a stop relative to a college) */}
          {collegePos && (
            <Marker
              position={collegePos}
              icon={{
                path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                fillColor: '#8B5CF6',
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: '#FFFFFF',
                scale: 6,
              }}
              title={collegeName}
            />
          )}

          {/* College Service Area Geofence Circle */}
          <Circle
            center={collegePos || position}
            radius={serviceRadiusKm * 1000}
            options={{
              fillColor: '#10B981',
              fillOpacity: 0.08,
              strokeColor: '#10B981',
              strokeOpacity: 0.4,
              strokeWeight: 1.5,
            }}
          />
        </GoogleMap>

        {/* Live Distance & Service Area Badge */}
        {collegePos ? (
          <div className="absolute top-2 right-2 px-2.5 py-1 rounded-lg backdrop-blur bg-slate-900/90 border border-slate-700 text-[10px] font-semibold flex items-center gap-1.5 shadow-lg">
            {isWithinRadius ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Within Service Area ({distanceKm} km ≤ {serviceRadiusKm} km)
              </span>
            ) : (
              <span className="text-rose-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Outside Service Area ({distanceKm} km &gt; {serviceRadiusKm} km)
              </span>
            )}
          </div>
        ) : (
          <div className="absolute top-2 right-2 px-2.5 py-1 rounded-lg backdrop-blur bg-slate-900/90 border border-slate-700 text-[10px] font-semibold flex items-center gap-1.5 shadow-lg text-emerald-400">
            <Navigation className="w-3 h-3 text-emerald-400" />
            <span>Campus Hub • {serviceRadiusKm} km Geofence Radius</span>
          </div>
        )}
      </div>

      <p className="text-[10px] text-slate-500 flex items-center justify-between">
        <span>💡 Click anywhere on the map or drag the pin to adjust position.</span>
        {distanceKm > 0 && <span className="text-slate-400 font-mono">{distanceKm} km to campus</span>}
      </p>
    </div>
  );
};

