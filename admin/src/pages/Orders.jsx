import { useState, useEffect, useCallback } from 'react';
import { orderAPI } from '../api/api';
import { Loader2, Eye, CreditCard, MapPin } from 'lucide-react';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  // Selected order details modal
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

  const handleOpenDetails = (o) => {
    setSelectedOrder(o);
    setOrderStatus(o.order_status || 'pending');
    setPaymentStatus(o.payment_status || 'pending');
    setShowDetailsModal(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;
    setActionLoading(true);
    try {
      await orderAPI.updateStatus(selectedOrder._id, orderStatus, paymentStatus);
      fetchOrders();
      setShowDetailsModal(false);
      setSelectedOrder(null);
    } catch (err) {
      console.error('Error updating order status:', err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Page Header */}
      <div>
        <h1 style={{ fontSize: '2rem', margin: 0 }}>Sales Orders</h1>
  <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>Fulfill store product orders, update shipping routes, and log cash/card payment completions</p>
      </div>

      {/* Filter Options */}
      <div className="card" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>Filter Order:</span>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { value: '', label: 'All Orders' },
            { value: 'pending', label: 'Pending' },
            { value: 'confirmed', label: 'Confirmed' },
            { value: 'shipped', label: 'Shipped' },
            { value: 'delivered', label: 'Delivered' },
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
                <th>Order ID</th>
                <th>Customer</th>
                <th>Purchased Items</th>
                <th>Total Bill</th>
                <th>Order Status</th>
                <th>Payment Status</th>
                <th>Date Placed</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length > 0 ? (
                orders.map((order) => (
                  <tr key={order._id}>
                    {/* Order ID */}
                    <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                      #{order._id.slice(-6).toUpperCase()}
                    </td>
                    
                    {/* User */}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600 }}>{order.user_id?.full_name || 'Guest User'}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.user_id?.email || '—'}</span>
                      </div>
                    </td>

                    {/* Items brief */}
                    <td>
                      <span style={{ fontSize: '0.9rem' }}>
                        {order.items?.length || 0} product(s)
                      </span>
                    </td>

                    {/* Total */}
                    <td style={{ fontWeight: 700, color: '#ffffff' }}>
                      Rs. {order.total_amount || 0}
                    </td>

                    {/* Order Status Badge */}
                    <td>
                      <span className={`badge badge-${
                        order.order_status === 'pending' ? 'pending' : 
                        (order.order_status === 'delivered' ? 'success' : 
                        (order.order_status === 'cancelled' ? 'danger' : 'info'))
                      }`}>
                        {order.order_status}
                      </span>
                    </td>

                    {/* Payment status badge */}
                    <td>
                      <span className={`badge badge-${order.payment_status === 'paid' ? 'success' : 'pending'}`}>
                        {order.payment_status}
                      </span>
                    </td>

                    {/* Date */}
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td>
                      <button
                        onClick={() => handleOpenDetails(order)}
                        className="btn btn-secondary btn-icon"
                        title="View Details & Update"
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                    No matching sales orders in DB.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Details & Status Modal */}
      {showDetailsModal && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>Order Details — #{selectedOrder._id.slice(-8).toUpperCase()}</h3>
              <button 
                onClick={() => { setShowDetailsModal(false); setSelectedOrder(null); }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.25rem' }}
              >
                &times;
              </button>
            </div>
            
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Product items purchased */}
              <div>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0 0 0.75rem 0', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                  Purchased Items
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'rgba(0,0,0,0.03)',
                      padding: '0.75rem 1rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                          {item.product_id?.name || 'Eco Product'}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Qty: {item.quantity} &times; Rs. {item.price_at_time}
                        </span>
                      </div>
                      <span style={{ fontWeight: 700 }}>
                        Rs. {item.subtotal || (item.quantity * item.price_at_time)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cost break down */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                paddingTop: '1rem'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Subtotal:</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>Rs. {selectedOrder.subtotal_amount || 0}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Discounts / Eco-points Used:</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#10b981' }}>- Rs. {selectedOrder.discount_amount || 0}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', gridColumn: 'span 2' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Bill:</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>Rs. {selectedOrder.total_amount || 0}</span>
                </div>
              </div>

              {/* Delivery info & shipping */}
              <div style={{ 
                borderTop: '1px solid rgba(255,255,255,0.05)', 
                paddingTop: '1rem',
                display: 'flex', 
                flexDirection: 'column', 
                gap: '0.6rem',
                fontSize: '0.9rem',
                color: 'var(--text-muted)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MapPin size={16} style={{ color: 'var(--text-muted)' }} />
                  <span>Shipping Address: {selectedOrder.shipping_address || 'Not Specified'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CreditCard size={16} style={{ color: 'var(--text-muted)' }} />
                  <span>Payment Method: <span style={{ textTransform: 'capitalize' }}>{selectedOrder.payment_method?.replace(/_/g, ' ') || 'cash_on_delivery'}</span></span>
                </div>
                {selectedOrder.delivery_notes && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', background: 'rgba(245, 158, 11, 0.05)', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.1)' }}>
                    <span style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 600, flexShrink: 0 }}>Driver Note:</span>
                    <span style={{ fontSize: '0.8rem', color: '#e2e8f0' }}>{selectedOrder.delivery_notes}</span>
                  </div>
                )}
              </div>

              {/* Edit status actions */}
              <div style={{ 
                borderTop: '1px solid rgba(255,255,255,0.05)', 
                paddingTop: '1rem',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem'
              }}>
                <div className="form-group">
                  <label className="form-label">Order Fulfillment Status</label>
                  <select
                    className="form-control"
                    value={orderStatus}
                    onChange={(e) => setOrderStatus(e.target.value)}
                    disabled={actionLoading}
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Payment Status</label>
                  <select
                    className="form-control"
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    disabled={actionLoading}
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>
              </div>

            </div>
            
            <div className="modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={() => { setShowDetailsModal(false); setSelectedOrder(null); }}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleUpdateStatus}
                disabled={actionLoading}
              >
                {actionLoading ? 'Saving...' : 'Update Order Status'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
