import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../api/api';
import { Search, Loader2, ShieldCheck, ShieldAlert, Edit2, Eye, User as UserIcon, Users as UsersIcon, UserCheck, Award, Trash2 } from 'lucide-react';

const emptyForm = {
  full_name: '',
  email: '',
  phone: '',
  address: '',
  is_active: true,
  is_verified: false,
};

const USER_ACCOUNT_ROLES = new Set(['user', 'customer', 'contributor']);

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [profileForm, setProfileForm] = useState(emptyForm);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getUsers();
      const allUsers = res?.users || res || [];
      setUsers(allUsers.filter((user) => USER_ACCOUNT_ROLES.has(user.role || 'user')));
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      await fetchUsers();
    })();
    return () => { mounted = false; };
  }, [fetchUsers]);

  const handleToggleActive = async (id) => {
    try {
      const updated = await adminAPI.toggleUserActive(id);
      setUsers((current) => current.map((u) => (u._id === id ? { ...u, is_active: updated.is_active } : u)));
    } catch (err) {
      console.error('Error toggling active status:', err);
    }
  };

  const openProfileModal = (user) => {
    setSelectedUser(user);
    setProfileForm({
      full_name: user.full_name || '',
      email: user.email || '',
      phone: user.phone || '',
      address: user.address || '',
      is_active: user.is_active ?? true,
      is_verified: user.is_verified ?? false,
    });
    setShowProfileModal(true);
  };

  const handleFormChange = (field, value) => {
    setProfileForm((current) => ({ ...current, [field]: value }));
  };

  const handleSaveProfile = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const updated = await adminAPI.updateUserProfile(selectedUser._id, profileForm);
      setUsers((current) => current.map((u) => (u._id === selectedUser._id ? { ...u, ...updated } : u)));
      setSelectedUser(updated);
      setShowProfileModal(false);
    } catch (err) {
      console.error('Error updating user profile:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (user) => {
    const label = user.full_name || user.email || 'this user';
    if (!window.confirm(`Delete ${label}? This cannot be undone.`)) return;

    setActionLoading(true);
    try {
      await adminAPI.deleteUser(user._id);
      setUsers((current) => current.filter((item) => item._id !== user._id));
      if (selectedUser?._id === user._id) {
        setShowProfileModal(false);
        setSelectedUser(null);
      }
    } catch (err) {
      console.error('Error deleting user:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const needle = searchTerm.toLowerCase();
    return (
      user.full_name?.toLowerCase().includes(needle) ||
      user.email?.toLowerCase().includes(needle) ||
      user.phone?.includes(searchTerm)
    );
  });
  const activeUsers = users.filter((user) => user.is_active !== false).length;
  const verifiedUsers = users.filter((user) => user.is_verified).length;
  const totalPoints = users.reduce((sum, user) => sum + (user.reward_points || user.ecoPoints || 0), 0);

  return (
    <div className="directory-page">
      <section className="directory-hero">
        <div className="directory-hero-copy">
          <span className="directory-eyebrow">Account Management</span>
          <h1>User Accounts</h1>
          <p>Standard customer and contributor profiles with contact details, account status, and reward balances.</p>
        </div>
        <div className="directory-hero-badge">
          <UsersIcon size={20} />
          <span>{filteredUsers.length}</span>
          <small>showing</small>
        </div>
      </section>

      <div className="directory-stats">
        <div className="directory-stat">
          <span className="stat-icon stat-icon-green"><UsersIcon size={18} /></span>
          <div><strong>{users.length}</strong><small>Total accounts</small></div>
        </div>
        <div className="directory-stat">
          <span className="stat-icon stat-icon-blue"><UserCheck size={18} /></span>
          <div><strong>{activeUsers}</strong><small>Active users</small></div>
        </div>
        <div className="directory-stat">
          <span className="stat-icon stat-icon-amber"><ShieldCheck size={18} /></span>
          <div><strong>{verifiedUsers}</strong><small>Verified profiles</small></div>
        </div>
        <div className="directory-stat">
          <span className="stat-icon stat-icon-green"><Award size={18} /></span>
          <div><strong>{totalPoints}</strong><small>Reward points</small></div>
        </div>
      </div>

      <div className="card directory-toolbar">
        <div className="directory-search">
          <Search size={18} />
          <input
            type="text"
            className="form-control"
            placeholder="Search by name, email or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <span className="directory-filter-pill">User, Customer & Contributor</span>
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
                <th>Profile</th>
                <th>Contact</th>
                <th>Reward Points</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user._id} className="directory-row">
                    <td>
                      <div className="profile-cell">
                        <div className="profile-avatar">
                          {user.profile_photo ? <img src={user.profile_photo} alt={user.full_name} /> : <UserIcon size={18} />}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700 }}>{user.full_name || 'Guest User'}</div>
                          <span className="text-muted">{user.is_verified ? 'Verified account' : 'Unverified account'}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="stacked-text">
                        <span>{user.email}</span>
                        <span>{user.phone || 'No phone added'}</span>
                      </div>
                    </td>
                    <td><span className="points-pill">{user.reward_points || user.ecoPoints || 0} pts</span></td>
                    <td>
                      <button
                        onClick={() => handleToggleActive(user._id)}
                        className="status-action"
                        style={{ color: user.is_active ? '#10b981' : '#ef4444' }}
                      >
                        {user.is_active ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
                        {user.is_active ? 'Active' : 'Blocked'}
                      </button>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {user.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'Never'}
                    </td>
                    <td>
                      <div className="table-actions">
                        <button onClick={() => openProfileModal(user)} className="action-icon-btn" title="View profile" disabled={actionLoading}>
                          <Eye size={13} />
                        </button>
                        <button onClick={() => openProfileModal(user)} className="action-icon-btn" title="Edit profile" disabled={actionLoading}>
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => handleDeleteUser(user)} className="action-icon-btn action-icon-danger" title="Delete user" disabled={actionLoading}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                    No user accounts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showProfileModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-content profile-modal">
            <div className="modal-header">
              <div className="profile-cell">
                <div className="profile-avatar profile-avatar-lg">
                  {selectedUser.profile_photo ? <img src={selectedUser.profile_photo} alt={selectedUser.full_name} /> : <UserIcon size={24} />}
                </div>
                <div>
                  <h3 style={{ margin: 0 }}>User Profile</h3>
                  <span className="text-muted">Role: {selectedUser.role || 'user'}</span>
                </div>
              </div>
              <button
                onClick={() => { setShowProfileModal(false); setSelectedUser(null); }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.25rem' }}
              >
                &times;
              </button>
            </div>
            <div className="modal-body profile-form-grid">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-control" value={profileForm.full_name} onChange={(e) => handleFormChange('full_name', e.target.value)} disabled={actionLoading} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-control" type="email" value={profileForm.email} onChange={(e) => handleFormChange('email', e.target.value)} disabled={actionLoading} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-control" value={profileForm.phone} onChange={(e) => handleFormChange('phone', e.target.value)} disabled={actionLoading} />
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <input className="form-control" value={profileForm.address} onChange={(e) => handleFormChange('address', e.target.value)} disabled={actionLoading} />
              </div>
              <label className="toggle-row">
                <input type="checkbox" checked={profileForm.is_active} onChange={(e) => handleFormChange('is_active', e.target.checked)} disabled={actionLoading} />
                Account is active
              </label>
              <label className="toggle-row">
                <input type="checkbox" checked={profileForm.is_verified} onChange={(e) => handleFormChange('is_verified', e.target.checked)} disabled={actionLoading} />
                Account is verified
              </label>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setShowProfileModal(false); setSelectedUser(null); }} disabled={actionLoading}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSaveProfile} disabled={actionLoading}>
                {actionLoading ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
