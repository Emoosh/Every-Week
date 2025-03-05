import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/api';

// Create the context
const AuthContext = createContext();

// Create a provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on initial load
  useEffect(() => {
    const checkAuthStatus = async () => {
      // First check if there's a token in localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      
      try {
        // If we have a token, try to get the user profile
        const userData = await authService.getProfile();
        console.log("Profile Response:", userData); // Debug için
        
        // userData.user içinden kullanıcı bilgilerini almak
        if (userData && userData.user) {
          // User objesi içindeki role bilgisini alalım
          const userWithRole = {
            ...userData.user,
            _id: userData.user.uid || userData.user._id, // ID'yi standartlaştır
            role: userData.user.role || "user" // Role bilgisini garantilemek için
          };
          
          setUser(userWithRole);
          console.log("User profile set from user object:", userWithRole);
        } else {
          // Doğrudan userData kullanımında da role bilgisini kontrol et
          const userWithRole = {
            ...userData,
            role: userData?.role || "user" // Role bilgisini garantilemek için
          };
          
          setUser(userWithRole);
          console.log("User profile set directly:", userWithRole);
        }
      } catch (err) {
        console.error("Profile fetch error:", err);
        // Token might be invalid, remove it
        localStorage.removeItem('token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Login function
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const userData = await authService.login(email, password);
      console.log("Login Response:", userData); // Debug için
      
      // Store the token in localStorage
      if (userData && userData.token) {
        localStorage.setItem('token', userData.token);
      }
      
      // userData.user içinden gelen kullanıcı bilgilerini almak
      if (userData && userData.user) {
        setUser(userData.user);
        console.log("User data set in context:", userData.user); // Debug için
      } else {
        setUser(userData);
        console.log("User data set directly:", userData); // Debug için
      }
      
      return userData;
    } catch (err) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (username, email, password, schoolName = null) => {
    setLoading(true);
    setError(null);
    
    try {
      const userData = await authService.register(username, email, password, schoolName);
      return userData;
    } catch (err) {
      setError(err.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP function
  const verifyOTP = async (email, otpCode) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await authService.verifyOTP(email, otpCode);
      return result;
    } catch (err) {
      setError(err.message || 'OTP verification failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Request new OTP function
  const requestNewOTP = async (email) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await authService.requestNewOTP(email);
      return result;
    } catch (err) {
      setError(err.message || 'Failed to request new OTP');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setLoading(true);
    
    try {
      await authService.logout();
      // Remove token from localStorage
      localStorage.removeItem('token');
      setUser(null);
    } catch (err) {
      setError(err.message || 'Logout failed');
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    verifyOTP,
    requestNewOTP,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;