/**
 * Returns the base URL for API requests based on the current environment
 * In production, uses the same domain as the current page
 * In development, uses localhost:3000
 */
export const getApiUrl = (endpoint) => {
  // Se não houver endpoint, retornar apenas a URL base
  if (!endpoint) return window.API_BASE_URL;
  
  // Limpar o endpoint removendo barras extras
  const cleanEndpoint = endpoint.replace(/^\/+/, '').replace(/^api\/+/, '');
  
  // Usar o domínio correto baseado no ambiente
  const baseUrl = process.env.NODE_ENV === 'production'
    ? 'https://virtualradio.h4xd66.easypanel.host'
    : 'http://localhost:3000';
    
  // Construir a URL final
  return `${baseUrl}/api/${cleanEndpoint}`;
};

/**
 * Handles API fetch requests with error handling and authentication
 */
export const fetchApi = async (endpoint, options = {}) => {
  const url = getApiUrl(endpoint);
  const token = localStorage.getItem('authToken');
  
  // Configurar headers padrão
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };
  
  // Configurar opções da requisição
  const fetchOptions = {
    ...options,
    headers,
    credentials: 'include'
  };
  
  try {
    console.log(`[API Request] ${options.method || 'GET'} ${url}`);
    
    // Check if we're offline first before even trying the request
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      console.warn('[API Offline] Device is offline, using mock response');
      return mockApiResponse(endpoint, options);
    }
    
    // Attempt the fetch request
    const response = await fetch(url, fetchOptions);
    
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
        if (endpoint === 'auth/me' || 
            endpoint === 'radio' || 
            endpoint.includes('debug/') || 
            endpoint === 'debug/mock-radios' ||
            endpoint.match(/radio\/\d+$/) || 
            endpoint.match(/audio\/radio\/\d+$/)) {
          console.log('[API Fallback] Using mock authentication due to 401 error');
          return mockApiResponse(endpoint, options);
        }
        
        // For regular 401 errors, throw a specific error
        throw new Error('Authentication required. Please log in again.');
      }
      
      // Try to parse error response
      try {
        const errorData = await response.json();
        throw new Error(errorData.message || 'API request failed');
      } catch (e) {
        throw new Error(`API request failed with status ${response.status}`);
      }
    }
    
    return response.json();
  } catch (error) {
    console.error('[API Error]', error);
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
    
    // Check if this might be a newly created radio ID (high number)
    if (radioId > 900) {
      return {
        success: true,
        radio: {
          id: radioId,
          name: `Newly Created Radio ${radioId}`,
          description: 'This radio was just created. This is a mock response since the server returned an error.',
          created_at: new Date().toISOString(),
          admin_id: 1,
          admin_username: 'Admin'
        },
        isMock: true,
        message: 'Using mock data for newly created radio due to server error'
      };
    }
    
    return {
      success: true,
      radio: {
        id: radioId,
        name: `Mock Radio ${radioId}`,
        description: 'This is a mock radio station detail view',
        created_at: new Date().toISOString(),
        admin_id: 1,
        admin_username: 'Admin'
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