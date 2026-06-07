import { useState, useEffect } from 'react';
import { scrapAPI, adminAPI } from '../api/api';
import { Loader2, User, Truck, MapPin, Calendar, Award, Eye, ClipboardCheck } from 'lucide-react';

const ScrapRequests = () => {
  const [requests, setRequests] = useState([]);
  const [collectors, setCollectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  
  // Modals / actions states
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedCollectorId, setSelectedCollectorId] = useState('');
  
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [targetStatus, setTargetStatus] = useState('');
  const [pointsAwarded, setPointsAwarded] = useState(0);
  const [quantityActual, setQuantityActual] = useState('');
  
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // hoisted helper functions so useEffect can call them before their definition
  async function fetchRequests() {
    setLoading(true);
    try {
      const res = await scrapAPI.getRequests(statusFilter);
      setRequests(res || []);
    } catch (err) {
      console.error('Error fetching scrap requests:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCollectors() {
    try {
      const res = await adminAPI.getUsers('collector');
      setCollectors(res.users || []);
    } catch (err) {
      console.error('Error fetching collectors for assignment:', err);
    }
  }

  useEffect(() => {
    fetchRequests();
    fetchCollectors();
  }, [statusFilter]);

  const handleOpenAssignModal = (reqObj) => {
    setSelectedRequest(reqObj);
    setSelectedCollectorId(reqObj.collector_id?._id || reqObj.collector_id || '');
    setShowAssignModal(true);
  };

  const handleAssignCollector = async () => {
    if (!selectedRequest || !selectedCollectorId) return;
    setActionLoading(true);
    try {
      await scrapAPI.assignCollector(selectedRequest._id, selectedCollectorId);
      // Refresh requests list
      fetchRequests();
      setShowAssignModal(false);
      setSelectedRequest(null);
    } catch (err) {
      console.error('Error assigning collector:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenStatusModal = (reqObj, status) => {
    setSelectedRequest(reqObj);
    setTargetStatus(status);
    setPointsAwarded(reqObj.points_awarded || reqObj.pointsAwarded || 0);
    setQuantityActual(reqObj.quantity_actual || reqObj.quantity_estimated || reqObj.quantity || '');
    setShowStatusModal(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedRequest) return;
    setActionLoading(true);
    try {
      const qty = quantityActual ? parseFloat(quantityActual) : null;
      await scrapAPI.updateStatus(selectedRequest._id, targetStatus, pointsAwarded, qty);
      fetchRequests();
      setShowStatusModal(false);
      setSelectedRequest(null);
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Page Header */}
      <div>
  <h1 style={{ fontSize: '2rem', margin: 0 }}>Scrap Pickup Requests</h1>
  <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>Assign collectors, inspect materials, award Eco-points, and log recycling completions</p>
      </div>

      {/* Filter Options */}
  <div className="card" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>Filter Status:</span>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { value: '', label: 'All Requests' },
            { value: 'pending', label: 'Pending Assignment' },
            { value: 'assigned', label: 'Assigned / In Progress' },
            { value: 'collected', label: 'Collected / Transporting' },
            { value: 'completed', label: 'Completed' },
            { value: 'cancelled', label: 'Cancelled' }
          ].map((btn) => (
            <button
              key={btn.value}
              onClick={() => setStatusFilter(btn.value)}
              className={`btn ${statusFilter === btn.value ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Requests Directory */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Loader2 size={36} className="animate-spin" style={{ color: '#10b981' }} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {requests.length > 0 ? (
            requests.map((request) => (
              <div key={request._id} className="card scrap-request-card" style={{
                  display: 'grid',
                  gridTemplateColumns: '3fr 2fr',
                  gap: '1.5rem'
                }}>
                
                {/* Left Side: Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span className={`badge badge-${request.status === 'pending' ? 'pending' : (request.status === 'completed' ? 'success' : 'info')}`}>
                      {request.status}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Submitted {new Date(request.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <h3 style={{ textTransform: 'capitalize', fontSize: '1.25rem', margin: 0 }}>
                    {request.category || 'other'} Waste Request — <span style={{ color: 'var(--primary)' }}>{request.quantity_estimated || request.quantity || 0} kg (est)</span>
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', color: 'var(--text-main)', fontSize: '0.925rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <User size={16} style={{ color: 'var(--text-muted)' }} />
                      <span>Submitted by: <strong>{request.user_id?.full_name || 'Guest User'}</strong> ({request.user_id?.phone || 'No Phone'})</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <MapPin size={16} style={{ color: 'var(--text-muted)' }} />
                      <span>Pickup: {request.pickup_address || request.location || '—'}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
                      <span>Preferred Slot: {request.preferred_pickup_time ? new Date(request.preferred_pickup_time).toLocaleString() : 'As soon as possible'}</span>
                    </div>
                  </div>

                  {/* Attachment Images */}
                  {request.photos?.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Inspect Attachments:</span>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {request.photos.map((photo, i) => (
                          <div 
                            key={i} 
                            onClick={() => setPreviewPhotoUrl(photo)}
                            style={{
                              width: '80px',
                              height: '80px',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              border: '1px solid rgba(255,255,255,0.1)',
                              cursor: 'pointer',
                              position: 'relative'
                            }}
                            className="photo-thumbnail"
                          >
                            <img src={photo} alt="waste attachment" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div style={{
                              position: 'absolute',
                              top: 0, left: 0, right: 0, bottom: 0,
                              background: 'rgba(0,0,0,0.4)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              opacity: 0, transition: 'opacity 0.2s ease'
                            }} className="overlay-hover">
                              <Eye size={16} style={{ color: 'var(--bg-card)' }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Side: Dispatch / Actions */}
                <div style={{ 
                  borderLeft: '1px solid var(--border-color)',
                  paddingLeft: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  justifyContent: 'center'
                }} className="dispatch-side">
                  
                  {/* Current Collector status */}
                  <div className="card" style={{ padding: '1rem' }}>
                    <h4 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0 0 0.5rem 0' }}>Assigned Driver</h4>
                    {request.collector_id ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '0.5rem', borderRadius: '8px', color: 'var(--primary)' }}>
                          <Truck size={18} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                            {request.collector_id?.full_name || request.collector_id?.name || 'Collector Agent'}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {request.collector_id?.phone || 'No phone logs'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        No agent assigned yet.
                      </span>
                    )}
                  </div>

                  {/* Actions buttons depending on status */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {request.status === 'pending' && (
                      <button 
                        onClick={() => handleOpenAssignModal(request)}
                        className="btn btn-primary"
                        style={{ flexGrow: 1, fontSize: '0.85rem' }}
                      >
                        Assign Collector
                      </button>
                    )}

                    {request.status === 'assigned' && (
                      <>
                        <button 
                          onClick={() => handleOpenAssignModal(request)}
                          className="btn btn-secondary"
                          style={{ fontSize: '0.85rem' }}
                        >
                          Reassign Agent
                        </button>
                        <button 
                          onClick={() => handleOpenStatusModal(request, 'collected')}
                          className="btn btn-primary"
                          style={{ flexGrow: 1, fontSize: '0.85rem' }}
                        >
                          Confirm Collected
                        </button>
                      </>
                    )}

                    {request.status === 'collected' && (
                      <button 
                        onClick={() => handleOpenStatusModal(request, 'completed')}
                        className="btn btn-primary"
                        style={{ flexGrow: 1, fontSize: '0.85rem' }}
                      >
                        <ClipboardCheck size={16} /> Complete & Issue Points
                      </button>
                    )}

                    {request.status !== 'completed' && request.status !== 'cancelled' && (
                      <button 
                        onClick={() => handleOpenStatusModal(request, 'cancelled')}
                        className="btn btn-danger"
                        style={{ fontSize: '0.85rem' }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

              </div>
            ))
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              No scrap requests found in this category.
            </div>
          )}
        </div>
      )}

      {/* Collector Assignment Modal */}
      {showAssignModal && selectedRequest && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>Assign Collector Agent</h3>
              <button 
                onClick={() => { setShowAssignModal(false); setSelectedRequest(null); }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.25rem' }}
              >
                &times;
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>
                Select an active, verified agent for waste collection from <strong style={{ color: 'var(--text-main)' }}>{selectedRequest.user_id?.full_name}</strong>.
              </p>

              <div className="form-group">
                <label className="form-label">Available Collectors</label>
                <select
                  className="form-control"
                  value={selectedCollectorId}
                  onChange={(e) => setSelectedCollectorId(e.target.value)}
                  disabled={actionLoading}
                >
                  <option value="">Choose Agent...</option>
                  {collectors.map(c => (
                    <option key={c._id} value={c._id}>
                      {c.full_name} ({c.phone || 'No phone info'})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={() => { setShowAssignModal(false); setSelectedRequest(null); }}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleAssignCollector}
                disabled={actionLoading || !selectedCollectorId}
              >
                {actionLoading ? 'Assigning...' : 'Confirm Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status & Points Modal */}
      {showStatusModal && selectedRequest && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>Transition Request Status</h3>
              <button 
                onClick={() => { setShowStatusModal(false); setSelectedRequest(null); }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.25rem' }}
              >
                &times;
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>
                Updating status of {selectedRequest.category} request to <strong style={{ color: '#10b981', textTransform: 'uppercase' }}>{targetStatus}</strong>.
              </p>

              <div className="form-group">
                <label className="form-label">Actual Measured Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-control"
                  value={quantityActual}
                  onChange={(e) => setQuantityActual(e.target.value)}
                  placeholder="e.g. 15.5"
                  disabled={actionLoading}
                />
              </div>

              {targetStatus === 'completed' && (
                <div className="form-group">
                  <label className="form-label">Points to Award</label>
                  <div style={{ position: 'relative' }}>
                    <Award size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#10b981' }} />
                    <input
                      type="number"
                      className="form-control"
                      value={pointsAwarded}
                      onChange={(e) => setPointsAwarded(parseInt(e.target.value) || 0)}
                      style={{ paddingLeft: '2.5rem' }}
                      min="0"
                      disabled={actionLoading}
                    />
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Recommended scale: 10 pts per kg paper, 15 pts plastic, 12 pts glass, 20 pts aluminum.
                  </span>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={() => { setShowStatusModal(false); setSelectedRequest(null); }}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleUpdateStatus}
                disabled={actionLoading}
              >
                {actionLoading ? 'Updating...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Preview Modal */}
      {previewPhotoUrl && (
        <div 
          className="modal-overlay" 
          onClick={() => setPreviewPhotoUrl(null)}
          style={{ zIndex: 1200 }}
        >
          <div 
            style={{ position: 'relative', maxWidth: '80%', maxHeight: '80vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={previewPhotoUrl} 
              alt="attachment preview" 
              style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.15)' }} 
            />
            <button 
              onClick={() => setPreviewPhotoUrl(null)}
              style={{
                position: 'absolute', top: '-1.5rem', right: '-1.5rem',
                background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                color: 'var(--text-main)', fontSize: '1.25rem', width: '32px', height: '32px',
                borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              &times;
            </button>
          </div>
        </div>
      )}

      <style>{`
        .photo-thumbnail:hover .overlay-hover {
          opacity: 1 !important;
        }
        @media (max-width: 768px) {
          .scrap-request-card {
            grid-template-columns: 1fr !important;
          }
          .dispatch-side {
            border-left: none !important;
            border-top: 1px solid rgba(255,255,255,0.05);
            padding-left: 0 !important;
            padding-top: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ScrapRequests;
