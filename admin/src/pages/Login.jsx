import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Leaf, ShieldAlert } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || 
        err.message || 
        'Login failed. Please check your network and credentials.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-main)',
      padding: '1.5rem',
    }}>
      <div className="card" style={{
        width: '100%',
        maxWidth: '420px',
        padding: '2.5rem',
        textAlign: 'center',
      }}>
        {/* Header Logo */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '60px',
          height: '60px',
          borderRadius: '16px',
          background: 'rgba(16, 185, 129, 0.08)',
          color: 'var(--primary)',
          marginBottom: '1.5rem',
        }}>
          <Leaf size={32} />
        </div>

        <h1 style={{
          fontSize: '1.75rem',
          fontWeight: '700',
          marginBottom: '0.5rem',
          color: 'var(--text-main)',
          letterSpacing: '-0.03em',
        }}>EcoTrade Admin</h1>
        
        <p style={{
          color: 'var(--text-muted)',
          fontSize: '0.9rem',
          marginBottom: '2rem',
        }}>
          Secure control center for operations & sustainability metrics
        </p>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            backgroundColor: 'rgba(239, 68, 68, 0.06)',
            border: '1px solid rgba(239, 68, 68, 0.12)',
            borderRadius: '12px',
            padding: '0.85rem 1rem',
            marginBottom: '1.5rem',
            color: 'var(--danger)',
            fontSize: '0.85rem',
            textAlign: 'left',
          }}>
            <ShieldAlert size={20} style={{ flexShrink: 0, color: 'var(--danger)' }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-control"
              placeholder="admin@ecotrade.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={submitting}
              autoFocus
            />
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={submitting}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              fontSize: '0.95rem',
            }}
            disabled={submitting}
          >
            {submitting ? 'Authenticating...' : 'Sign In'}
            {!submitting && <LogIn size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
