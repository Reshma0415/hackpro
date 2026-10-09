import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('candidate_trust_token') || null);
  const [loading, setLoading] = useState(true);
  const [demoInfo, setDemoInfo] = useState({ demoMode: true, accounts: [] });

  // Load session on startup
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Fetch demo credentials if enabled
        const demoRes = await api.get('/auth/demo-credentials');
        if (demoRes.data) {
          setDemoInfo(demoRes.data);
        }

        if (token) {
          const meRes = await api.get('/auth/me');
          if (meRes.data.success) {
            setUser(meRes.data.user);
          } else {
            logout();
          }
        }
      } catch (err) {
        console.warn('Session verification failed, logging out:', err.message);
        logout();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [token]);

  const login = async (identifier, password) => {
    const res = await api.post('/auth/login', { identifier, password });
    if (res.data.success) {
      localStorage.setItem('candidate_trust_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data;
    }
    throw new Error(res.data.message || 'Login failed');
  };

  const loginWithOtp = async (identifier, otp) => {
    const res = await api.post('/auth/login-otp-verify', { identifier, otp });
    if (res.data.success) {
      localStorage.setItem('candidate_trust_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data;
    }
    throw new Error(res.data.message || 'OTP Login failed');
  };

  const setAuthSession = (newToken, newUser) => {
    localStorage.setItem('candidate_trust_token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('candidate_trust_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        token,
        loading,
        demoInfo,
        login,
        loginWithOtp,
        setAuthSession,
        logout,
        isAuthenticated: !!user,
        isHR: user?.role === 'HR' || user?.role === 'ADMIN',
        isAdmin: user?.role === 'ADMIN',
        isCandidate: user?.role === 'CANDIDATE'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

