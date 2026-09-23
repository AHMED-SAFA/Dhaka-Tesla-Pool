import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function DriverDashboard({ user }) {
  const [tesla, setTesla] = useState(null);
  const [activeRide, setActiveRide] = useState(null);
  const [queue, setQueue] = useState({ requests: [], remainingSeats: 3 });

  const [togglingStatus, setTogglingStatus] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [acceptingId, setAcceptingId] = useState(null);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [history, setHistory] = useState([]);

  // Load Tesla profile
  const fetchTesla = async () => {
    try {
      const data = await api('/api/drivers/tesla', { auth: true });
      setTesla(data.tesla);
    } catch (e) {
      console.error('Failed to load Tesla', e);
    }
  };

  // Load Active Ride & Available Queue
  const fetchRideAndQueue = async () => {
    try {
      const [rideData, queueData] = await Promise.all([
        api('/api/drivers/active-ride', { auth: true }),
        api('/api/drivers/available-requests', { auth: true }),
      ]);
      setActiveRide(rideData.activeRide);
      setQueue(queueData);
    } catch (e) {
      console.error('Polling error', e);
    }
  };

  const fetchHistory = async () => {
    try {
      const data = await api('/api/drivers/history', { auth: true });
      setHistory(data.history || []);
    } catch (e) {
      console.error('Failed to fetch history', e);
    }
  };

  useEffect(() => {
    fetchTesla();
    fetchRideAndQueue();
    fetchHistory();
    const interval = setInterval(() => {
      fetchRideAndQueue();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Toggle Online / Offline
  async function handleToggleStatus() {
    if (!tesla) return;
    setTogglingStatus(true);
    setErrorMsg('');
    setSuccessMsg('');
    const nextStatus = tesla.ops_status === 'online' ? 'offline' : 'online';
    try {
      const res = await api('/api/drivers/status', {
        method: 'POST',
        auth: true,
        body: { status: nextStatus },
      });
      setTesla(res.tesla);
      setSuccessMsg(`Status updated: You are now ${nextStatus.toUpperCase()}`);
      await fetchRideAndQueue();
    } catch (e) {
      setErrorMsg(e.message || 'Failed to update status');
    } finally {
      setTogglingStatus(false);
    }
  }

  // Accept a passenger request into the Tesla pool
  async function handleAccept(requestId) {
    setAcceptingId(requestId);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await api('/api/drivers/rides/accept', {
        method: 'POST',
        auth: true,
        body: { requestId },
      });
      setSuccessMsg(res.message || 'Passenger added to pool!');
      await fetchRideAndQueue();
      await fetchTesla();
    } catch (e) {
      setErrorMsg(e.message || 'Failed to accept ride');
    } finally {
      setAcceptingId(null);
    }
  }

  // Progress Ride Lifecycle
  async function handleTransition(action) {
    setTransitioning(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await api('/api/drivers/rides/transition', {
        method: 'POST',
        auth: true,
        body: { action },
      });
      setSuccessMsg(res.message);
      await fetchRideAndQueue();
      await fetchTesla();
      await fetchHistory();
    } catch (e) {
      setErrorMsg(e.message || 'Action failed');
    } finally {
      setTransitioning(false);
    }
  }

  const remainingCapacity = tesla
    ? activeRide
      ? Math.max(0, tesla.capacity - activeRide.occupied_seats)
      : tesla.capacity
    : 0;

  return (
    <div className="dashboard-grid">
      {/* Left Column: Driver & Tesla Control + Active Pool */}
      <div className="dashboard-col">
        {errorMsg && <div className="alert">{errorMsg}</div>}
        {successMsg && <div className="success">{successMsg}</div>}

        {/* Tesla Vehicle & Status Card */}
        {tesla && (
          <div className="card tesla-card">
            <div className="card-header">
              <span className="eyebrow">Your Tesla Vehicle</span>
              <span className={`status-badge status-${tesla.ops_status}`}>
                {tesla.ops_status.toUpperCase()}
              </span>
            </div>

            <div className="tesla-info">
              <h2>⚡ {tesla.name}</h2>
              <p className="muted">
                Fixed Vehicle Capacity: <strong>{tesla.capacity} Seats</strong>
              </p>
            </div>

            <button
              type="button"
              className={tesla.ops_status === 'online' ? 'ghost' : 'online-btn'}
              disabled={togglingStatus || tesla.ops_status === 'on_trip'}
              onClick={handleToggleStatus}
            >
              {togglingStatus
                ? 'Updating…'
                : tesla.ops_status === 'online'
                ? 'Go Offline'
                : 'Go Online'}
            </button>
            {tesla.ops_status === 'on_trip' && (
              <p className="note-small">Currently on trip. Complete the ride to change status.</p>
            )}
          </div>
        )}

        {/* Active Pool & Trip Lifecycle Card */}
        {activeRide ? (
          <div className="card active-pool-card">
            <div className="card-header">
              <span className="eyebrow">Active Pool & Trip</span>
              <span className={`status-badge status-${activeRide.status}`}>
                {activeRide.status.toUpperCase()}
              </span>
            </div>

            {/* Capacity Meter */}
            <div className="capacity-meter">
              <div className="capacity-label">
                <span>Occupancy</span>
                <strong>
                  {activeRide.occupied_seats} / {activeRide.tesla_capacity} Seats Occupied ({remainingCapacity} free)
                </strong>
              </div>
              <div className="meter-bar">
                <div
                  className="meter-fill"
                  style={{
                    width: `${Math.min(100, (activeRide.occupied_seats / activeRide.tesla_capacity) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Passengers currently on board */}
            <h4>Passengers in this Pool ({activeRide.passengers?.length || 0}):</h4>
            <div className="passenger-pool-list">
              {activeRide.passengers?.map((p) => (
                <div key={p.ride_passenger_id} className="pool-passenger-item">
                  <div className="passenger-name-row">
                    <strong>👤 {p.passenger_name}</strong>
                    <span className="badge-seat">{p.seats} seat(s)</span>
                  </div>
                  <div className="passenger-route">
                    {p.pickup_zone_name} ➔ {p.dropoff_zone_name}
                  </div>
                  <div className="passenger-fare">
                    Fare: {(p.fare_paisa / 100).toFixed(2)} BDT
                  </div>
                </div>
              ))}
            </div>

            {/* Lifecycle Transition Buttons */}
            <div className="lifecycle-actions">
              {activeRide.status === 'matched' && (
                <button
                  type="button"
                  disabled={transitioning}
                  onClick={() => handleTransition('arrive')}
                >
                  📍 Mark Driver Arrived at Pickup
                </button>
              )}

              {activeRide.status === 'driver_arrived' && (
                <button
                  type="button"
                  disabled={transitioning}
                  onClick={() => handleTransition('start')}
                >
                  🚀 Start Trip
                </button>
              )}

              {activeRide.status === 'started' && (
                <button
                  type="button"
                  disabled={transitioning}
                  onClick={() => handleTransition('complete')}
                >
                  🏁 Complete Trip & Settle Fares
                </button>
              )}

              {['matched', 'driver_arrived'].includes(activeRide.status) && (
                <button
                  type="button"
                  className="danger-btn ghost"
                  disabled={transitioning}
                  onClick={() => handleTransition('cancel')}
                >
                  Cancel Trip
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="card empty-pool-card">
            <span className="eyebrow">Active Pool</span>
            <p className="muted">No active ride right now. When you accept ride requests, your shared pool will appear here.</p>
          </div>
        )}
      </div>

      {/* Right Column: Available Ride Requests Queue */}
      <div className="dashboard-col">
        <div className="card queue-card">
          <div className="card-header">
            <span className="eyebrow">Live Ride Requests</span>
            <span className="capacity-pill">
              {remainingCapacity} seat(s) available
            </span>
          </div>
          <h2>Available Dhaka Requests</h2>

          {tesla?.ops_status === 'offline' ? (
            <p className="muted">You are currently offline. Click <strong>"Go Online"</strong> to see waiting passengers and accept rides.</p>
          ) : queue.requests.length === 0 ? (
            <div className="empty-queue">
              <p className="muted">No waiting ride requests at this moment. Looking for passengers...</p>
            </div>
          ) : (
            <div className="queue-list">
              {queue.requests.map((req) => {
                const canFit = req.seats <= remainingCapacity;
                return (
                  <div key={req.id} className={`queue-item ${req.isCompatible ? 'compatible-border' : ''}`}>
                    <div className="queue-route-row">
                      <strong>{req.pickup_zone_name} ➔ {req.dropoff_zone_name}</strong>
                      {req.isCompatible && activeRide && (
                        <span className="compatible-badge">✨ Shared Route</span>
                      )}
                    </div>

                    <div className="queue-details">
                      <span>👤 {req.passenger_name} ({req.seats} {req.seats > 1 ? 'seats' : 'seat'})</span>
                      <span className="fare-tag">{(req.estimated_fare_paisa / 100).toFixed(2)} BDT</span>
                    </div>

                    <div className="queue-actions">
                      {canFit ? (
                        <button
                          type="button"
                          className="btn-accept"
                          disabled={acceptingId === req.id}
                          onClick={() => handleAccept(req.id)}
                        >
                          {acceptingId === req.id ? 'Accepting…' : activeRide ? '+ Add to Pool' : 'Accept Ride'}
                        </button>
                      ) : (
                        <button type="button" className="btn-disabled" disabled>
                          Exceeds Capacity (Need {req.seats} seats, {remainingCapacity} left)
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Driver Completed Trips History */}
        <div className="card history-card" style={{ marginTop: '20px' }}>
          <span className="eyebrow">Driver Trip History</span>
          <h2>Completed Trips</h2>
          {history.length === 0 ? (
            <p className="muted">No completed trips yet.</p>
          ) : (
            <div className="history-list">
              {history.map((h) => (
                <div key={h.id} className="history-item">
                  <div className="history-route">
                    <strong>{h.tesla_name}</strong>
                    <span className="status-pill pill-completed">{h.status}</span>
                  </div>
                  <div className="history-meta">
                    <span>{h.passenger_count} passenger(s)</span>
                    <span className="history-fare highlight-fare">Earned: {h.total_fare_bdt} BDT</span>
                  </div>
                  <div className="history-date">
                    {new Date(h.created_at).toLocaleDateString()} {new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
