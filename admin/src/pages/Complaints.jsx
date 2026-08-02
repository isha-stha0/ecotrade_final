import { useState, useEffect, useCallback } from 'react';
import { complaintAPI, feedbackAPI } from '../api/api';
import { Loader2, MessageSquare, AlertTriangle, CheckCircle, Reply } from 'lucide-react';

const issueLabels = {
  collector_no_show: 'Collector no-show',
  wrong_weight: 'Wrong scrap weight',
  payment_issue: 'Payment issue',
  product_defect: 'Product defect',
  late_delivery: 'Late delivery',
  app_bug: 'App bug',
  other: 'Other',
};

const Complaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('complaints'); // 'complaints' or 'feedback'
  const [actionLoading, setActionLoading] = useState(false);

  // Forms states
  const [selectedItem, setSelectedItem] = useState(null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolutionText, setResolutionText] = useState('');
  
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyText, setReplyText] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'complaints') {
        const res = await complaintAPI.getComplaints();
        setComplaints(res || []);
      } else {
        const res = await feedbackAPI.getFeedback();
        setFeedback(res || []);
      }
    } catch (err) {
      console.error('Error fetching feedback/complaints data:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      await fetchData();
    })();
    return () => { mounted = false; };
  }, [fetchData]);

  const handleOpenResolve = (comp) => {
    setSelectedItem(comp);
    setResolutionText(comp.admin_response || comp.resolution || '');
    setShowResolveModal(true);
  };

  const handleResolveComplaint = async (e) => {
    e.preventDefault();
    if (!selectedItem || !resolutionText) return;
    setActionLoading(true);
    try {
      await complaintAPI.resolveComplaint(selectedItem._id, resolutionText);
      fetchData();
      setShowResolveModal(false);
      setSelectedItem(null);
    } catch (err) {
      console.error('Error resolving complaint:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenReply = (feed) => {
    setSelectedItem(feed);
    setReplyText(feed.admin_reply || feed.adminReply || '');
    setShowReplyModal(true);
  };

  const handleReplyFeedback = async (e) => {
    e.preventDefault();
    if (!selectedItem || !replyText) return;
    setActionLoading(true);
    try {
      await feedbackAPI.replyFeedback(selectedItem._id, replyText);
      fetchData();
      setShowReplyModal(false);
      setSelectedItem(null);
    } catch (err) {
      console.error('Error replying to feedback:', err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Page Header */}
      <div>
        <h1 style={{ fontSize: '2rem', margin: 0 }}>Community Feedback & Complaints</h1>
  <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>Review submitted customer complaints, check user satisfaction ratings, and submit resolution responses</p>
      </div>

      {/* Tabs Row */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--muted-border)',
        gap: '2rem'
      }}>
        <button
          onClick={() => setActiveTab('complaints')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'complaints' ? '2px solid #10b981' : '2px solid transparent',
            color: activeTab === 'complaints' ? 'var(--text-main)' : 'var(--text-muted)',
            padding: '0.75rem 0.25rem',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s ease'
          }}
        >
          <AlertTriangle size={18} style={{ color: activeTab === 'complaints' ? '#10b981' : undefined }} />
          Customer Complaints ({complaints.length})
        </button>
        <button
          onClick={() => setActiveTab('feedback')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'feedback' ? '2px solid #10b981' : '2px solid transparent',
            color: activeTab === 'feedback' ? 'var(--text-main)' : 'var(--text-muted)',
            padding: '0.75rem 0.25rem',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s ease'
          }}
        >
          <MessageSquare size={18} style={{ color: activeTab === 'feedback' ? '#10b981' : undefined }} />
          User Feedback ({feedback.length})
        </button>
      </div>

      {/* Tab Contents */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Loader2 size={36} className="animate-spin" style={{ color: 'var(--primary)' }} />
        </div>
      ) : activeTab === 'complaints' ? (
        /* tab 1: complaints */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {complaints.length > 0 ? (
            complaints.map((comp) => {
              const issueType = comp.issue_type || comp.category || 'other';
              const subject = comp.title || issueLabels[issueType] || issueType;
              const resolution = comp.admin_response || comp.resolution;
              return (
              <div key={comp._id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span className={`badge badge-${comp.status === 'resolved' ? 'success' : 'pending'}`}>
                      {comp.status}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Category: <strong>{issueLabels[issueType] || issueType}</strong>
                    </span>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Placed: {new Date(comp.createdAt).toLocaleString()}
                  </span>
                </div>

                <div style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>
                  <strong>Subject: {subject}</strong>
                  <p style={{ color: 'var(--text-main)', margin: '0.35rem 0 0 0', lineHeight: 1.5 }}>{comp.description}</p>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                  Submitted by: <strong>{comp.user_id?.full_name || 'Guest User'}</strong> ({comp.user_id?.email || '—'})
                </div>

                {resolution ? (
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.05)',
                    border: '1px solid rgba(16, 185, 129, 0.1)',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem',
                    fontSize: '0.875rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981', fontWeight: 600, marginBottom: '0.25rem' }}>
                      <CheckCircle size={16} /> Resolution Logs:
                    </div>
                    <span style={{ color: 'var(--text-main)' }}>{resolution}</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleOpenResolve(comp)}
                    className="btn btn-primary"
                    style={{ alignSelf: 'flex-start', padding: '0.45rem 1rem', fontSize: '0.85rem' }}
                    disabled={actionLoading}
                  >
                    Resolve Complaint
                  </button>
                )}

              </div>
              );
            })
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              No complaints filed yet.
            </div>
          )}
        </div>
      ) : (
        /* tab 2: feedback */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {feedback.length > 0 ? (
            feedback.map((feed) => (
              <div key={feed._id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {/* Stars visual display */}
                    <div style={{ display: 'flex', gap: '0.1rem' }}>
                      {[...Array(5)].map((_, i) => (
                        <span 
                          key={i} 
                          style={{ 
                            color: i < (feed.rating || 5) ? '#f59e0b' : 'rgba(255,255,255,0.1)',
                            fontSize: '1.1rem' 
                          }}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8', marginLeft: '0.5rem' }}>
                      ({feed.rating || 5} Stars)
                    </span>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    Posted: {new Date(feed.createdAt).toLocaleString()}
                  </span>
                </div>

                <p style={{ color: '#e2e8f0', margin: 0, fontSize: '0.925rem', lineHeight: 1.5 }}>
                  {feed.message}
                </p>

                <div style={{ fontSize: '0.8rem', color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '0.5rem' }}>
                  Submitted by: <strong>{feed.user_id?.full_name || 'Guest User'}</strong> ({feed.user_id?.email || '—'})
                </div>

                {(feed.admin_reply || feed.adminReply) ? (
                  <div style={{
                    background: 'rgba(99, 102, 241, 0.05)',
                    border: '1px solid rgba(99, 102, 241, 0.1)',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem',
                    fontSize: '0.875rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#6366f1', fontWeight: 600, marginBottom: '0.25rem' }}>
                      <Reply size={16} /> Admin Reply:
                    </div>
                    <span style={{ color: '#e2e8f0' }}>{feed.admin_reply || feed.adminReply}</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleOpenReply(feed)}
                    className="btn btn-secondary"
                    style={{ alignSelf: 'flex-start', padding: '0.45rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    disabled={actionLoading}
                  >
                    <Reply size={14} /> Reply Feedback
                  </button>
                )}

              </div>
            ))
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
              No user reviews logged yet.
            </div>
          )}
        </div>
      )}

      {/* Resolve Complaint Modal */}
      {showResolveModal && selectedItem && (
        <div className="modal-overlay">
          <div className="modal-content">
            <form onSubmit={handleResolveComplaint}>
              <div className="modal-header">
                <h3 style={{ margin: 0 }}>Resolve Complaint Log</h3>
                <button 
                  type="button"
                  onClick={() => { setShowResolveModal(false); setSelectedItem(null); }}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.25rem' }}
                >
                  &times;
                </button>
              </div>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: 0 }}>
                  Enter resolution statement for complaint: <strong style={{ color: '#ffffff' }}>"{selectedItem.title || issueLabels[selectedItem.issue_type] || selectedItem.issue_type || 'Complaint'}"</strong>.
                </p>

                <div className="form-group">
                  <label className="form-label">Resolution Actions</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    value={resolutionText}
                    onChange={(e) => setResolutionText(e.target.value)}
                    placeholder="Provide details on how the issue was resolved..."
                    style={{ resize: 'none' }}
                    required
                    disabled={actionLoading}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button"
                  className="btn btn-secondary" 
                  onClick={() => { setShowResolveModal(false); setSelectedItem(null); }}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Saving...' : 'Resolve Complaint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reply Feedback Modal */}
      {showReplyModal && selectedItem && (
        <div className="modal-overlay">
          <div className="modal-content">
            <form onSubmit={handleReplyFeedback}>
              <div className="modal-header">
                <h3 style={{ margin: 0 }}>Reply Feedback Review</h3>
                <button 
                  type="button"
                  onClick={() => { setShowReplyModal(false); setSelectedItem(null); }}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.25rem' }}
                >
                  &times;
                </button>
              </div>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: 0 }}>
                  Write response review comment to: <strong style={{ color: '#ffffff' }}>{selectedItem.user_id?.full_name}</strong>.
                </p>

                <div className="form-group">
                  <label className="form-label">Response Comment</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write administrative review response..."
                    style={{ resize: 'none' }}
                    required
                    disabled={actionLoading}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button"
                  className="btn btn-secondary" 
                  onClick={() => { setShowReplyModal(false); setSelectedItem(null); }}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Replying...' : 'Send Response'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Complaints;
