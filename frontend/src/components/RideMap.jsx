import React, { useEffect, useRef, useState, useMemo } from 'react';
import Map, { Marker, Source, Layer, NavigationControl } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

// Default Dhaka coordinates (Banani area)
const DHAKA_DEFAULT = {
  latitude: 23.7937,
  longitude: 90.4066,
  zoom: 13,
};

// High-clarity raster style that works 100% out-of-the-box without requiring an API key
const OPEN_STREET_STYLE = {
  version: 8,
  sources: {
    'osm-tiles': {
      type: 'raster',
      tiles: [
        'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'osm-tiles-layer',
      type: 'raster',
      source: 'osm-tiles',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

export default function RideMap({
  mode = 'passenger-select', // 'passenger-select' | 'passenger-active' | 'driver-navigation'
  pickup, // { lat, lng, label }
  dropoff, // { lat, lng, label }
  passengers = [], // For driver mode: array of { id, name, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, pickup_zone_name, dropoff_zone_name }
  onDropoffChange, // function({ lat, lng }) for interactive drop place setting
  onPickupChange,
  interactive = true,
  height = '340px',
  activeRideStatus = null,
}) {
  const mapRef = useRef(null);
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN || '';
  const mapStyle = mapboxToken ? 'mapbox://styles/mapbox/streets-v12' : OPEN_STREET_STYLE;

  const [viewState, setViewState] = useState({
    latitude: dropoff?.lat || pickup?.lat || DHAKA_DEFAULT.latitude,
    longitude: dropoff?.lng || pickup?.lng || DHAKA_DEFAULT.longitude,
    zoom: 13,
  });

  // Re-center when dropoff or pickup changes
  useEffect(() => {
    const targetLat = dropoff?.lat || pickup?.lat;
    const targetLng = dropoff?.lng || pickup?.lng;
    if (targetLat && targetLng && mapRef.current) {
      mapRef.current.flyTo({
        center: [targetLng, targetLat],
        zoom: 13.5,
        duration: 900,
      });
    }
  }, [dropoff?.lat, dropoff?.lng, pickup?.lat, pickup?.lng]);

  // Click on map to place or update dropoff point
  const handleMapClick = (e) => {
    if (mode === 'passenger-select' && onDropoffChange) {
      const { lng, lat } = e.lngLat;
      onDropoffChange({ lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) });
    }
  };

  // Marker drag end
  const handleDropoffDragEnd = (e) => {
    if (onDropoffChange) {
      const { lng, lat } = e.lngLat;
      onDropoffChange({ lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) });
    }
  };

  // Generate GeoJSON line for route connecting pickup to dropoff
  const routeGeoJSON = useMemo(() => {
    if (mode === 'driver-navigation' && passengers.length > 0) {
      // Connect each passenger's pickup to their dropoff
      const features = passengers.map((p, idx) => ({
        type: 'Feature',
        properties: { id: p.ride_passenger_id || idx },
        geometry: {
          type: 'LineString',
          coordinates: [
            [Number(p.pickup_lng), Number(p.pickup_lat)],
            [Number(p.dropoff_lng), Number(p.dropoff_lat)],
          ],
        },
      }));
      return {
        type: 'FeatureCollection',
        features,
      };
    }

    if (pickup?.lat && pickup?.lng && dropoff?.lat && dropoff?.lng) {
      return {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [
            [pickup.lng, pickup.lat],
            [dropoff.lng, dropoff.lat],
          ],
        },
      };
    }

    return null;
  }, [pickup, dropoff, passengers, mode]);

  return (
    <div className="ride-map-wrapper" style={{ height }}>
      {/* Informational overlay badge */}
      {mode === 'passenger-select' && (
        <div className="map-guidance-pill">
          <span>📍 Click map or drag red marker to pinpoint exact drop-off spot</span>
        </div>
      )}

      {mode === 'driver-navigation' && (
        <div className="map-guidance-pill driver-pill">
          <span>
            {activeRideStatus === 'started'
              ? '⚡ Trip in progress — Navigating to passenger drop-off locations'
              : '📍 Pick up passengers at their joining locations'}
          </span>
        </div>
      )}

      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        onClick={handleMapClick}
        mapStyle={mapStyle}
        mapboxAccessToken={mapboxToken || undefined}
        style={{ width: '100%', height: '100%', borderRadius: '12px' }}
        cursor={mode === 'passenger-select' ? 'crosshair' : 'grab'}
      >
        <NavigationControl position="bottom-right" />

        {/* Route Line */}
        {routeGeoJSON && (
          <Source id="route-source" type="geojson" data={routeGeoJSON}>
            <Layer
              id="route-layer-casing"
              type="line"
              paint={{
                'line-color': '#000000',
                'line-width': 6,
                'line-opacity': 0.35,
              }}
            />
            <Layer
              id="route-layer"
              type="line"
              paint={{
                'line-color': mode === 'driver-navigation' ? '#10b981' : '#3b82f6',
                'line-width': 4,
                'line-dasharray': mode === 'passenger-select' ? [2, 1] : [1, 0],
              }}
            />
          </Source>
        )}

        {/* Passenger Mode Markers */}
        {(mode === 'passenger-select' || mode === 'passenger-active') && (
          <>
            {/* Pickup Marker (Green) */}
            {pickup?.lat && pickup?.lng && (
              <Marker
                latitude={pickup.lat}
                longitude={pickup.lng}
                anchor="bottom"
              >
                <div className="map-pin pin-pickup">
                  <div className="pin-bubble">
                    <span className="pin-dot green-dot"></span>
                    <span className="pin-label">{pickup.label || 'Pickup'}</span>
                  </div>
                  <div className="pin-arrow"></div>
                </div>
              </Marker>
            )}

            {/* Dropoff Marker (Red - Draggable in select mode) */}
            {dropoff?.lat && dropoff?.lng && (
              <Marker
                latitude={dropoff.lat}
                longitude={dropoff.lng}
                anchor="bottom"
                draggable={mode === 'passenger-select'}
                onDragEnd={handleDropoffDragEnd}
              >
                <div className="map-pin pin-dropoff">
                  <div className="pin-bubble dropoff-bubble">
                    <span className="pin-dot red-dot"></span>
                    <span className="pin-label">{dropoff.label || 'Drop-off Spot'}</span>
                  </div>
                  <div className="pin-arrow red-arrow"></div>
                </div>
              </Marker>
            )}
          </>
        )}

        {/* Driver Mode Markers */}
        {mode === 'driver-navigation' && (
          <>
            {passengers.map((p, idx) => (
              <React.Fragment key={p.ride_passenger_id || idx}>
                {/* Passenger joining location (Pickup) */}
                {p.pickup_lat && p.pickup_lng && (
                  <Marker
                    latitude={Number(p.pickup_lat)}
                    longitude={Number(p.pickup_lng)}
                    anchor="bottom"
                  >
                    <div className="map-pin pin-pickup">
                      <div className="pin-bubble">
                        <span className="pin-dot green-dot"></span>
                        <span className="pin-label">👤 {p.passenger_name} ({p.pickup_zone_name})</span>
                      </div>
                      <div className="pin-arrow"></div>
                    </div>
                  </Marker>
                )}

                {/* Passenger destination (Dropoff) */}
                {p.dropoff_lat && p.dropoff_lng && (
                  <Marker
                    latitude={Number(p.dropoff_lat)}
                    longitude={Number(p.dropoff_lng)}
                    anchor="bottom"
                  >
                    <div className="map-pin pin-dropoff">
                      <div className="pin-bubble dropoff-bubble">
                        <span className="pin-dot red-dot"></span>
                        <span className="pin-label">🏁 {p.passenger_name} Drop-off ({p.dropoff_zone_name})</span>
                      </div>
                      <div className="pin-arrow red-arrow"></div>
                    </div>
                  </Marker>
                )}
              </React.Fragment>
            ))}
          </>
        )}
      </Map>
    </div>
  );
}
