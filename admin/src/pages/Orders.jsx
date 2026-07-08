import { useState, useEffect, useCallback } from 'react';
import { orderAPI } from '../api/api';
import { Loader2, Eye, CreditCard, MapPin, Package, Receipt, ShoppingBag, User, CalendarDays } from 'lucide-react';

const statusTone = (status) => {
  if (status === 'delivered' || status === 'paid') return 'success';
  if (status === 'cancelled' || status === 'failed' || status === 'refunded') return 'danger';
  if (status === 'pending') return 'pending';
  return 'info';
};

const formatAddress = (address) => {
  if (!address) return 'Not specified';
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

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [orderStatus, setOrderStatus] = useState('pending');
  const [paymentStatus, setPaymentStatus] = useState('pending');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await orderAPI.getOrders(statusFilter);
      setOrders(res.orders || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      await fetchOrders();
    })();
    return () => { mounted = false; };
  }, [fetchOrders]);

  const handleOpenDetails = (order) => {
    setSelectedOrder(order);
    setOrderStatus(order.order_status || 'pending');
    setPaymentStatus(order.payment_status || 'pending');
    setShowDetailsModal(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;
    setActionLoading(true);
    try {
      await orderAPI.updateStatus(selectedOrder._id, orderStatus, paymentStatus);
      await fetchOrders();
      setShowDetailsModal(false);
      setSelectedOrder(null);
    } catch (err) {
      console.error('Error updating order status:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
  const paidOrders = orders.filter((order) => order.payment_status === 'paid').length;
  const pendingOrders = orders.filter((order) => order.order_status === 'pending').length;

  return (
    <div className="directory-page">
      <section className="directory-hero">
        <div className="directory-hero-copy">
          <span className="directory-eyebrow">Store Fulfillment</span>
          <h1>Sales Orders</h1>
          <p>Review customer product orders, payment state, shipping address, and fulfillment status.</p>
        </div>
        <div className="directory-hero-badge">
          <ShoppingBag size={20} />
          <span>{orders.length}</span>
          <small>orders</small>
        </div>
      </section>

      <div className="directory-stats">
        <div className="directory-stat">
          <span className="stat-icon stat-icon-green"><Receipt size={18} /></span>
          <div><strong>Rs. {totalRevenue}</strong><small>Total shown</small></div>
        </div>
        <div className="directory-stat">
          <span className="stat-icon stat-icon-blue"><CreditCard size={18} /></span>
          <div><strong>{paidOrders}</strong><small>Paid orders</small></div>
        </div>
        <div className="directory-stat">
          <span className="stat-icon stat-icon-amber"><Package size={18} /></span>
          <div><strong>{pendingOrders}</strong><small>Pending orders</small></div>
        </div>
      </div>

      <div className="card" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {[
          { value: '', label: 'All Orders' },
          { value: 'pending', label: 'Pending' },
          { value: 'confirmed', label: 'Confirmed' },
          { value: 'shipped', label: 'Shipped' },
          { value: 'delivered', label: 'Delivered' },
          { value: 'cancelled', label: 'Cancelled' },
        ].map((btn) => (
          <button
            key={btn.value}
            onClick={() => setStatusFilter(btn.value)}
            className={`btn ${statusFilter === btn.value ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.45rem 0.9rem', fontSize: '0.84rem' }}
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
        <div className="table-container directory-table">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total Bill</th>
                <th>Order Status</th>
                <th>Payment</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.length > 0 ? (
                orders.map((order) => (
                  <tr key={order._id} className="directory-row">
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                        <strong style={{ fontFamily: 'monospace' }}>#{order._id.slice(-8).toUpperCase()}</strong>
                        <span className="text-muted" style={{ fontSize: '0.78rem' }}>{order.payment_method?.replace(/_/g, ' ') || 'cash on delivery'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="profile-cell">
                        <div className="profile-avatar"><User size={17} /></div>
                        <div>
                          <div style={{ fontWeight: 700 }}>{order.user_id?.full_name || 'Guest User'}</div>
                          <span className="text-muted">{order.user_id?.email || order.user_id?.phone || 'No contact'}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="order-item-pill">{order.items?.length || 0} product(s)</span>
                    </td>
                    <td>
                      <span className="order-total-pill">Rs. {order.total_amount || 0}</span>
                    </td>
                    <td>
                      <span className={`badge badge-${statusTone(order.order_status)}`}>{order.order_status}</span>
                    </td>
                    <td>
                      <span className={`badge badge-${statusTone(order.payment_status)}`}>{order.payment_status}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                        <CalendarDays size={14} />
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '-'}
                      </div>
                    </td>
                    <td>
                      <button
                        onClick={() => handleOpenDetails(order)}
                        className="action-icon-btn"
                        title="View order details"
                      >
                        <Eye size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                    No matching sales orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showDetailsModal && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content order-modal">
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0 }}>Order #{selectedOrder._id.slice(-8).toUpperCase()}</h3>
                <span className="text-muted">Placed {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString() : '-'}</span>
              </div>
              <button
                onClick={() => { setShowDetailsModal(false); setSelectedOrder(null); }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.25rem' }}
              >
                &times;
              </button>
            </div>

            <div className="modal-body order-modal-body">
              <div className="order-summary-strip">
                <div><small>Total Bill</small><strong>Rs. {selectedOrder.total_amount || 0}</strong></div>
                <div><small>Payment</small><strong>{selectedOrder.payment_status}</strong></div>
                <div><small>Status</small><strong>{selectedOrder.order_status}</strong></div>
              </div>

              <section>
                <h4 className="order-section-title">Purchased Items</h4>
                <div className="order-items-list">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="order-item-row">
                      <div>
                        <strong>{item.product_id?.name || 'Eco Product'}</strong>
                        <span>Qty: {item.quantity} x Rs. {item.price_at_time}</span>
                      </div>
                      <strong>Rs. {item.subtotal || (item.quantity * item.price_at_time)}</strong>
                    </div>
                  ))}
                </div>
              </section>

              <section className="order-info-grid">
                <div>
                  <MapPin size={16} />
                  <span><strong>Shipping:</strong> {formatAddress(selectedOrder.shipping_address)}</span>
                </div>
                <div>
                  <CreditCard size={16} />
                  <span><strong>Payment Method:</strong> {selectedOrder.payment_method?.replace(/_/g, ' ') || 'cash on delivery'}</span>
                </div>
              </section>

              {selectedOrder.delivery_notes && (
                <div className="alert alert-warning" style={{ marginBottom: 0 }}>
                  <strong>Delivery note:</strong> {selectedOrder.delivery_notes}
                </div>
              )}

              <section className="order-status-grid">
                <div className="form-group">
                  <label className="form-label">Order Status</label>
                  <select className="form-control" value={orderStatus} onChange={(e) => setOrderStatus(e.target.value)} disabled={actionLoading}>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Payment Status</label>
                  <select className="form-control" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} disabled={actionLoading}>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>
              </section>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setShowDetailsModal(false); setSelectedOrder(null); }} disabled={actionLoading}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleUpdateStatus} disabled={actionLoading}>
                {actionLoading ? 'Saving...' : 'Update Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
