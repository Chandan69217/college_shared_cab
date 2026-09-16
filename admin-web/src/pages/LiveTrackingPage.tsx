import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  InfoWindow,
  Polyline,
} from '@react-google-maps/api';
import {
  Car,
  Navigation,
  RefreshCw,
  Search,
  Radio,
  Clock,
  User,
  Route as RouteIcon,
  ShieldCheck,
  AlertTriangle,
  Layers,
  History,
  X,
  Compass,
} from 'lucide-react';
import { api, getApiErrorMessage } from '../services/api';
import { getAdminSupabase } from '../services/supabase';
import { GOOGLE_MAPS_API_KEY, MAP_LIBRARIES, DARK_MAP_STYLE } from '../config/maps';

interface ActiveVehicle {
  tripId: string;
  tripStatus: string;
  tripType: string;
  latitude: number | null;
  longitude: number | null;
  lastUpdated: string | null;
  staleStatus: 'LIVE' | 'DELAYED' | 'OFFLINE';
  isLive: boolean;
  bookedSeats: number;
  maxCapacity: number;
  currentStopSequence?: number;
  vehicle: {
    id: string;
    number: string;
    model: string;
    type: string;
  };
  driver: {
    id: string;
    name: string;
    phone?: string;
  };
  route: {
    id: string;
    name: string;
    code: string;
  };
}

interface BreadcrumbPoint {
  id: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  recorded_at: string;
}

