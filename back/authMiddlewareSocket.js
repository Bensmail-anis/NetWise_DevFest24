const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = (socket, next) => {
    // Extract the token from the socket handshake authentication
    const token = socket.handshake.auth.token;
  
    // Check if the token is missing
    if (!token) {
        const err = new Error("Unauthorized - Missing Token");
        err.data = { content: "Please provide a token." };
        return next(err); // Pass the error to the next middleware or error handler
    }
  
    try {
        // Verify the token using the secret key
        const decoded = jwt.verify(token, process.env.SECRET);
        // Attach the user data to the socket object
        socket.user = decoded.user;
        //console.log("User verified in middleware:", socket.user);
        next(); // Proceed to the next middleware or handler
    } catch (error) {
        // Handle errors during token verification
        const err = new Error("Unauthorized - Invalid Token");
        console.error('Error during token verification:', error); // Log the error for debugging
        return next(err); // Pass the error to the next middleware or error handler
    }
};