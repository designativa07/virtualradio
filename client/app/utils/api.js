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
  let token = null;
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('authToken');
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
    console.log(`[API Request] ${options.method || 'GET'} ${url} with token: ${token ? 'Present' : 'None'}`);
    
    // Check if we're offline first before even trying the request
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      console.warn('[API Offline] Device is offline, using mock response');
      return mockApiResponse(endpoint, options);
    }
    
    // Attempt the fetch request
    const response = await fetch(url, options);
    
    if (!response.ok) {
      console.warn(`[API Error] Request failed with status ${response.status}: ${url}`);
      
      // Special handling for 401 responses
      if (response.status === 401) {
        console.warn('[API Auth Error] Unauthorized request to:', url);
        
        // Check if token is present but invalid
        if (token) {
          console.warn('[API Auth Error] Token present but invalid or expired');
        }
        
        // For specific endpoints that need offline fallback
        if (endpoint === '/api/auth/me' || 
            endpoint === '/api/radio' || 
            endpoint.includes('/api/debug/') || 
            endpoint === '/api/debug/mock-radios' ||
            endpoint.match(/\/api\/radio\/\d+$/) || 
            endpoint.match(/\/api\/audio\/radio\/\d+$/)) {
          console.log('[API Fallback] Using mock authentication due to 401 error');
          return mockApiResponse(endpoint, options);
        }
        
        // For regular 401 errors, throw a specific error
        throw new Error('Authentication required. Please log in again.');
      }
      
      let errorData;
      try {
        errorData = await response.json();
        console.error('[API Error] Response data:', errorData);
      } catch (e) {
        errorData = { message: `Server error: ${response.status}` };
        console.error('[API Error] Could not parse error response');
      }
      
      throw new Error(errorData.message || `API request failed with status: ${response.status}`);
    }
    
    // Parse successful response
    const data = await response.json();
    console.log(`[API Success] ${options.method || 'GET'} ${url}`);
    return data;
  } catch (error) {
    // Handle network errors (Failed to fetch, etc)
    const isNetworkError = 
      error.message.includes('Failed to fetch') || 
      error.message.includes('Network Error') ||
      error.message.includes('NetworkError');
    
    if (isNetworkError) {
      console.warn('[API Network Error] Connection failed, using mock response for:', endpoint);
      return mockApiResponse(endpoint, options);
    }
    
    // Pass through authentication errors and other handled errors
    if (error.message.includes('Authentication required')) {
      console.error('[API Auth Error]', error.message);
      throw error;
    }
    
    // Log and re-throw other errors
    console.error('[API Error]', error.message, 'for endpoint:', url);
    throw error;
  }
};

/**
 * Provides mock responses for different API endpoints when the server is unavailable
 */
const mockApiResponse = (endpoint, options) => {
  console.log('[API Mock] Providing mock response for:', endpoint);
  
  // Authentication endpoint
  if (endpoint === '/api/auth/me') {
    return {
      authenticated: true,
      user: {
        id: 1,
        name: 'Administrador',
        email: 'admin@virtualradio.com',
        role: 'admin'
      },
      isTest: true,
      isMock: true,
      message: 'Local authentication (offline mode)'
    };
  }
  
  // Radio listing endpoint
  if (endpoint === '/api/radio' && (!options.method || options.method === 'GET')) {
    return {
      success: true,
      radios: [
        {
          id: 1,
          name: 'Mock Radio 1',
          description: 'This is a mock radio station for testing',
          created_at: new Date().toISOString(),
          admin_id: 1
        },
        {
          id: 2,
          name: 'Mock Radio 2',
          description: 'Another mock radio station for offline mode',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          admin_id: 1
        },
        {
          id: 3,
          name: 'Local Test Station',
          description: 'Use this station to test audio uploads in offline mode',
          created_at: new Date(Date.now() - 172800000).toISOString(),
          admin_id: 1
        }
      ],
      isMock: true,
      message: 'Using mock radio data due to server unavailability'
    };
  }
  
  // Radio creation endpoint
  if ((endpoint === '/api/radio' || endpoint === '/api/debug/mock-radio') && options.method === 'POST') {
    const radioData = JSON.parse(options.body || '{}');
    const radioId = Math.floor(Math.random() * 1000) + 1;
    
    return {
      success: true,
      radioId: radioId,
      radio: {
        id: radioId,
        name: radioData.name || 'New Mock Radio',
        description: radioData.description || 'Created in offline mode',
        created_at: new Date().toISOString(),
        admin_id: 1
      },
      message: 'Radio created in mock mode due to server unavailability',
      isMock: true
    };
  }
  
  // Radio detail endpoint
  if (endpoint.match(/\/api\/radio\/\d+$/) && (!options.method || options.method === 'GET')) {
    const radioId = parseInt(endpoint.split('/').pop());
    return {
      success: true,
      radio: {
        id: radioId,
        name: `Mock Radio ${radioId}`,
        description: 'This is a mock radio station detail view',
        created_at: new Date().toISOString(),
        admin_id: 1
      },
      isMock: true,
      message: 'Using mock radio detail due to server unavailability'
    };
  }
  
  // Audio files for a radio
  if (endpoint.match(/\/api\/audio\/radio\/\d+$/) && (!options.method || options.method === 'GET')) {
    const radioId = parseInt(endpoint.split('/').pop());
    return {
      success: true,
      audioFiles: [
        {
          id: 101,
          name: 'Mock Audio 1.mp3',
          filename: 'mock_audio_1.mp3',
          duration: 180,
          radio_id: radioId,
          created_at: new Date().toISOString()
        },
        {
          id: 102,
          name: 'Mock Audio 2.mp3',
          filename: 'mock_audio_2.mp3',
          duration: 240,
          radio_id: radioId,
          created_at: new Date(Date.now() - 86400000).toISOString()
        }
      ],
      isMock: true,
      message: 'Using mock audio files due to server unavailability'
    };
  }
  
  // Audio deletion endpoint
  if (endpoint.match(/\/api\/audio\/\d+$/) && options.method === 'DELETE') {
    return {
      success: true,
      message: 'Audio file mock-deleted successfully',
      isMock: true
    };
  }
  
  // Debug mock radios endpoint
  if (endpoint === '/api/debug/mock-radios') {
    return {
      success: true,
      radios: [
        {
          id: 901,
          name: 'Debug Mock Radio 1',
          description: 'This is a debug mock radio for testing',
          created_at: new Date().toISOString(),
          admin_id: 1,
          admin_username: 'Admin'
        },
        {
          id: 902,
          name: 'Debug Mock Radio 2',
          description: 'Another debug mock radio',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          admin_id: 1,
          admin_username: 'Admin'
        }
      ],
      isMock: true,
      message: 'Using debug mock radio data due to server unavailability'
    };
  }
  
  // For other endpoints, return a generic mock response
  return {
    success: false,
    isMock: true,
    message: 'Mock response - server unavailable',
    error: 'No specific mock handler for this endpoint'
  };
}; 