export const LiveTrackingPage: React.FC = () => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: MAP_LIBRARIES,
  });

  const [vehicles, setVehicles] = useState<ActiveVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<ActiveVehicle | null>(null);
  const [historyTripId, setHistoryTripId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbPoint[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [autoRefreshCount, setAutoRefreshCount] = useState(0);

  const mapRef = useRef<google.maps.Map | null>(null);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const fetchActiveVehicles = async () => {
    try {
      const res = await api.get('/trips/active-locations');
      if (res.data.success) {
        setVehicles(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch active fleet', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveVehicles();

    // Setup Controlled Poll every 10 seconds
    const interval = setInterval(() => {
      fetchActiveVehicles();
      setAutoRefreshCount((prev) => prev + 1);
    }, 10000);

    // Setup Supabase Realtime Subscription if configured
    const supabase = getAdminSupabase();
    let channel: any = null;

    if (supabase) {
      channel = supabase
        .channel('admin_live_fleet')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'vehicle_current_locations' },
          (payload: any) => {
            const updated = payload.new;
            if (updated && updated.vehicle_id) {
              setVehicles((prev) =>
                prev.map((v) => {
                  if (v.vehicle?.id === updated.vehicle_id || v.tripId === updated.trip_id) {
                    return {
                      ...v,
                      latitude: updated.latitude,
                      longitude: updated.longitude,
                      lastUpdated: updated.updated_at || new Date().toISOString(),
                      staleStatus: 'LIVE',
                      isLive: true,
                    };
                  }
                  return v;
                })
              );
            }
          }
        )
        .subscribe();
    }

    return () => {
      clearInterval(interval);
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const fitBoundsToFleet = () => {
    if (!mapRef.current || vehicles.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    let hasValidCoords = false;

    vehicles.forEach((v) => {
      if (v.latitude != null && v.longitude != null) {
        bounds.extend({ lat: v.latitude, lng: v.longitude });
        hasValidCoords = true;
      }
    });

    if (hasValidCoords) {
      mapRef.current.fitBounds(bounds);
    }
  };

  const handleSelectVehicle = (v: ActiveVehicle) => {
    setSelectedVehicle(v);
    if (mapRef.current && v.latitude != null && v.longitude != null) {
      mapRef.current.panTo({ lat: v.latitude, lng: v.longitude });
      mapRef.current.setZoom(16);
    }
  };

  const fetchTripHistory = async (tripId: string) => {
    setHistoryTripId(tripId);
    setLoadingHistory(true);
    try {
      const res = await api.get(`/trips/${tripId}/history`);
      if (res.data.success) {
        const points = res.data.data?.breadcrumbs || [];
        setBreadcrumbs(points);
        if (mapRef.current && points.length > 0) {
          const bounds = new google.maps.LatLngBounds();
          points.forEach((p: any) => bounds.extend({ lat: p.latitude, lng: p.longitude }));
          mapRef.current.fitBounds(bounds);
        }
      }
    } catch (err) {
      console.error('Failed to load history', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const filteredVehicles = vehicles.filter((v) => {
    const q = searchQuery.toLowerCase();
    return (
      (v.vehicle?.number || '').toLowerCase().includes(q) ||
      (v.driver?.name || '').toLowerCase().includes(q) ||
      (v.route?.name || '').toLowerCase().includes(q)
    );
  });

  const getMarkerIcon = (staleStatus: string) => {
    let color = '#10B981'; // Live Emerald
    if (staleStatus === 'DELAYED') color = '#F59E0B'; // Delayed Amber
    if (staleStatus === 'OFFLINE') color = '#EF4444'; // Offline Red

    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: color,
      fillOpacity: 1,
      strokeWeight: 3,
      strokeColor: '#FFFFFF',
      scale: 9,
    };
  };

  const getFormatTimeAgo = (iso?: string | null) => {
    if (!iso) return 'Offline';
    const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (seconds < 60) return `${Math.max(1, seconds)}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] -m-6 relative overflow-hidden bg-slate-950">
      {/* Top Bar */}
      <div className="h-16 px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              Live Fleet Tracking Radar
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                REAL-TIME GPS
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Active Vehicles: {vehicles.filter((v) => v.isLive).length} of {vehicles.length} on trip
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchActiveVehicles}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <button
            onClick={fitBoundsToFleet}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition"
          >
            <Compass className="w-3.5 h-3.5" />
            Fit All Bounds
          </button>
        </div>
      </div>

      {/* Main Map & Sidebar Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar Panel */}
        <div className="w-80 bg-slate-900/95 backdrop-blur border-r border-slate-800 flex flex-col z-10 shrink-0">
          <div className="p-4 border-b border-slate-800">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search cab, driver, route..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading active fleet data...</div>
            ) : filteredVehicles.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No active vehicles match your filter.
              </div>
            ) : (
              filteredVehicles.map((v) => {
                const isSelected = selectedVehicle?.tripId === v.tripId;
                return (
                  <div
                    key={v.tripId}
                    onClick={() => handleSelectVehicle(v)}
                    className={`p-3.5 rounded-xl border transition cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500/40 shadow-lg shadow-emerald-500/5'
                        : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-white">
                          {v.vehicle?.number || 'LIVE CAB'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">{v.vehicle?.model}</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 text-[9px] font-bold rounded-full border uppercase ${
                          v.staleStatus === 'LIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : v.staleStatus === 'DELAYED'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-red-500/10 text-red-400 border-red-500/30'
                        }`}
                      >
                        {v.staleStatus}
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 font-medium mb-1 truncate">
                      {v.route?.name || 'Campus Route'}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-700/50">
                      <div className="flex items-center gap-1.5 truncate">
                        <User className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{v.driver?.name || 'Driver'}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 font-mono text-[10px] text-slate-400">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {getFormatTimeAgo(v.lastUpdated)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Map Area */}
        <div className="flex-1 relative bg-slate-950">
          {!isLoaded ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-3">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold">Initializing Google Maps JavaScript Engine...</p>
              {loadError && (
                <p className="text-xs text-rose-400 max-w-md text-center">
                  Map Error: {loadError.message}. Please verify Google Maps JavaScript API is enabled.
                </p>
              )}
            </div>
          ) : (
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={
                vehicles.length > 0 && vehicles[0].latitude != null && vehicles[0].longitude != null
                  ? { lat: vehicles[0].latitude, lng: vehicles[0].longitude }
                  : { lat: 28.6139, lng: 77.2090 }
              }
              zoom={13}
              onLoad={onMapLoad}
              options={{
                styles: DARK_MAP_STYLE,
                disableDefaultUI: false,
                zoomControl: true,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false,
              }}
            >
              {/* Vehicle Markers */}
              {vehicles.map((v) => {
                if (v.latitude == null || v.longitude == null) return null;
                return (
                  <Marker
                    key={v.tripId}
                    position={{ lat: v.latitude, lng: v.longitude }}
                    icon={getMarkerIcon(v.staleStatus)}
                    onClick={() => setSelectedVehicle(v)}
                  />
                );
              })}

              {/* Breadcrumb Trail Polyline for Route Replay */}
              {breadcrumbs.length > 1 && (
                <Polyline
                  path={breadcrumbs.map((b) => ({ lat: b.latitude, lng: b.longitude }))}
                  options={{
                    strokeColor: '#38BDF8',
                    strokeOpacity: 0.9,
                    strokeWeight: 4,
                  }}
                />
              )}

              {/* Selected Vehicle InfoWindow */}
              {selectedVehicle && selectedVehicle.latitude != null && selectedVehicle.longitude != null && (
                <InfoWindow
                  position={{ lat: selectedVehicle.latitude, lng: selectedVehicle.longitude }}
                  onCloseClick={() => setSelectedVehicle(null)}
                >
                  <div className="p-2 text-slate-900 min-w-[220px]">
                    <div className="flex items-center justify-between font-bold border-b border-slate-200 pb-1.5 mb-1.5">
                      <span className="font-mono text-emerald-700">{selectedVehicle.vehicle?.number}</span>
                      <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                        {selectedVehicle.tripStatus}
                      </span>
                    </div>
                    <div className="text-xs font-semibold mb-1">{selectedVehicle.route?.name}</div>
                    <div className="text-[11px] text-slate-600 mb-0.5">
                      <strong>Driver:</strong> {selectedVehicle.driver?.name} ({selectedVehicle.driver?.phone || 'No phone'})
                    </div>
                    <div className="text-[11px] text-slate-600 mb-0.5">
                      <strong>Occupancy:</strong> {selectedVehicle.bookedSeats} / {selectedVehicle.maxCapacity} seats
                    </div>
                    {selectedVehicle.currentStopSequence !== undefined && (
                      <div className="text-[11px] text-slate-600 mb-0.5">
                        <strong>Current Stop:</strong> Stop #{selectedVehicle.currentStopSequence} Passed
                      </div>
                    )}
                    <div className="text-[11px] text-slate-600 mb-2">
                      <strong>Telemetry:</strong> {getFormatTimeAgo(selectedVehicle.lastUpdated)} ({selectedVehicle.staleStatus})
                    </div>
                    <button
                      onClick={() => fetchTripHistory(selectedVehicle.tripId)}
                      className="w-full text-center text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 py-1.5 rounded-lg transition flex items-center justify-center gap-1.5"
                    >
                      <History className="w-3.5 h-3.5 text-sky-400" />
                      Replay GPS Trail
                    </button>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          )}

          {/* Historical Breadcrumbs Replay Drawer */}
          {historyTripId && (
            <div className="absolute bottom-6 right-6 w-96 bg-slate-900/95 backdrop-blur border border-slate-700 rounded-2xl p-4 shadow-2xl z-20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-sky-400" />
                  <h3 className="text-xs font-bold text-white">Trip GPS Breadcrumb Trail</h3>
                </div>
                <button
                  onClick={() => {
                    setHistoryTripId(null);
                    setBreadcrumbs([]);
                  }}
                  className="p-1 text-slate-400 hover:text-white rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {loadingHistory ? (
                <div className="py-4 text-center text-xs text-slate-400">Loading location history...</div>
              ) : (
                <div className="space-y-2">
                  <p className="text-[11px] text-slate-300">
                    Total Breadcrumb Fixes: <strong>{breadcrumbs.length}</strong> points recorded by driver phone GPS.
                  </p>
                  <div className="max-h-32 overflow-y-auto space-y-1 text-[10px] font-mono text-slate-400 bg-slate-950 p-2 rounded-lg border border-slate-800">
                    {breadcrumbs.slice(-10).map((b, idx) => (
                      <div key={b.id || idx} className="flex justify-between items-center">
                        <span>{new Date(b.recorded_at).toLocaleTimeString()}</span>
                        <span className="text-emerald-400 font-semibold">Waypoint #{breadcrumbs.length - 10 + idx + 1 > 0 ? breadcrumbs.length - 10 + idx + 1 : idx + 1}</span>
                        <span>{Math.round(b.speed)} km/h</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
