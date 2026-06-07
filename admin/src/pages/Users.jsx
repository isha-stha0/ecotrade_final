import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../api/api';
import { Search, Loader2, ShieldCheck, ShieldAlert, Edit2 } from 'lucide-react';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getUsers(roleFilter);
      // backend returns { users, total } — normalize to an array
      setUsers(res?.users || res || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, [roleFilter]);

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
      setUsers(users.map(u => u._id === id ? { ...u, is_active: updated.is_active } : u));
    } catch (err) {
      console.error('Error toggling active status:', err);
    }
  };

  const handleOpenRoleModal = (user) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setShowRoleModal(true);
  };

  const handleSaveRole = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const updated = await adminAPI.changeUserRole(selectedUser._id, newRole);
      setUsers(users.map(u => u._id === selectedUser._id ? { ...u, role: updated.role } : u));
      setShowRoleModal(false);
      setSelectedUser(null);
    } catch (err) {
      console.error('Error changing user role:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone?.includes(searchTerm)
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: 0 }}>User Directory</h1>
    <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>Manage authorization levels, active sessions, and community points</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search Field */}
        <div style={{ position: 'relative', flexGrow: 1, minWidth: '240px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search by name, email or phone..."
            style={{ paddingLeft: '2.5rem', width: '100%' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Role Select Filter */}
        <div style={{ minWidth: '160px' }}>
          <select 
            className="form-control"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ width: '100%' }}
          >
            <option value="">All Roles</option>
            <option value="user">User</option>
            <option value="collector">Collector</option>
            <option value="admin">Admin</option>
            <option value="customer">Customer</option>
            <option value="contributor">Contributor</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Loader2 size={36} className="animate-spin" style={{ color: '#10b981' }} />
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Email Address</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Reward Points</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user._id}>
                    {/* User profile details */}
                    <td style={{ fontWeight: 600 }}>{user.full_name || 'Guest User'}</td>
                    <td>{user.email}</td>
                    <td>{user.phone || '—'}</td>
                    <td>
                      <span className={`badge badge-${user.role === 'admin' ? 'danger' : (user.role === 'collector' ? 'info' : 'success')}`} style={{ fontSize: '0.7rem' }}>
                        {user.role}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: '#10b981' }}>{user.reward_points || user.ecoPoints || 0} pts</td>
                    <td>
                      <button 
                        onClick={() => handleToggleActive(user._id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          color: user.is_active ? '#10b981' : '#ef4444',
                          fontWeight: 500,
                          fontSize: '0.85rem'
                        }}
                      >
                        {user.is_active ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
                        {user.is_active ? 'Active' : 'Blocked'}
                      </button>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {user.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'Never'}
                    </td>
                    <td>
                      <button 
                        onClick={() => handleOpenRoleModal(user)}
                        className="btn btn-secondary btn-icon"
                        title="Change Role"
                      >
                        <Edit2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                    No users found matching parameters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Role Modification Modal */}
      {showRoleModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>Modify User Authorization Role</h3>
              <button 
                onClick={() => { setShowRoleModal(false); setSelectedUser(null); }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.25rem' }}
              >
                &times;
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>
                Updating role levels changes systems clearance. Modify role settings for <strong style={{ color: 'var(--text-main)' }}>{selectedUser.full_name}</strong>.
              </p>
              
              <div className="form-group">
                <label className="form-label">System Role Assignment</label>
                <select 
                  className="form-control"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  disabled={actionLoading}
                >
                  <option value="user">User (Standard)</option>
                  <option value="collector">Collector (Field Agent)</option>
                  <option value="admin">Admin (System Manager)</option>
                  <option value="customer">Customer (Store Buyer)</option>
                  <option value="contributor">Contributor (Recycling Partner)</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={() => { setShowRoleModal(false); setSelectedUser(null); }}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleSaveRole}
                disabled={actionLoading}
              >
                {actionLoading ? 'Updating...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
