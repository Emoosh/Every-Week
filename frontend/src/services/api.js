const API_URL = 'http://localhost:3000';

// Cache for API responses
const apiCache = new Map();

// Function to create a cache key
const createCacheKey = (endpoint, options) => {
  // Only cache GET requests
  if (options.method && options.method !== 'GET') return null;
  
  return `${endpoint}:${JSON.stringify(options.body || {})}`;
};

// Helper function for making API requests
async function fetchAPI(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  
  // Get the stored token if available
  const token = localStorage.getItem('token');
  
  // Set default headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  // Add authorization header if token exists
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  // Add Cache-Control header for GET requests to prevent browser caching
  if (!options.method || options.method === 'GET') {
    headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    headers['Pragma'] = 'no-cache';
    headers['Expires'] = '0';
  }

  // Include credentials for cookies
  const config = {
    ...options,
    headers,
    credentials: 'include',
  };
  
  // Check if we have a cached response for this request
  const cacheKey = createCacheKey(endpoint, options);
  if (cacheKey && apiCache.has(cacheKey)) {
    const cachedData = apiCache.get(cacheKey);
    // Only use cache for very recent requests (100ms)
    if (Date.now() - cachedData.timestamp < 100) {
      console.log(`Using cached response for ${endpoint}`);
      return cachedData.data;
    }
  }

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
  
  // Cache successful GET responses
  if (cacheKey) {
    apiCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
  }
  
  return data;
}

// Auth services
export const authService = {
  // Login user
  login: async (email, password) => {
    return fetchAPI('/login', {
      method: 'POST',
      body: JSON.stringify({ mail: email, password }),
    });
  },
  
  // Register user
  register: async (username, email, password, schoolName) => {
    return fetchAPI('/register', {
      method: 'POST',
      body: JSON.stringify({ 
        username, 
        mail: email, 
        password, 
        schoolName 
      }),
    });
  },
  
  // Verify OTP code
  verifyOTP: async (email, otpCode) => {
    return fetchAPI('/register/verifyOTP', {
      method: 'POST',
      body: JSON.stringify({ mail: email, token: otpCode }),
    });
  },
  
  // Request new OTP code
  requestNewOTP: async (email) => {
    return fetchAPI('/register/requestOTP', {
      method: 'POST',
      body: JSON.stringify({ mail: email }),
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
  },
  
  // Maç geçmişini manuel olarak güncelle
  updateMatchHistory: async (gameName, tagLine) => {
    return fetchAPI('/riot_information', {
      method: 'POST',
      body: JSON.stringify({ gameName, tagLine })
    });
  }
};

// Game accounts services
export const gameAccountsService = {
  // Save user's game accounts
  saveGameAccounts: async (accounts) => {
    return fetchAPI('/game-accounts/save-accounts', {
      method: 'POST',
      body: JSON.stringify(accounts),
    });
  },
  
  // Get user's game accounts
  getGameAccounts: async () => {
    return fetchAPI('/game-accounts/accounts');
  },
  
  // Get user's match history
  getMatchHistory: async (gameType = null, limit = 10) => {
    const endpoint = gameType 
      ? `/game-accounts/match-history/${gameType}?limit=${limit}`
      : `/game-accounts/match-history?limit=${limit}`;
    return fetchAPI(endpoint);
  }
};

// Profile services
export const profileService = {
  // Get current user's profile
  getProfile: async () => {
    return fetchAPI('/profile');
  },
  
  // Get public profile of any user
  getPublicProfile: async (userId) => {
    return fetchAPI(`/profile/public/${userId}`);
  }
};

// Tournament services
export const tournamentService = {
  // Get school tournaments
  getSchoolTournaments: async (schoolName) => {
    return fetchAPI(`/tournament/school/${schoolName}`);
  },
  
  // Get available tournaments for current user
  getAvailableTournaments: async () => {
    return fetchAPI('/tournament/available');
  },
  
  // Create tournament (school agent only)
  createTournament: async (tournamentData) => {
    return fetchAPI('/tournament/create', {
      method: 'POST',
      body: JSON.stringify(tournamentData),
    });
  },
  
  // Create multi-school tournament (school agent only)
  createMultiSchoolTournament: async (collaboratingAgents, tournamentData) => {
    return fetchAPI('/tournament/create-multi', {
      method: 'POST',
      body: JSON.stringify({ collaboratingAgents, tournamentData }),
    });
  },
  
  // Register for tournament
  registerForTournament: async (tournamentId, teamName = null, teamMembers = []) => {
    return fetchAPI(`/tournament/register/${tournamentId}`, {
      method: 'POST',
      body: JSON.stringify({ teamName, teamMembers }),
    });
  },
  
  // Get school agents for tournaments
  getSchoolAgents: async (schoolName) => {
    return fetchAPI(`/tournament/agents/${schoolName}`);
  }
};

// Admin services
export const adminService = {
  // Create admin account
  createAdmin: async (email, password, schoolName) => {
    return fetchAPI('/admin/create-admin', {
      method: 'POST',
      body: JSON.stringify({ e_mail: email, password, schoolName }),
    });
  },
  
  // Set user as school agent
  setSchoolAgent: async (userId, schoolName) => {
    return fetchAPI('/admin/set-school-agent', {
      method: 'POST',
      body: JSON.stringify({ userId, schoolName }),
    });
  },
  
  // Get all school agents
  getSchoolAgents: async (schoolName = null) => {
    const url = schoolName 
      ? `/admin/school-agents?schoolName=${encodeURIComponent(schoolName)}`
      : '/admin/school-agents';
    return fetchAPI(url);
  },
  
  // Get all students
  getStudents: async (schoolName = null) => {
    const url = schoolName 
      ? `/admin/students?schoolName=${encodeURIComponent(schoolName)}`
      : '/admin/students';
    return fetchAPI(url);
  },
  
  // Create test student
  createTestStudent: async (email, schoolName) => {
    return fetchAPI('/admin/create-test-student', {
      method: 'POST',
      body: JSON.stringify({ e_mail: email, schoolName }),
    });
  }
};

export default {
  authService,
  riotService,
  gameAccountsService,
  profileService,
  tournamentService,
  adminService
};