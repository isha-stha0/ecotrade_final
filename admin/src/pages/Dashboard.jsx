import { useState, useEffect } from 'react';
import { dashboardAPI } from '../api/api';
import { 
  Users, 
  Recycle, 
  ShoppingBag, 
  TrendingUp, 
  AlertCircle, 
  ArrowRight,
  Loader2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import {
  PieChartComponent,
} from '../components/AdvancedCharts';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await dashboardAPI.getStats();
        setData(res);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError('Failed to load dashboard metrics. Check server status.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={36} className="animate-spin" style={{ color: '#10b981' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ maxWidth: '500px', margin: '2rem auto', textAlign: 'center', borderColor: '#ef4444' }}>
        <h2 style={{ color: '#ef4444' }}>System Offline</h2>
  <p style={{ color: 'var(--text-muted)', margin: '1rem 0' }}>{error}</p>
        <button onClick={() => window.location.reload()} className="btn btn-secondary">Retry Connection</button>
      </div>
    );
  }

  const { stats, recentScraps, recentOrders, scrapByCategory } = data || {};

  // Custom colors for categories chart
  const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#0ea5e9', '#ec4899', '#8b5cf6'];

  const cardStats = [
    { name: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: '#6366f1' },
    { name: 'Scrap Collected', value: stats?.totalScraps || 0, icon: Recycle, color: '#10b981' },
    { name: 'Listed Products', value: stats?.totalProducts || 0, icon: ShoppingBag, color: '#0ea5e9' },
    { name: 'Sales Completed', value: stats?.totalOrders || 0, icon: TrendingUp, color: '#ec4899' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Title Header */}
      <div>
        <h1 style={{ fontSize: '2rem', margin: 0 }}>System Overview</h1>
  <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>Real-time ecosystem metrics & operational workflow</p>
      </div>

      {/* Metrics Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.5rem'
      }}>
        {cardStats.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>{item.name}</span>
                <span style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-main)' }}>{item.value}</span>
              </div>
              <div style={{
                background: `rgba(${parseInt(item.color.slice(1,3),16)}, ${parseInt(item.color.slice(3,5),16)}, ${parseInt(item.color.slice(5,7),16)}, 0.1)`,
                color: item.color,
                padding: '0.75rem',
                borderRadius: '12px'
              }}>
                <Icon size={24} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Pending Alert Callout */}
      {stats?.pendingScraps > 0 && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.2)',
          borderRadius: '12px',
          padding: '1rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#f59e0b' }}>
            <AlertCircle size={20} />
            <span style={{ fontWeight: 600 }}>Action Required:</span>
            <span style={{ color: 'var(--text-muted)' }}>There are {stats.pendingScraps} pending scrap pickup requests waiting for collector assignment.</span>
          </div>
          <Link to="/scrap-requests" className="btn btn-primary" style={{
            backgroundColor: '#f59e0b',
            color: '#0f172a',
            padding: '0.45rem 1rem',
            fontSize: '0.85rem'
          }}>
            Manage Pickups <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Analytics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '1.5rem'
      }} className="analytics-grid">
        
        {/* Recycled Categories Volume chart */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Recycling Volumes</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>Estimated quantities (kg) collected by category</p>
          </div>
          <div style={{ width: '100%', height: '300px' }}>
            {scrapByCategory?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scrapByCategory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="_id" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)' }}
                    labelStyle={{ fontWeight: 600, color: '#10b981' }}
                  />
                  <Bar dataKey="quantity" radius={[4, 4, 0, 0]}>
                    {scrapByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                No category metrics recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Recycling Counts list */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Material Distribution</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>Share of requests submitted</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
            {scrapByCategory?.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span style={{ fontSize: '0.9rem', fontWeight: 500, textTransform: 'capitalize' }}>{item._id || 'other'}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#ffffff' }}>{item.quantity} kg</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.count} items</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Recent Activity Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1.5rem'
      }} className="activity-grid">
        
        {/* Recent Scrap Requests */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Recent Scrap Requests</h3>
            <Link to="/scrap-requests" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              View All <ArrowRight size={14} />
            </Link>
          </div>
          
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentScraps?.length > 0 ? (
                  recentScraps.map((scrap) => (
                    <tr key={scrap._id}>
                      <td style={{ fontWeight: 600 }}>{scrap.user_id?.full_name || 'Guest User'}</td>
                      <td style={{ textTransform: 'capitalize' }}>{scrap.category || 'other'}</td>
                      <td>{scrap.quantity_estimated || scrap.quantity || 0} kg</td>
                      <td>
                        <span className={`badge badge-${scrap.status === 'pending' ? 'pending' : (scrap.status === 'completed' ? 'success' : 'info')}`}>
                          {scrap.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No recent requests found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Recent Store Orders</h3>
            <Link to="/orders" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              View All <ArrowRight size={14} />
            </Link>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders?.length > 0 ? (
                  recentOrders.map((order) => (
                    <tr key={order._id}>
                      <td style={{ fontWeight: 600 }}>{order.user_id?.full_name || 'Guest Customer'}</td>
                      <td>Rs. {order.total_amount || 0}</td>
                      <td>
                        <span className={`badge badge-${order.order_status === 'pending' ? 'pending' : (order.order_status === 'delivered' ? 'success' : 'info')}`}>
                          {order.order_status}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No recent orders found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @media (max-width: 768px) {
          .analytics-grid, .activity-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
