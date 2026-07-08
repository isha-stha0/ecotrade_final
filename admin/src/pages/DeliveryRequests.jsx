import { useCallback, useEffect, useState } from 'react';
import { adminAPI, orderAPI } from '../api/api';
import { ClipboardList, Loader2, MapPin, PackageCheck, Truck, User, CreditCard } from 'lucide-react';

const formatAddress = (address) => {
  if (!address) return 'No shipping address';
  if (typeof address === 'string') return address;
  return [
    address.fullName || address.name,
    address.addressLine || address.street || address.address,
    address.city,
    address.state,
    address.postalCode || address.zip,
    address.phone,
  ].filter(Boolean).join(', ') || JSON.stringify(address);
};

const DeliveryRequests = () => {
  const [orders, setOrders] = useState([]);
  const [collectors, setCollectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedCollectorId, setSelectedCollectorId] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await orderAPI.getOrders(statusFilter);
      setOrders(res.orders || []);
    } catch (err) {
      console.error('Error fetching delivery requests:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const fetchCollectors = useCallback(async () => {
    try {
      const res = await adminAPI.getUsers('collector');
      setCollectors(res.users || []);
    } catch (err) {
      console.error('Error fetching riders:', err);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchCollectors();
  }, [fetchOrders, fetchCollectors]);

  const openAssignModal = (order) => {
    setSelectedOrder(order);
    setSelectedCollectorId(order.delivery_collector_id?._id || order.delivery_collector_id || '');
    setShowAssignModal(true);
  };

  const handleAssignCollector = async () => {
    if (!selectedOrder || !selectedCollectorId) return;
    setActionLoading(true);
    try {
      await orderAPI.assignCollector(selectedOrder._id, selectedCollectorId);
      await fetchOrders();
      setShowAssignModal(false);
      setSelectedOrder(null);
    } catch (err) {
      console.error('Error assigning delivery rider:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusUpdate = async (order, nextStatus) => {
    setActionLoading(true);
    try {
      await orderAPI.updateStatus(order._id, nextStatus, order.payment_status);
      await fetchOrders();
    } catch (err) {
      console.error('Error updating delivery status:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const pendingAssignments = orders.filter((order) => !order.delivery_collector_id && !['delivered', 'cancelled', 'refunded'].includes(order.order_status)).length;
  const assignedDeliveries = orders.filter((order) => order.delivery_collector_id && !['delivered', 'cancelled', 'refunded'].includes(order.order_status)).length;
  const deliveredCount = orders.filter((order) => order.order_status === 'delivered').length;

  return (
    <div className="directory-page">
      <section className="directory-hero collector-hero">
        <div className="directory-hero-copy">
          <span className="directory-eyebrow">Product Dispatch</span>
          <h1>Delivery Requests</h1>
          <p>Assign riders to store product orders and track delivery progress to the customer address.</p>
        </div>
        <div className="directory-hero-badge">
          <Truck size={20} />
          <span>{orders.length}</span>
          <small>orders</small>
        </div>
      </section>

      <div className="directory-stats">
        <div className="directory-stat">
          <span className="stat-icon stat-icon-amber"><ClipboardList size={18} /></span>
          <div><strong>{pendingAssignments}</strong><small>Need rider</small></div>
        </div>
        <div className="directory-stat">
          <span className="stat-icon stat-icon-blue"><Truck size={18} /></span>
          <div><strong>{assignedDeliveries}</strong><small>Assigned</small></div>
        </div>
        <div className="directory-stat">
          <span className="stat-icon stat-icon-green"><PackageCheck size={18} /></span>
          <div><strong>{deliveredCount}</strong><small>Delivered</small></div>
        </div>
      </div>

      <div className="card" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {[
          { value: '', label: 'All Deliveries' },
          { value: 'pending', label: 'Pending' },
          { value: 'confirmed', label: 'Assigned' },
          { value: 'shipped', label: 'On Route' },
          { value: 'delivered', label: 'Delivered' },
          { value: 'cancelled', label: 'Cancelled' },
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

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Loader2 size={36} className="animate-spin" style={{ color: '#10b981' }} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {orders.length > 0 ? orders.map((order) => (
            <div key={order._id} className="card delivery-request-card">
              <div className="delivery-main">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <span className={`badge badge-${
                    order.order_status === 'delivered' ? 'success' :
                    order.order_status === 'cancelled' ? 'danger' :
                    order.delivery_collector_id ? 'info' : 'pending'
                  }`}>
                    {order.delivery_collector_id ? order.order_status : 'needs rider'}
                  </span>
                  <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    #{order._id.slice(-8).toUpperCase()}
                  </span>
                </div>

                <h3 style={{ margin: 0, fontSize: '1.15rem' }}>
                  {order.items?.length || 0} product(s) for Rs. {order.total_amount || 0}
                </h3>

                <div className="delivery-detail-grid">
                  <div>
                    <User size={16} />
                    <span>{order.user_id?.full_name || 'Customer'} ({order.user_id?.phone || order.user_id?.email || 'No contact'})</span>
                  </div>
                  <div>
                    <MapPin size={16} />
                    <span>{formatAddress(order.shipping_address)}</span>
                  </div>
                  <div>
                    <CreditCard size={16} />
                    <span>{String(order.payment_method || 'cash_on_delivery').replace(/_/g, ' ')} / {order.payment_status}</span>
                  </div>
                </div>
              </div>

              <div className="delivery-rider-panel">
                <div className="card" style={{ padding: '1rem' }}>
                  <h4 style={{ margin: '0 0 0.6rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Assigned Rider</h4>
                  {order.delivery_collector_id ? (
                    <div className="profile-cell">
                      <div className="profile-avatar"><Truck size={18} /></div>
                      <div>
                        <strong>{order.delivery_collector_id.full_name || 'Rider'}</strong>
                        <div className="text-muted" style={{ fontSize: '0.8rem' }}>{order.delivery_collector_id.phone || 'No phone'}</div>
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted" style={{ fontStyle: 'italic' }}>No rider assigned yet.</span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {!['delivered', 'cancelled', 'refunded'].includes(order.order_status) && (
                    <button className="btn btn-primary" style={{ flex: 1, fontSize: '0.85rem' }} onClick={() => openAssignModal(order)}>
                      {order.delivery_collector_id ? 'Reassign Rider' : 'Assign Rider'}
                    </button>
                  )}
                  {order.delivery_collector_id && order.order_status !== 'shipped' && !['delivered', 'cancelled'].includes(order.order_status) && (
                    <button className="btn btn-secondary" style={{ fontSize: '0.85rem' }} onClick={() => handleStatusUpdate(order, 'shipped')} disabled={actionLoading}>
                      Mark On Route
                    </button>
                  )}
                  {order.delivery_collector_id && order.order_status === 'shipped' && (
                    <button className="btn btn-primary" style={{ fontSize: '0.85rem' }} onClick={() => handleStatusUpdate(order, 'delivered')} disabled={actionLoading}>
                      Mark Delivered
                    </button>
                  )}
                </div>
              </div>
            </div>
          )) : (
            <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              No delivery requests found.
            </div>
          )}
        </div>
      )}

      {showAssignModal && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>Assign Delivery Rider</h3>
              <button
                onClick={() => { setShowAssignModal(false); setSelectedOrder(null); }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.25rem' }}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-muted)', marginTop: 0 }}>
                Deliver to: <strong style={{ color: 'var(--text-main)' }}>{formatAddress(selectedOrder.shipping_address)}</strong>
              </p>
              <div className="form-group">
                <label className="form-label">Available Riders</label>
                <select className="form-control" value={selectedCollectorId} onChange={(e) => setSelectedCollectorId(e.target.value)} disabled={actionLoading}>
                  <option value="">Choose rider...</option>
                  {collectors.map((collector) => (
                    <option key={collector._id} value={collector._id}>
                      {collector.full_name} ({collector.phone || 'No phone'})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setShowAssignModal(false); setSelectedOrder(null); }} disabled={actionLoading}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleAssignCollector} disabled={actionLoading || !selectedCollectorId}>
                {actionLoading ? 'Assigning...' : 'Confirm Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .delivery-request-card {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 1.25rem;
        }
        .delivery-main {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }
        .delivery-detail-grid {
          display: grid;
          gap: 0.55rem;
          color: var(--text-main);
          font-size: 0.92rem;
        }
        .delivery-detail-grid > div {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
        }
        .delivery-detail-grid svg {
          color: var(--text-muted);
          flex: 0 0 auto;
          margin-top: 0.1rem;
        }
        .delivery-rider-panel {
          border-left: 1px solid var(--border-color);
          padding-left: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          justify-content: center;
        }
        @media (max-width: 860px) {
          .delivery-request-card {
            grid-template-columns: 1fr;
          }
          .delivery-rider-panel {
            border-left: none;
            border-top: 1px solid var(--border-color);
            padding-left: 0;
            padding-top: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default DeliveryRequests;
