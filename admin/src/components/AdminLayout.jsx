import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Truck, 
  Recycle, 
  ShoppingBag, 
  ClipboardList, 
  BarChart3, 
  MessageSquareWarning, 
  Menu, 
  X,
  User as UserIcon,
  ChevronDown
} from 'lucide-react';

const ECOTRADE_LOGO = '/Eco%20Trade%20Logo-04.jpg.jpeg';

// ProfileMenu declared at module scope to avoid creating components during render
const ProfileMenu = ({ user, onLogout }) => {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { uploadProfilePhoto } = useAuth();

  const handleFileChange = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    try {
      await uploadProfilePhoto(f);
      // noop — uploadProfilePhoto refreshes profile in context
    } catch (err) {
      console.error('Profile upload failed', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <input id="profile-photo-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
      <button onClick={() => setOpen((s) => !s)} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-card)' }}>
          {user?.profile_photo ? <img src={user.profile_photo} alt={user.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <UserIcon size={18} style={{ color: 'var(--text-muted)' }} />}
        </div>
        <ChevronDown size={16} />
      </button>
      {open && (
        <div style={{ position: 'absolute', right: 0, marginTop: 8, width: 260, borderRadius: 8, background: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)', padding: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', padding: '0.5rem', alignItems: 'center' }}>
            <label htmlFor="profile-photo-input" style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              {user?.profile_photo ? <img src={user.profile_photo} alt={user.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <UserIcon size={18} style={{ color: 'var(--text-muted)' }} />}
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <strong style={{ color: 'var(--text-h)' }}>{user?.full_name || 'Administrator'}</strong>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email || 'admin@ecotrade.com'}</span>
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--border-color)', marginTop: 8, paddingTop: 8, display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setOpen(false)}>Close</button>
            <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => { onLogout(); setOpen(false); }}>Sign Out</button>
          </div>
          {uploading && <div style={{ marginTop: 8, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Uploading...</div>}
        </div>
      )}
    </div>
  );
};

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [riderOpen, setRiderOpen] = useState(() => ['/scrap-requests', '/delivery-requests'].includes(location.pathname));

  

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'User Accounts', path: '/users', icon: Users },
    { name: 'Collector Riders', path: '/collectors', icon: Truck },
    { name: 'Rider Dispatch', path: '/rider', icon: Truck, grouped: 'rider' },
    // Products menu will render as a grouped item below
    { name: 'Products Store', path: '/products', icon: ShoppingBag, grouped: 'products' },
    { name: 'Sales Orders', path: '/orders', icon: ClipboardList },
    { name: 'Analytics Reports', path: '/reports', icon: BarChart3 },
    { name: 'Complaints & Feedback', path: '/complaints', icon: MessageSquareWarning },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-container">
      {/* Top header with profile */}
      <header style={{ position: 'fixed', top: 0, right: 0, left: 260, height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 1.25rem', zIndex: 1050, background: 'transparent' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ProfileMenu user={user} onLogout={handleLogout} />
        </div>
      </header>
      {/* Mobile Menu Button */}
      <button 
        onClick={() => setMobileOpen(!mobileOpen)}
        style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          zIndex: 1100,
          background: 'var(--bg-sidebar)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-main)',
          padding: '0.5rem',
          borderRadius: '8px',
          cursor: 'pointer',
          display: 'none'
        }}
        className="mobile-toggle-btn"
      >
        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar Navigation */}
      <aside 
        style={{
          width: '260px',
          background: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border-color)',
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 0.3s ease',
          transform: mobileOpen ? 'translateX(0)' : undefined
        }}
        className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}
      >
        {/* Brand Header */}
        <div style={{
          padding: '1.75rem 1.5rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <div style={{
            background: '#ffffff',
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0
          }}>
            <img
              src={ECOTRADE_LOGO}
              alt="EcoTrade logo"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
          </div>
          <span style={{
            fontSize: '1.2rem',
            fontWeight: 700,
            color: 'var(--text-h)',
            letterSpacing: '-0.02em'
          }}>EcoTrade Admin</span>
        </div>

        {/* Menu Links */}
        <nav style={{
          flexGrow: 1,
          padding: '1.5rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.35rem',
          overflowY: 'auto'
        }}>
          {menuItems.map((item) => {
            if (item.grouped) {
              const isProducts = item.grouped === 'products';
              const isRider = item.grouped === 'rider';
              const isOpen = isProducts ? productsOpen : riderOpen;
              const setOpen = isProducts ? setProductsOpen : setRiderOpen;
              const isActive = isProducts
                ? location.pathname.startsWith('/products')
                : ['/scrap-requests', '/delivery-requests'].includes(location.pathname);
              return (
                <div key={`${item.grouped}-group`} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <button
                    onClick={() => setOpen((s) => !s)}
                    className="nav-link"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.85rem',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      color: isActive ? 'var(--text-h)' : 'var(--text-muted)',
                      background: isActive ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                      border: isActive ? '1px solid rgba(16, 185, 129, 0.12)' : '1px solid transparent',
                      fontWeight: isActive ? 600 : 500,
                      fontSize: '0.925rem',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer'
                    }}
                  >
                    <item.icon size={18} style={{ color: isActive ? '#10b981' : undefined }} />
                    <span style={{ flex: 1 }}>{item.name}</span>
                    <ChevronDown size={16} />
                  </button>

                  {isOpen && isProducts && (
                    <div style={{ paddingLeft: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <Link to="/products" onClick={() => setMobileOpen(false)} className="nav-link" style={{ padding: '0.5rem 0.75rem', borderRadius: 8 }}>All Products</Link>
                      <Link to="/products/new" onClick={() => setMobileOpen(false)} className="nav-link" style={{ padding: '0.5rem 0.75rem', borderRadius: 8 }}>Add Product</Link>
                    </div>
                  )}
                  {isOpen && isRider && (
                    <div style={{ paddingLeft: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <Link to="/scrap-requests" onClick={() => setMobileOpen(false)} className="nav-link" style={{ padding: '0.5rem 0.75rem', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Recycle size={15} /> Scrap Requests
                      </Link>
                      <Link to="/delivery-requests" onClick={() => setMobileOpen(false)} className="nav-link" style={{ padding: '0.5rem 0.75rem', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <ClipboardList size={15} /> Delivery Requests
                      </Link>
                    </div>
                  )}
                </div>
              );
            }

            const IconComponent = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  color: isActive ? 'var(--text-h)' : 'var(--text-muted)',
                  background: isActive ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                  border: isActive ? '1px solid rgba(16, 185, 129, 0.12)' : '1px solid transparent',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.925rem',
                  transition: 'all 0.2s ease'
                }}
                className="nav-link"
              >
                <IconComponent size={18} style={{ color: isActive ? '#10b981' : undefined }} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar no longer contains user actions; moved to top header */}
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* CSS adjustments for sidebar responsive behavior */}
      <style>{`
        @media (max-width: 1024px) {
          .mobile-toggle-btn {
            display: block !important;
          }
          .sidebar {
            transform: translateX(-100%);
            box-shadow: 10px 0 30px rgba(0, 0, 0, 0.5);
          }
          .sidebar-open {
            transform: translateX(0) !important;
          }
        }
        .nav-link:hover {
          color: var(--text-h) !important;
          background: rgba(255, 255, 255, 0.02) !important;
        }
        .logout-btn:hover {
          background: rgba(239, 68, 68, 0.1) !important;
          border-color: rgba(239, 68, 68, 0.2) !important;
        }
      `}</style>
    </div>
  );
};

export default AdminLayout;
