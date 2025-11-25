import { createContext, useContext, useState, useCallback } from 'react';
import { playerAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  // Charger le token et l'utilisateur depuis localStorage au démarrage
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  
  const [token, setToken] = useState(() => {
    return localStorage.getItem('token') || null;
  });
  
  const [loading, setLoading] = useState(false);

  // Fonction pour rafraîchir les données du joueur depuis l'API
  const refreshPlayer = useCallback(async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const response = await playerAPI.getProfile(token);
      const playerData = response.data;
      
      // Mettre à jour les données du joueur
      const updatedUser = {
        id: playerData.id,
        name: playerData.name,
        email: playerData.email,
        level: playerData.level,
        experience: playerData.experience,
        inventory: playerData.inventory,
        quests: playerData.quests
      };
      
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Error refreshing player data:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const register = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    login,
    register,
    logout,
    refreshPlayer,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
