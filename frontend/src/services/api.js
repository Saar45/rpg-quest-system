const API_BASE_URL = 'http://localhost:3000/api';

// Helper pour gérer les erreurs
const handleResponse = async (response) => {
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Une erreur est survenue');
  }
  
  return data;
};

// Helper pour ajouter le token aux headers
const getAuthHeaders = (token) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// API Authentication
export const authAPI = {
  register: async (name, email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name, email, password }),
    });
    return handleResponse(response);
  },

  login: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(response);
  },
};

// API Player
export const playerAPI = {
  getProfile: async (token) => {
    const response = await fetch(`${API_BASE_URL}/player/profile`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
    return handleResponse(response);
  },

  acceptQuest: async (token, questId) => {
    const response = await fetch(`${API_BASE_URL}/player/accept-quest/${questId}`, {
      method: 'POST',
      headers: getAuthHeaders(token),
    });
    return handleResponse(response);
  },

  completeQuest: async (token, questId) => {
    const response = await fetch(`${API_BASE_URL}/player/complete-quest/${questId}`, {
      method: 'POST',
      headers: getAuthHeaders(token),
    });
    return handleResponse(response);
  },

  useItem: async (token, itemId) => {
    const response = await fetch(`${API_BASE_URL}/player/use-item/${itemId}`, {
      method: 'POST',
      headers: getAuthHeaders(token),
    });
    return handleResponse(response);
  },
};

// API Items
export const itemsAPI = {
  getAll: async (token) => {
    const response = await fetch(`${API_BASE_URL}/items`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
    return handleResponse(response);
  },

  getById: async (token, itemId) => {
    const response = await fetch(`${API_BASE_URL}/items/${itemId}`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
    return handleResponse(response);
  },
};

// API Quests
export const questsAPI = {
  getAll: async (token) => {
    const response = await fetch(`${API_BASE_URL}/quests`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
    return handleResponse(response);
  },

  getById: async (token, questId) => {
    const response = await fetch(`${API_BASE_URL}/quests/${questId}`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
    return handleResponse(response);
  },
};
