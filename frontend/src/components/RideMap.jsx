import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Default Dhaka coordinates (Banani area)
const DHAKA_DEFAULT = [23.7937, 90.4066];

// Helper to generate marker icon with custom HTML
function createPinIcon(label, type = 'pickup') {
  const isDropoff = type === 'dropoff';
  const html = `
    <div class="map-pin-anchor">
      <div class="pin-bubble ${isDropoff ? 'dropoff-bubble' : ''}">
        <span class="pin-dot ${isDropoff ? 'red-dot' : 'green-dot'}"></span>
        <span class="pin-label">${label}</span>
      </div>
      <div class="pin-arrow ${isDropoff ? 'red-arrow' : ''}"></div>
    </div>
  `;

  return L.divIcon({
    className: 'leaflet-custom-marker',
    html,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

export default function RideMap({
  mode = 'passenger-select', // 'passenger-select' | 'passenger-active' | 'driver-navigation'
  pickup, // { lat, lng, label }
  dropoff, // { lat, lng, label }
  passengers = [], // For driver mode: array of passenger details
  height = '340px',
  activeRideStatus = null,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersGroupRef = useRef(null);

  // Initialize Leaflet Map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialCenter =
      pickup?.lat && pickup?.lng
        ? [pickup.lat, pickup.lng]
        : dropoff?.lat && dropoff?.lng
        ? [dropoff.lat, dropoff.lng]
        : DHAKA_DEFAULT;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 13,
      zoomControl: true,
    });

    // Add reliable OpenStreetMap raster tiles (no API key required)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Create a LayerGroup to hold markers and routes
    const layersGroup = L.layerGroup().addTo(map);
    layersGroupRef.current = layersGroup;
    mapInstanceRef.current = map;

    // Handle container resize cleanly
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update markers, route line, and camera bounds when coordinates or mode change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = layersGroupRef.current;
    if (!map || !group) return;

    // Clear previous markers and lines
    group.clearLayers();

    const boundsPoints = [];

    if (mode === 'driver-navigation') {
      // Driver view: Render all passengers in the pool
      passengers.forEach((p) => {
        const pPickup =
          p.pickup_lat && p.pickup_lng
            ? [Number(p.pickup_lat), Number(p.pickup_lng)]
            : null;
        const pDropoff =
          p.dropoff_lat && p.dropoff_lng
            ? [Number(p.dropoff_lat), Number(p.dropoff_lng)]
            : null;

        if (pPickup) {
          const marker = L.marker(pPickup, {
            icon: createPinIcon(
              `👤 ${p.passenger_name || 'Passenger'} (${p.pickup_zone_name || 'Pickup'})`,
              'pickup'
            ),
          });
          group.addLayer(marker);
          boundsPoints.push(pPickup);
        }

        if (pDropoff) {
          const marker = L.marker(pDropoff, {
            icon: createPinIcon(
              `🏁 ${p.passenger_name || 'Passenger'} Drop-off (${p.dropoff_zone_name || 'Drop-off'})`,
              'dropoff'
            ),
          });
          group.addLayer(marker);
          boundsPoints.push(pDropoff);
        }

        if (pPickup && pDropoff) {
          const routeLine = L.polyline([pPickup, pDropoff], {
            color: '#10b981',
            weight: 4,
            opacity: 0.85,
          });
          group.addLayer(routeLine);
        }
      });
    } else {
      // Passenger mode: Preview or active ride (Where from -> Where to)
      const hasPickup = pickup?.lat && pickup?.lng;
      const hasDropoff = dropoff?.lat && dropoff?.lng;

      if (hasPickup) {
        const pickupPoint = [Number(pickup.lat), Number(pickup.lng)];
        const marker = L.marker(pickupPoint, {
          icon: createPinIcon(pickup.label || 'Pickup Location', 'pickup'),
        });
        group.addLayer(marker);
        boundsPoints.push(pickupPoint);
      }

      if (hasDropoff) {
        const dropoffPoint = [Number(dropoff.lat), Number(dropoff.lng)];
        const marker = L.marker(dropoffPoint, {
          icon: createPinIcon(dropoff.label || 'Drop-off Destination', 'dropoff'),
        });
        group.addLayer(marker);
        boundsPoints.push(dropoffPoint);
      }

      if (hasPickup && hasDropoff) {
        const routeCoords = [
          [Number(pickup.lat), Number(pickup.lng)],
          [Number(dropoff.lat), Number(dropoff.lng)],
        ];

        // Route line
        const routeLine = L.polyline(routeCoords, {
          color: '#3b82f6',
          weight: 4,
          dashArray: '8, 8',
          opacity: 0.9,
        });
        group.addLayer(routeLine);
      }
    }

    // Adjust camera view
    if (boundsPoints.length > 1) {
      map.fitBounds(L.latLngBounds(boundsPoints), {
        padding: [50, 50],
        maxZoom: 15,
        animate: true,
      });
    } else if (boundsPoints.length === 1) {
      map.setView(boundsPoints[0], 14, { animate: true });
    }
  }, [pickup, dropoff, passengers, mode]);

  return (
    <div className="ride-map-wrapper" style={{ height }}>
      {/* Route Badge Overlay */}
      {mode === 'driver-navigation' ? (
        <div className="map-guidance-pill driver-pill">
          <span>
            {activeRideStatus === 'started'
              ? '⚡ Trip in progress — Navigating to passenger drop-off locations'
              : '📍 Pick up passengers at their joining locations'}
          </span>
        </div>
      ) : (
        pickup?.label && dropoff?.label && (
          <div className="map-guidance-pill">
            <span>🗺️ {pickup.label} ➔ {dropoff.label}</span>
          </div>
        )
      )}

      <div
        ref={mapContainerRef}
        className="ride-map-container"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
