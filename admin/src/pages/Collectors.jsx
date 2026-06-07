import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../api/api';
import { Loader2, Award, Compass } from 'lucide-react';

const Collectors = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Modal states for editing dispatch options
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [serviceArea, setServiceArea] = useState(5);
  const [vehicleType, setVehicleType] = useState('bicycle');
  const [isAvailable, setIsAvailable] = useState(true);

  const fetchCollectorProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getCollectorProfiles();
      setProfiles(res || []);
    } catch (err) {
      console.error('Error fetching collector profiles:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      await fetchCollectorProfiles();
    })();
    return () => { mounted = false; };
  }, [fetchCollectorProfiles]);

  const handleApprovalToggle = async (profile) => {
    setActionLoading(true);
    try {
      const updated = await adminAPI.updateCollectorProfile(profile._id, {
        approved_by_admin: !profile.approved_by_admin
      });
      setProfiles(profiles.map(p => p._id === profile._id ? { ...p, approved_by_admin: updated.approved_by_admin } : p));
    } catch (err) {
      console.error('Error updating approval status:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenEditModal = (profile) => {
    setSelectedProfile(profile);
    setServiceArea(profile.service_area_km || 5);
    setVehicleType(profile.vehicle_type || 'bicycle');
    setIsAvailable(profile.is_available ?? true);
    setShowEditModal(true);
  };

  const handleSaveProfileSettings = async () => {
    if (!selectedProfile) return;
    setActionLoading(true);
    try {
      const updated = await adminAPI.updateCollectorProfile(selectedProfile._id, {
        service_area_km: serviceArea,
        vehicle_type: vehicleType,
        is_available: isAvailable
      });
      setProfiles(profiles.map(p => p._id === selectedProfile._id ? { 
        ...p, 
        service_area_km: updated.service_area_km,
        vehicle_type: updated.vehicle_type,
        is_available: updated.is_available
      } : p));
      setShowEditModal(false);
      setSelectedProfile(null);
    } catch (err) {
      console.error('Error saving profile dispatch settings:', err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Page Header */}
      <div>
        <h1 style={{ fontSize: '2rem', margin: 0 }}>Collector Profiles</h1>
  <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>Verify field agents, assign regional service limits, and track dispatch status</p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Loader2 size={36} className="animate-spin" style={{ color: '#10b981' }} />
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Collector Name</th>
                <th>Contact Info</th>
                <th>Vehicle Configuration</th>
                <th>Coverage Radius</th>
                <th>Availability</th>
                <th>Verification</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {profiles.length > 0 ? (
                profiles.map((profile) => (
                  <tr key={profile._id}>
                    {/* Collector Name */}
                    <td style={{ fontWeight: 600 }}>
                      {profile.user_id?.full_name || 'Guest User'}
                    </td>
                    
                    {/* Contact Details */}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                        <span>{profile.user_id?.email || '—'}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{profile.user_id?.phone || '—'}</span>
                      </div>
                    </td>

                    {/* Vehicle Type */}
                    <td style={{ textTransform: 'capitalize', fontWeight: 500 }}>
                      {profile.vehicle_type || 'bicycle'}
                    </td>

                    {/* Coverage Area */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Compass size={16} style={{ color: '#10b981' }} />
                        <span>{profile.service_area_km || 5} km</span>
                      </div>
                    </td>

                    {/* Dispatch Availability */}
                    <td>
                      <span className={`badge badge-${profile.is_available ? 'success' : 'danger'}`}>
                        {profile.is_available ? 'On Duty' : 'Off Duty'}
                      </span>
                    </td>

                    {/* Admin Approval Switch */}
                    <td>
                      <button
                        onClick={() => handleApprovalToggle(profile)}
                        className={`btn ${profile.approved_by_admin ? 'btn-secondary' : 'btn-primary'}`}
                        style={{
                          padding: '0.35rem 0.75rem',
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          backgroundColor: profile.approved_by_admin ? 'rgba(16, 185, 129, 0.1)' : undefined,
                          borderColor: profile.approved_by_admin ? 'rgba(16, 185, 129, 0.2)' : undefined,
                          color: profile.approved_by_admin ? '#10b981' : undefined
                        }}
                        disabled={actionLoading}
                      >
                        {profile.approved_by_admin ? (
                          <>
                            <Award size={14} /> Approved
                          </>
                        ) : (
                          <>
                            Verify Agent
                          </>
                        )}
                      </button>
                    </td>

                    {/* Update settings */}
                    <td>
                      <button 
                        onClick={() => handleOpenEditModal(profile)}
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                      >
                        Configure
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                    No collector profile records found in DB.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Dispatch Capacity Modal */}
      {showEditModal && selectedProfile && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>Configure Agent Dispatch Metrics</h3>
              <button 
                onClick={() => { setShowEditModal(false); setSelectedProfile(null); }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.25rem' }}
              >
                &times;
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              <div className="form-group">
                <label className="form-label">Service Area Boundary (km radius)</label>
                <input
                  type="number"
                  className="form-control"
                  value={serviceArea}
                  onChange={(e) => setServiceArea(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                  max="100"
                  disabled={actionLoading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Vehicle Type</label>
                <select
                  className="form-control"
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  disabled={actionLoading}
                >
                  <option value="bicycle">Bicycle (Eco Standard)</option>
                  <option value="e_bike">Electric Bike</option>
                  <option value="motorcycle">Motorcycle</option>
                  <option value="pickup_truck">Pickup Truck</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="availability_check"
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  disabled={actionLoading}
                />
                <label htmlFor="availability_check" style={{ fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer' }}>
                  Agent is On-Duty & Available for Auto-Routing / Dispatch Assignment
                </label>
              </div>

            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={() => { setShowEditModal(false); setSelectedProfile(null); }}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleSaveProfileSettings}
                disabled={actionLoading}
              >
                {actionLoading ? 'Saving...' : 'Save Dispatch Options'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Collectors;
