const jwt = require('jsonwebtoken');
const Admin = require('../model/Admin');

const auth = async (req, res, next) => {
  try {
    const token = req.cookies.admin_token;

    // Verify and decode the JWT token
    
    // Find the admin using the token and decoded JWT data
    const admin = await Admin.findOne({ tokens: token });

    if (!admin) {
      return res.status(401).json({ message: 'Authentication failed. Invalid token.' });
    }

    // Attach the admin data to the req object
    req.admin = admin;
    console.log(req.admin);

    // Proceed to the next middleware or route
    next();
  } catch (error) {
    console.error(error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = auth;
