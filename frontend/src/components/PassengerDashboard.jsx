import { useEffect, useState } from 'react';
import { api } from '../api.js';
import RideMap from './RideMap.jsx';

export default function PassengerDashboard({ user }) {
  const [zones, setZones] = useState([]);
  const [pickupZoneId, setPickupZoneId] = useState('');
  const [dropoffZoneId, setDropoffZoneId] = useState('');
  const [seats, setSeats] = useState(1);

  const [estimate, setEstimate] = useState(null);
  const [estimateLoading, setEstimateLoading] = useState(false);

  const [activeRide, setActiveRide] = useState(null);
  const [loadingActive, setLoadingActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [history, setHistory] = useState([]);

  const selectedPickupZone = zones.find((z) => z.id === pickupZoneId);
  const selectedDropoffZone = zones.find((z) => z.id === dropoffZoneId);

  // Load Dhaka zones
  useEffect(() => {
    api('/api/zones')
      .then((data) => {
        setZones(data.zones || []);
        if (data.zones && data.zones.length >= 2) {
          // Default: Banani to Mohakhali (as in the PRD story!)
          const banani = data.zones.find((z) => z.slug === 'banani') || data.zones[0];
          const mohakhali = data.zones.find((z) => z.slug === 'mohakhali') || data.zones[1];
          setPickupZoneId(banani.id);
          setDropoffZoneId(mohakhali.id);
        }
      })
      .catch((e) => setErrorMsg(e.message));
  }, []);

  // Poll active ride every 3s
  const fetchActive = async () => {
    try {
      const data = await api('/api/rides/requests/active', { auth: true });
      setActiveRide(data.activeRide);
    } catch (e) {
      console.error('Failed to fetch active ride', e);
    } finally {
      setLoadingActive(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const data = await api('/api/rides/requests/history', { auth: true });
      setHistory(data.history || []);
    } catch (e) {
      console.error('Failed to fetch history', e);
    }
  };

  useEffect(() => {
    fetchActive();
    fetchHistory();
    const timer = setInterval(fetchActive, 3000);
    return () => clearInterval(timer);
  }, []);

  // Update fare estimate when pickup, dropoff or seats change
  useEffect(() => {
    if (!pickupZoneId || !dropoffZoneId || pickupZoneId === dropoffZoneId) {
      setEstimate(null);
      return;
    }

    setEstimateLoading(true);
    const body = {
      pickupZoneId,
      dropoffZoneId,
      seats: Number(seats),
      pickupLat: selectedPickupZone ? Number(selectedPickupZone.latitude) : undefined,
      pickupLng: selectedPickupZone ? Number(selectedPickupZone.longitude) : undefined,
      dropoffLat: selectedDropoffZone ? Number(selectedDropoffZone.latitude) : undefined,
      dropoffLng: selectedDropoffZone ? Number(selectedDropoffZone.longitude) : undefined,
    };

    api('/api/rides/estimate', {
      method: 'POST',
      auth: true,
      body,
    })
      .then((data) => setEstimate(data))
      .catch(() => setEstimate(null))
      .finally(() => setEstimateLoading(false));
  }, [pickupZoneId, dropoffZoneId, seats]);

  // Request ride handler
  async function handleRequestRide(e) {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);
    try {
      await api('/api/rides/requests', {
        method: 'POST',
        auth: true,
        body: {
          pickupZoneId,
          dropoffZoneId,
          seats: Number(seats),
          pickupLat: selectedPickupZone ? Number(selectedPickupZone.latitude) : undefined,
          pickupLng: selectedPickupZone ? Number(selectedPickupZone.longitude) : undefined,
          dropoffLat: selectedDropoffZone ? Number(selectedDropoffZone.latitude) : undefined,
          dropoffLng: selectedDropoffZone ? Number(selectedDropoffZone.longitude) : undefined,
        },
      });
      setSuccessMsg('Ride requested! Looking for a Tesla with available seats...');
      await fetchActive();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to request ride.');
    } finally {
      setSubmitting(false);
    }
  }

  // Cancel ride handler
  async function handleCancelRide() {
    if (!activeRide?.request_id) return;
    if (!window.confirm('Are you sure you want to cancel this ride request?')) return;
    setCancelling(true);
    setErrorMsg('');
    try {
      await api(`/api/rides/requests/${activeRide.request_id}/cancel`, {
        method: 'POST',
        auth: true,
      });
      setSuccessMsg('Ride request cancelled.');
      await fetchActive();
      await fetchHistory();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to cancel ride.');
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="dashboard-grid">
      {/* Left Column: Request Ride or Active Ride */}
      <div className="dashboard-col full-width-booking">
        {errorMsg && <div className="alert">{errorMsg}</div>}
        {successMsg && <div className="success">{successMsg}</div>}

        {activeRide ? (
          <div className="card active-ride-card">
            <div className="card-header">
              <span className="eyebrow">Active Ride Tracker</span>
              <span className={`status-badge status-${activeRide.ride_status || activeRide.request_status}`}>
                {activeRide.ride_status ? activeRide.ride_status.toUpperCase() : activeRide.request_status.toUpperCase()}
              </span>
            </div>

            <h3>
              {activeRide.pickup_zone_name} ➔ {activeRide.dropoff_zone_name}
            </h3>

            {/* In-Trip / Matched Map View for Passenger */}
            <div className="active-map-section">
              <RideMap
                mode="passenger-active"
                height="280px"
                pickup={{
                  lat: Number(activeRide.pickup_lat),
                  lng: Number(activeRide.pickup_lng),
                  label: activeRide.pickup_zone_name,
                }}
                dropoff={{
                  lat: Number(activeRide.dropoff_lat),
                  lng: Number(activeRide.dropoff_lng),
                  label: activeRide.dropoff_zone_name,
                }}
              />
            </div>

            <div className="ride-meta-grid" style={{ marginTop: '16px' }}>
              <div className="meta-item">
                <span className="meta-label">Seats Booked</span>
                <span className="meta-val">👤 {activeRide.seats} {activeRide.seats > 1 ? 'seats' : 'seat'}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Your Fare</span>
                <span className="meta-val highlight-fare">
                  {((activeRide.actual_fare_paisa || activeRide.estimated_fare_paisa) / 100).toFixed(2)} BDT
                </span>
              </div>
            </div>

            {activeRide.request_status === 'waiting' && !activeRide.ride_id && (
              <div className="waiting-box">
                <div className="spinner"></div>
                <p>Finding a nearby Tesla in your direction... Please wait.</p>
              </div>
            )}

            {activeRide.ride_id && (
              <div className="vehicle-info-box">
                <div className="vehicle-header">
                  <strong>🚗 {activeRide.tesla_name || 'Dhaka Tesla'}</strong>
                  <span className="capacity-pill">
                    Occupied: {activeRide.occupied_seats} / {activeRide.tesla_capacity} seats
                  </span>
                </div>
                <p className="driver-detail">
                  Driver: <strong>{activeRide.driver_name}</strong> {activeRide.driver_phone && `(${activeRide.driver_phone})`}
                </p>

                {activeRide.ride_status === 'matched' && (
                  <p className="stage-note">Driver matched! Heading to pickup zone.</p>
                )}
                {activeRide.ride_status === 'driver_arrived' && (
                  <p className="stage-note stage-arrived">📍 Driver has arrived at {activeRide.pickup_zone_name}!</p>
                )}
                {activeRide.ride_status === 'started' && (
                  <p className="stage-note stage-started">⚡ Trip in progress! Relax and enjoy your Tesla pool ride.</p>
                )}
              </div>
            )}

            {['waiting', 'matched', 'driver_arrived'].includes(activeRide.ride_status || activeRide.request_status) && (
              <button
                type="button"
                className="danger-btn"
                disabled={cancelling}
                onClick={handleCancelRide}
              >
                {cancelling ? 'Cancelling...' : 'Cancel Request'}
              </button>
            )}
          </div>
        ) : (
          <div className="card booking-card">
            <span className="eyebrow">Request a Shared Tesla</span>
            <h2>Book Your Pool Seat</h2>

            {/* Side-by-Side: Form Controls on Left, Interactive Map on Right */}
            <div className="booking-side-by-side">
              <div className="booking-form-col">
                <form onSubmit={handleRequestRide}>
                  <div className="field">
                    <label>Pickup Zone</label>
                    <select
                      value={pickupZoneId}
                      onChange={(e) => setPickupZoneId(e.target.value)}
                      required
                    >
                      <option value="">Select pickup zone</option>
                      {zones.map((z) => (
                        <option key={z.id} value={z.id} disabled={z.id === dropoffZoneId}>
                          {z.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <label>Destination Zone</label>
                    <select
                      value={dropoffZoneId}
                      onChange={(e) => setDropoffZoneId(e.target.value)}
                      required
                    >
                      <option value="">Select destination zone</option>
                      {zones.map((z) => (
                        <option key={z.id} value={z.id} disabled={z.id === pickupZoneId}>
                          {z.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <label>Seats Needed</label>
                    <select
                      value={seats}
                      onChange={(e) => setSeats(Number(e.target.value))}
                    >
                      <option value={1}>1 Passenger (Solo Seat)</option>
                      <option value={2}>2 Passengers</option>
                      <option value={3}>3 Passengers (Entire Bullet Tesla)</option>
                    </select>
                  </div>

                  {estimate && (
                    <div className="estimate-box">
                      <div className="estimate-header">
                        <span>Distance: ~{estimate.distanceKm} km</span>
                        <span className="pool-badge">Pool Discount (20% OFF)</span>
                      </div>
                      <div className="estimate-breakdown">
                        <div>Base fare: {estimate.pooledFare.baseFareBDT} BDT</div>
                        <div>Distance: {estimate.pooledFare.distanceChargeBDT} BDT</div>
                        <div className="discount-text">- {estimate.pooledFare.poolDiscountBDT} BDT</div>
                      </div>
                      <div className="estimate-total">
                        <span>Estimated Fare:</span>
                        <span className="fare-number">{estimate.estimatedFareBDT} BDT</span>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting || !pickupZoneId || !dropoffZoneId || pickupZoneId === dropoffZoneId}
                  >
                    {submitting ? 'Requesting...' : 'Request Tesla Pool Ride'}
                  </button>
                </form>
              </div>

              {/* Side-by-Side Map Column: Route Preview */}
              <div className="booking-map-col">
                <div className="map-col-header">
                  <div>
                    <strong>🗺️ Route Preview</strong>
                    <div className="muted-small">
                      {selectedPickupZone && selectedDropoffZone
                        ? `${selectedPickupZone.name} ➔ ${selectedDropoffZone.name}`
                        : 'Select pickup & drop-off locations to preview route'}
                    </div>
                  </div>
                  {selectedPickupZone && selectedDropoffZone && (
                    <span className="zone-tag">
                      {selectedPickupZone.name} ➔ {selectedDropoffZone.name}
                    </span>
                  )}
                </div>

                <RideMap
                  mode="passenger-select"
                  height="360px"
                  pickup={
                    selectedPickupZone
                      ? {
                          lat: Number(selectedPickupZone.latitude),
                          lng: Number(selectedPickupZone.longitude),
                          label: selectedPickupZone.name,
                        }
                      : null
                  }
                  dropoff={
                    selectedDropoffZone
                      ? {
                          lat: Number(selectedDropoffZone.latitude),
                          lng: Number(selectedDropoffZone.longitude),
                          label: selectedDropoffZone.name,
                        }
                      : null
                  }
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Trip History */}
      <div className="dashboard-col full-width-history">
        <div className="card history-card">
          <span className="eyebrow">Trip History</span>
          <h2>Your Rides</h2>
          {history.length === 0 ? (
            <p className="muted">No past rides yet.</p>
          ) : (
            <div className="history-list">
              {history.map((item) => (
                <div key={item.request_id} className="history-item">
                  <div className="history-route">
                    <strong>{item.pickup_zone_name} ➔ {item.dropoff_zone_name}</strong>
                    <span className={`status-pill pill-${item.ride_status || item.request_status}`}>
                      {item.ride_status || item.request_status}
                    </span>
                  </div>
                  <div className="history-meta">
                    <span>{item.seats} seat(s) · {item.tesla_name || 'Tesla'}</span>
                    <span className="history-fare">
                      {((item.final_fare_paisa || item.estimated_fare_paisa) / 100).toFixed(2)} BDT
                    </span>
                  </div>
                  <div className="history-date">
                    {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
