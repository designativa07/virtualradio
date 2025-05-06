/**
 * Local API Configuration for VirtualRadio
 * This file configures the connection to the local test server
 */

// Define the API base URL for local development
window.API_BASE_URL = 'http://localhost:3000/api';

// Function to build API URLs
window.getApiUrl = function(endpoint) {
  // Remove leading slash if present
  if (endpoint && endpoint.startsWith('/')) {
    endpoint = endpoint.substring(1);
  }
  return `${window.API_BASE_URL}/${endpoint || ''}`;
};

// Intercept all fetch calls to handle API requests
(function() {
  const originalFetch = window.fetch;
  
  window.fetch = function(url, options = {}) {
    // If it's a call to the local API
    if (typeof url === 'string' && (url.includes('/api/') || url.startsWith('/api/'))) {
      // Normalize the URL
      const apiPath = url.split('/api/')[1];
      const newUrl = `${window.API_BASE_URL}/${apiPath}`;
      
      // Debug log
      console.log(`[API Local] ${url} -> ${newUrl}`);
      
      // Add default headers if they don't exist
      options.headers = options.headers || {};
      options.headers['Content-Type'] = options.headers['Content-Type'] || 'application/json';
      
      // Try to use the local API
      return originalFetch(newUrl, options)
        .catch(error => {
          console.error(`[API Error] Failed to connect to ${newUrl}:`, error.message);
          
          // Fallback for authentication endpoint
          if (url.includes('/auth/me')) {
            console.log('[API Fallback] Using local mock authentication for /auth/me');
            return Promise.resolve(new Response(JSON.stringify({
              authenticated: true,
              user: {
                id: 1,
                name: 'Administrador',
                email: 'admin@virtualradio.com',
                role: 'admin'
              },
              isTest: true,
              message: 'Local authentication (offline mode)'
            }), { 
              status: 200, 
              headers: { 'Content-Type': 'application/json' }
            }));
          }
          
          // For other endpoints without fallback, return the error
          return Promise.reject(error);
        });
    }
    
    // For non-API URLs, use normal fetch
    return originalFetch(url, options);
  };
})();

console.log('[API Config] Local API configuration loaded successfully, using:', window.API_BASE_URL); 