import axios from 'axios';

const API_BASE_URL = typeof window !== 'undefined' && window.location.port === '5173'
  ? 'http://localhost:8000'
  : '';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to automatically attach JWT token
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 Unauthorized globally
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and user from localStorage if authorization fails
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login page
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const api = {
  // Authentication
  login: async (email, password) => {
    // We send form data according to OAuth2PasswordRequestForm standard if backend uses it, 
    // or standard JSON if the backend expects a JSON body. The prompt said:
    // "sends a POST request to /auth/login with a JSON body of email and password"
    const response = await client.post('/auth/login', { email, password });
    const { access_token, user } = response.data;
    localStorage.setItem('token', access_token);
    localStorage.setItem('user', JSON.stringify(user));
    return response.data;
  },

  signup: async (name, email, password) => {
    const response = await client.post('/auth/signup', { name, email, password });
    const { access_token, user } = response.data;
    localStorage.setItem('token', access_token);
    localStorage.setItem('user', JSON.stringify(user));
    return response.data;
  },

  loginWithGoogle: async (googleToken) => {
    const response = await client.post('/auth/google', { token: googleToken });
    const { access_token, user } = response.data;
    localStorage.setItem('token', access_token);
    localStorage.setItem('user', JSON.stringify(user));
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  // Papers Search
  searchPapers: async (query, limit = 10) => {
    const response = await client.get('/papers/search', {
      params: { query, limit },
    });
    return response.data;
  },

  // Repos Search
  searchRepos: async (query, limit = 10) => {
    const response = await client.get('/repos/search', {
      params: { query, limit },
    });
    return response.data;
  },

  // Differentiation Suggestions
  getDifferentiation: async (problemStatement, papers, repos) => {
    const response = await client.post('/differentiate', {
      problem_statement: problemStatement,
      papers,
      repos,
    });
    return response.data;
  },

  // Tech Stack Recommendation
  getTechStack: async (problemStatement) => {
    const response = await client.post('/tech-stack', {
      problem_statement: problemStatement,
    });
    return response.data;
  },

  // Code Scaffold Generation
  generateCodeJson: async (problemStatement, techStack) => {
    const response = await client.post('/generate-code', {
      problem_statement: problemStatement,
      tech_stack: techStack,
      format: 'json',
    });
    return response.data;
  },

  // Retrieve code ZIP as blob (for direct download trigger in React)
  generateCodeZipBlob: async (problemStatement, techStack) => {
    const response = await client.post(
      '/generate-code',
      {
        problem_statement: problemStatement,
        tech_stack: techStack,
        format: 'zip',
      },
      {
        responseType: 'blob',
      }
    );
    return response.data;
  },

  // AI Assistant Chat
  sendChatMessage: async (message, sessionId = null) => {
    const response = await client.post('/assistant/chat', {
      message,
      session_id: sessionId,
    });
    return response.data;
  },

  // Admin Dashboard Statistics
  getAdminStats: async () => {
    const response = await client.get('/admin/stats');
    return response.data;
  },

  // User Dashboard Activity
  getUserActivity: async () => {
    const response = await client.get('/auth/me/activity');
    return response.data;
  },
};
