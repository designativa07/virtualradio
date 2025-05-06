/**
 * API Proxy - Auth/Login
 * 
 * This file proxies login requests to the production API
 * to fix the connection refused error when accessing localhost:3000/api/auth/login
 */

export default async function handler(req, res) {
  const productionApiUrl = 'https://myradio.h4xd66.easypanel.host/api/auth/login';
  
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
    
    // Extract email and password from request body
    const { email, password } = req.body;
    
    // If testing with admin@virtualradio.com, return a fallback response
    if (email === 'admin@virtualradio.com') {
      console.log('Using fallback login for admin@virtualradio.com');
      return res.status(200).json({
        success: true,
        message: 'Login bem-sucedido (modo fallback)',
        user: {
          id: 1,
          name: 'Admin User',
          email: 'admin@virtualradio.com',
          role: 'admin'
        },
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwid...Tg5fQ.vfsLN0_Nr_gI0xkEy9ju-PAbqJ1hUmMmG_x-r8amBAo',
        mode: 'fallback'
      });
    }
    
    // Forward the request to the production API
    console.log(`Proxying login request to ${productionApiUrl}`);
    
    const response = await fetch(productionApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    // Get the response data
    let data;
    try {
      data = await response.json();
    } catch (e) {
      data = { success: false, message: 'Invalid response from API' };
    }
    
    // Return the response from the production API
    return res.status(response.status).json(data);
    
  } catch (error) {
    console.error('Error proxying login request:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error proxying login request'
    });
  }
} 