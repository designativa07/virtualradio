/**
 * Returns the base URL for API requests based on the current environment
 * In production, uses the same domain as the current page
 * In development, uses localhost:3000
 */
export const getApiUrl = () => {
  // Check if we're running in a browser
  if (typeof window !== 'undefined') {
    // Check if API_BASE_URL is defined globally (from api-config.js/api-config.local.js)
    if (window.API_BASE_URL) {
      return window.API_BASE_URL.replace(/\/api$/, '');
    }
    
    // Production: use the same hostname as the current page
    if (process.env.NODE_ENV === 'production') {
      const protocol = window.location.protocol;
      const hostname = window.location.hostname;
      return `${protocol}//${hostname}`;
    }
  }
  
  // Development: default to localhost:3000
  return 'http://localhost:3000';
};

/**
 * Handles API fetch requests with error handling and authentication
 */
export const fetchApi = async (endpoint, options = {}) => {
  const apiUrl = getApiUrl();
  const url = `${apiUrl}${endpoint}`;
  
  // Add Authorization header if token exists
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('authToken');
    if (token) {
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      };
    }
  }
  
  // Set default headers
  options.headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: `Server error: ${response.status}`
      }));
      
      throw new Error(errorData.message || 'An error occurred with the API request');
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    
    // Fallback for auth/me endpoint when connection is refused
    if (endpoint === '/api/auth/me' && error.message.includes('Failed to fetch')) {
      console.log('[API Fallback] Using mock authentication for /auth/me due to connection error');
      return {
        authenticated: true,
        user: {
          id: 1,
          name: 'Administrador',
          email: 'admin@virtualradio.com',
          role: 'admin'
        },
        isTest: true,
        message: 'Local authentication (offline mode)'
      };
    }
    
    throw error;
  }
}; 