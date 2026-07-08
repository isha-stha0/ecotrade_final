import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../api/api';
import { Loader2, Award, Compass, Search, Eye, Edit2, Truck, User as UserIcon, ShieldCheck, Clock, Trash2 } from 'lucide-react';

const emptyUserForm = {
  full_name: '',
  email: '',
  phone: '',
  address: '',
  is_active: true,
  is_verified: false,
};

const buildMissingProfile = (user) => ({
  _id: `missing-${user._id}`,
  user_id: user,
  vehicle_type: 'motorcycle',
  service_area_km: 5,
  is_available: true,
  total_collections: 0,
  average_rating: 0,
  approved_by_admin: false,
  isProfileMissing: true,
});

const Collectors = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [userForm, setUserForm] = useState(emptyUserForm);
  const [collectorForm, setCollectorForm] = useState({
    service_area_km: 5,
    vehicle_type: 'motorcycle',
    is_available: true,
    approved_by_admin: false,
  });

  const fetchCollectorProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const [profileRes, userRes] = await Promise.all([
        adminAPI.getCollectorProfiles(),
        adminAPI.getUsers('collector'),
      ]);
      const profileList = profileRes || [];
      const collectorUsers = userRes?.users || userRes || [];
      const profiledUserIds = new Set(profileList.map((profile) => profile.user_id?._id || profile.user_id).filter(Boolean));
      const missingProfiles = collectorUsers
        .filter((user) => !profiledUserIds.has(user._id))
        .map(buildMissingProfile);

      setProfiles([...profileList, ...missingProfiles]);
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
      const userId = profile.user_id?._id || profile.user_id;
      const payload = {
        user_id: userId,
        service_area_km: profile.service_area_km || 5,
        vehicle_type: profile.vehicle_type || 'motorcycle',
        is_available: profile.is_available ?? true,
        approved_by_admin: !profile.approved_by_admin,
      };
      const updated = profile.isProfileMissing
        ? await adminAPI.createCollectorProfile(payload)
        : await adminAPI.updateCollectorProfile(profile._id, payload);

      setProfiles((current) => current.map((p) => (p._id === profile._id ? { ...p, ...updated, isProfileMissing: false } : p)));
    } catch (err) {
      console.error('Error updating approval status:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenEditModal = (profile) => {
    const rider = profile.user_id || {};
    setSelectedProfile(profile);
    setUserForm({
      full_name: rider.full_name || '',
      email: rider.email || '',
      phone: rider.phone || '',
      address: rider.address || '',
      is_active: rider.is_active ?? true,
      is_verified: rider.is_verified ?? false,
    });
    setCollectorForm({
      service_area_km: profile.service_area_km || 5,
      vehicle_type: profile.vehicle_type || 'motorcycle',
      is_available: profile.is_available ?? true,
      approved_by_admin: profile.approved_by_admin ?? false,
    });
    setShowEditModal(true);
  };

  const handleSaveProfileSettings = async () => {
    if (!selectedProfile) return;
    setActionLoading(true);
    try {
      const userId = selectedProfile.user_id?._id || selectedProfile.user_id;
      const [updatedUser, updatedProfile] = await Promise.all([
        userId ? adminAPI.updateUserProfile(userId, userForm) : Promise.resolve(selectedProfile.user_id),
        selectedProfile.isProfileMissing
          ? adminAPI.createCollectorProfile({ ...collectorForm, user_id: userId })
          : adminAPI.updateCollectorProfile(selectedProfile._id, collectorForm),
      ]);

      setProfiles((current) => current.map((profile) => (
        profile._id === selectedProfile._id
          ? { ...profile, ...updatedProfile, user_id: updatedUser || updatedProfile.user_id, isProfileMissing: false }
          : profile
      )));
      setShowEditModal(false);
      setSelectedProfile(null);
    } catch (err) {
      console.error('Error saving collector profile:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCollector = async (profile) => {
    const rider = profile.user_id || {};
    const userId = rider._id || rider;
    const label = rider.full_name || rider.email || 'this collector';
    if (!userId || !window.confirm(`Delete ${label}? This cannot be undone.`)) return;

    setActionLoading(true);
    try {
      await adminAPI.deleteUser(userId);
      setProfiles((current) => current.filter((item) => item._id !== profile._id));
      if (selectedProfile?._id === profile._id) {
        setShowEditModal(false);
        setSelectedProfile(null);
      }
    } catch (err) {
      console.error('Error deleting collector:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredProfiles = profiles.filter((profile) => {
    const rider = profile.user_id || {};
    const needle = searchTerm.toLowerCase();
    return (
      rider.full_name?.toLowerCase().includes(needle) ||
      rider.email?.toLowerCase().includes(needle) ||
      rider.phone?.includes(searchTerm) ||
      profile.vehicle_type?.toLowerCase().includes(needle)
    );
  });
  const onDutyCount = profiles.filter((profile) => profile.is_available).length;
  const approvedCount = profiles.filter((profile) => profile.approved_by_admin).length;
  const setupNeededCount = profiles.filter((profile) => profile.isProfileMissing).length;
  return (
    <div className="directory-page">
      <section className="directory-hero collector-hero">
        <div className="directory-hero-copy">
          <span className="directory-eyebrow">Dispatch Team</span>
          <h1>Collector Rider Profiles</h1>
          <p>Rider account verification, service radius, vehicle setup, and live availability in one place.</p>
        </div>
        <div className="directory-hero-badge">
          <Truck size={20} />
          <span>{filteredProfiles.length}</span>
          <small>showing</small>
        </div>
      </section>

      <div className="directory-stats">
        <div className="directory-stat">
          <span className="stat-icon stat-icon-blue"><Truck size={18} /></span>
          <div><strong>{profiles.length}</strong><small>Total riders</small></div>
        </div>
        <div className="directory-stat">
          <span className="stat-icon stat-icon-green"><Compass size={18} /></span>
          <div><strong>{onDutyCount}</strong><small>On duty</small></div>
        </div>
        <div className="directory-stat">
          <span className="stat-icon stat-icon-green"><ShieldCheck size={18} /></span>
          <div><strong>{approvedCount}</strong><small>Approved</small></div>
        </div>
        <div className="directory-stat">
          <span className="stat-icon stat-icon-amber"><Clock size={18} /></span>
          <div><strong>{setupNeededCount}</strong><small>Need setup</small></div>
        </div>
      </div>

      <div className="card directory-toolbar">
        <div className="directory-search">
          <Search size={18} />
          <input
            type="text"
            className="form-control"
            placeholder="Search riders by name, email, phone or vehicle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <span className="directory-filter-pill directory-filter-pill-blue">Role: Collector</span>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Loader2 size={36} className="animate-spin" style={{ color: '#10b981' }} />
        </div>
      ) : (
        <div className="table-container directory-table">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rider Profile</th>
                <th>Contact Info</th>
                <th>Vehicle</th>
                <th>Availability</th>
                <th>Verification</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProfiles.length > 0 ? (
                filteredProfiles.map((profile) => {
                  const rider = profile.user_id || {};
                  return (
                    <tr key={profile._id} className="directory-row">
                      <td>
                        <div className="profile-cell">
                          <div className="profile-avatar">
                            {rider.profile_photo ? <img src={rider.profile_photo} alt={rider.full_name} /> : <Truck size={18} />}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700 }}>{rider.full_name || 'Collector Rider'}</div>
                            <span className="text-muted">
                              {profile.isProfileMissing ? 'Profile setup needed' : (rider.is_active === false ? 'Blocked account' : 'Active account')}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="stacked-text">
                          <span>{rider.email || 'No email'}</span>
                          <span>{rider.phone || 'No phone added'}</span>
                        </div>
                      </td>
                      <td style={{ textTransform: 'capitalize', fontWeight: 600 }}>{(profile.vehicle_type || 'motorcycle').replace('_', ' ')}</td>
                      <td>
                        <span className={`badge badge-${profile.is_available ? 'success' : 'danger'}`}>
                          {profile.is_available ? 'On Duty' : 'Off Duty'}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => handleApprovalToggle(profile)}
                          className={`btn ${profile.approved_by_admin ? 'btn-secondary' : 'btn-primary'}`}
                          style={{
                            padding: '0.35rem 0.75rem',
                            fontSize: '0.8rem',
                            backgroundColor: profile.approved_by_admin ? 'rgba(16, 185, 129, 0.1)' : undefined,
                            borderColor: profile.approved_by_admin ? 'rgba(16, 185, 129, 0.2)' : undefined,
                            color: profile.approved_by_admin ? '#10b981' : undefined,
                          }}
                          disabled={actionLoading}
                        >
                          {profile.approved_by_admin ? <><Award size={14} /> Approved</> : 'Verify Rider'}
                        </button>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button onClick={() => handleOpenEditModal(profile)} className="action-icon-btn" title="View profile" disabled={actionLoading}>
                            <Eye size={13} />
                          </button>
                          <button onClick={() => handleOpenEditModal(profile)} className="action-icon-btn" title="Edit profile" disabled={actionLoading}>
                            <Edit2 size={13} />
                          </button>
                          <button onClick={() => handleDeleteCollector(profile)} className="action-icon-btn action-icon-danger" title="Delete collector" disabled={actionLoading}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                    No collector rider profiles found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showEditModal && selectedProfile && (
        <div className="modal-overlay">
          <div className="modal-content profile-modal">
            <div className="modal-header">
              <div className="profile-cell">
                <div className="profile-avatar profile-avatar-lg">
                  {selectedProfile.user_id?.profile_photo ? (
                    <img src={selectedProfile.user_id.profile_photo} alt={selectedProfile.user_id.full_name} />
                  ) : (
                    <UserIcon size={24} />
                  )}
                </div>
                <div>
                  <h3 style={{ margin: 0 }}>Collector Profile</h3>
                  <span className="text-muted">Role: collector / rider</span>
                </div>
              </div>
              <button
                onClick={() => { setShowEditModal(false); setSelectedProfile(null); }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.25rem' }}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="profile-form-grid">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-control" value={userForm.full_name} onChange={(e) => setUserForm((current) => ({ ...current, full_name: e.target.value }))} disabled={actionLoading} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-control" type="email" value={userForm.email} onChange={(e) => setUserForm((current) => ({ ...current, email: e.target.value }))} disabled={actionLoading} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-control" value={userForm.phone} onChange={(e) => setUserForm((current) => ({ ...current, phone: e.target.value }))} disabled={actionLoading} />
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <input className="form-control" value={userForm.address} onChange={(e) => setUserForm((current) => ({ ...current, address: e.target.value }))} disabled={actionLoading} />
                </div>
                <div className="form-group">
                  <label className="form-label">Service Area Boundary (km)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={collectorForm.service_area_km}
                    onChange={(e) => setCollectorForm((current) => ({ ...current, service_area_km: Math.max(1, parseInt(e.target.value, 10) || 1) }))}
                    min="1"
                    max="100"
                    disabled={actionLoading}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Vehicle Type</label>
                  <select
                    className="form-control"
                    value={collectorForm.vehicle_type}
                    onChange={(e) => setCollectorForm((current) => ({ ...current, vehicle_type: e.target.value }))}
                    disabled={actionLoading}
                  >
                    <option value="bicycle">Bicycle</option>
                    <option value="motorcycle">Motorcycle</option>
                    <option value="van">Van</option>
                    <option value="truck">Truck</option>
                    <option value="on_foot">On Foot</option>
                  </select>
                </div>
              </div>
              <div className="profile-toggle-grid">
                <label className="toggle-row">
                  <input type="checkbox" checked={userForm.is_active} onChange={(e) => setUserForm((current) => ({ ...current, is_active: e.target.checked }))} disabled={actionLoading} />
                  Account is active
                </label>
                <label className="toggle-row">
                  <input type="checkbox" checked={userForm.is_verified} onChange={(e) => setUserForm((current) => ({ ...current, is_verified: e.target.checked }))} disabled={actionLoading} />
                  Account is verified
                </label>
                <label className="toggle-row">
                  <input type="checkbox" checked={collectorForm.is_available} onChange={(e) => setCollectorForm((current) => ({ ...current, is_available: e.target.checked }))} disabled={actionLoading} />
                  Rider is on duty
                </label>
                <label className="toggle-row">
                  <input type="checkbox" checked={collectorForm.approved_by_admin} onChange={(e) => setCollectorForm((current) => ({ ...current, approved_by_admin: e.target.checked }))} disabled={actionLoading} />
                  Approved by admin
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setShowEditModal(false); setSelectedProfile(null); }} disabled={actionLoading}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSaveProfileSettings} disabled={actionLoading}>
                {actionLoading ? 'Saving...' : 'Save Collector Profile'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Collectors;
