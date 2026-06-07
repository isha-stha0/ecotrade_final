import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('ecotrade_admin_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => {
    return localStorage.getItem('ecotrade_admin_token') || null;
  });
  const [loading, setLoading] = useState(true);

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('ecotrade_admin_token');
    localStorage.removeItem('ecotrade_admin_user');
  };

  const refreshProfile = async () => {
    try {
      const profile = await authAPI.getProfile();
      setUser(profile);
      localStorage.setItem('ecotrade_admin_user', JSON.stringify(profile));
      return profile;
    } catch (e) {
      console.error('Failed to refresh profile:', e);
      return null;
    }
  };

  const uploadProfilePhoto = async (file) => {
    const formData = new FormData();
    formData.append('profile_photo', file);
    const res = await authAPI.uploadProfilePhoto(formData);
    // refresh local profile
    await refreshProfile();
    return res;
  };

  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const profile = await authAPI.getProfile();
          if (profile.role !== 'admin') {
            // Force logout if not admin
            logout();
          } else {
            setUser(profile);
            localStorage.setItem('ecotrade_admin_user', JSON.stringify(profile));
          }
        } catch (err) {
          console.error('Session validation failed:', err);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await authAPI.login(email, password);
      
      // Verify role
      if (data.user.role !== 'admin') {
        throw new Error('Access denied. Admin portal only.');
      }

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('ecotrade_admin_token', data.token);
      localStorage.setItem('ecotrade_admin_user', JSON.stringify(data.user));
      setLoading(false);
      return data.user;
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAdmin: user?.role === 'admin',
    uploadProfilePhoto,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
