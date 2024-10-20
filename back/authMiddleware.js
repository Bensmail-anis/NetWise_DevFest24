const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = (req, res, next) => {
  // Extract the authorization header from the request
  const authHeader = req.headers.authorization;

  try {
    // Check if the authorization header is missing
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized - Missing Token' });
    }

    // Verify the token using the secret key from the environment variables
    const data = jwt.verify(authHeader, process.env.SECRET);

    // Check if the token does not contain user data
    if (!data.user) {
      return res.status(401).json({ error: 'Unauthorized - Invalid Token' });
    }

    // Attach user data to the request object
    req.user = data.user;
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    // Handle token expiration
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Unauthorized - Token Expired' });
    }

    // Log and handle any other errors that occur during token verification
    console.error('Error during token verification:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};