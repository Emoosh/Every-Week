const API_URL = 'http://localhost:3000';

// Helper function for making API requests
async function fetchAPI(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  
  // Set default headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Include credentials for cookies
  const config = {
    ...options,
    headers,
    credentials: 'include',
  };

  const response = await fetch(url, config);
  
  // If the response is not JSON, return the response directly
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return response;
  }

  const data = await response.json();
  
  // If response is not ok, throw an error with the error data
  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }
  
  return data;
}

// Auth services
export const authService = {
  // Login user
  login: async (email, password) => {
    return fetchAPI('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  
  // Register user
  register: async (username, email, password) => {
    return fetchAPI('/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
  },
  
  // Get user profile
  getProfile: async () => {
    return fetchAPI('/profile');
  },
  
  // Logout user
  logout: async () => {
    return fetchAPI('/logout', { method: 'POST' });
  }
};

// Riot information services
export const riotService = {
  getRiotInfo: async () => {
    return fetchAPI('/riot_information');
  }
};

export default {
  authService,
  riotService
};