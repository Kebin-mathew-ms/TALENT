import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerCandidate, getMe, logoutUser } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('talent_flow_token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('talent_flow_token');
      if (storedToken) {
        try {
          const response = await getMe();
          if (response.success && response.data.user) {
            setUser(response.data.user);
            setToken(storedToken);
            localStorage.setItem('talent_flow_user', JSON.stringify(response.data.user));
          } else {
            handleLogout();
          }
        } catch (error) {
          console.error('Failed to verify token on init:', error);
          handleLogout();
        }
      } else {
        setUser(null);
        setToken(null);
        localStorage.removeItem('talent_flow_user');
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const handleLogin = async (email, password) => {
    setIsLoading(true);
    try {
      const response = await loginUser({ email, password });
      if (response.success && response.data) {
        const { user: userData, token: jwtToken } = response.data;
        setUser(userData);
        setToken(jwtToken);
        localStorage.setItem('talent_flow_token', jwtToken);
        localStorage.setItem('talent_flow_user', JSON.stringify(userData));
        return { success: true, user: userData };
      }
      return { success: false, message: response.message || 'Login failed' };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed. Please check your credentials.';
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (candidateData) => {
    setIsLoading(true);
    try {
      const response = await registerCandidate(candidateData);
      if (response.success && response.data) {
        const { user: userData, token: jwtToken } = response.data;
        setUser(userData);
        setToken(jwtToken);
        localStorage.setItem('talent_flow_token', jwtToken);
        localStorage.setItem('talent_flow_user', JSON.stringify(userData));
        return { success: true, user: userData };
      }
      return { success: false, message: response.message || 'Registration failed' };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    setToken(null);
  };

  const value = {
    user,
    token,
    role: user?.role || null,
    isAuthenticated: !!user && !!token,
    isLoading,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
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
