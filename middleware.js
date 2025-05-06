/**
 * MyRadio API Middleware
 * 
 * This middleware intercepts all API requests to localhost:3000/api
 * and redirects them to the production API server at virtualradio.h4xd66.easypanel.host
 */

export function middleware(request) {
  const url = new URL(request.url);
  
  // Only intercept API requests
  if (url.pathname.startsWith('/api/')) {
    // Create a new URL pointing to the production API
    const apiUrl = new URL(url.pathname, 'https://virtualradio.h4xd66.easypanel.host/api');
    
    // Preserve query parameters
    apiUrl.search = url.search;
    
    // Log the redirection (visible in browser console)
    console.log(`Redirecting API request from ${url.toString()} to ${apiUrl.toString()}`);
    
    // Redirect the request with all headers
    return new Response(null, {
      status: 307,
      headers: {
        'Location': apiUrl.toString(),
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }
  
  // Pass through all other requests
  return null;
}

export const config = {
  // Only run this middleware for API routes
  matcher: '/api/:path*',
}; 