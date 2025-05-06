/**
 * API Proxy - Catch-all route
 * 
 * This file proxies all other API requests to the production API
 * to fix the connection refused errors when accessing localhost:3000/api/...
 */

export default async function handler(req, res) {
  try {
    // Get the path from the request
    const path = req.query.path || [];
    const apiPath = path.join('/');
    
    // Construct the production API URL
    const productionApiUrl = `https://myradio.h4xd66.easypanel.host/api/${apiPath}`;
    
    console.log(`Proxying request to ${productionApiUrl}`);
    
    // Forward the request to the production API with all headers
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // Add Authorization header if present
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }
    
    // Make the request
    const response = await fetch(productionApiUrl, {
      method: req.method,
      headers,
      ...(req.body && req.method !== 'GET' && req.method !== 'HEAD' ? { body: JSON.stringify(req.body) } : {})
    });
    
    // Get the response data
    let data;
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
        return res.status(response.status).send(data);
      }
    } catch (e) {
      data = { success: false, message: 'Invalid response from API' };
    }
    
    // Return the response from the production API
    return res.status(response.status).json(data);
    
  } catch (error) {
    console.error('Error proxying API request:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error proxying API request',
      error: error.message
    });
  }
} 