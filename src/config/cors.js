// src/config/cors.js
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'https://sfcpcbackend.ngrok.app'];

console.log('Allowed origins:', allowedOrigins);

module.exports = {
  origin: function (origin, callback) {
    console.log('Received request from origin:', origin);
    if (!origin) {
      console.log('No origin specified (e.g., same-origin request)');
      callback(null, true);
    } else if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('Origin is allowed');
      callback(null, true);
    } else {
      console.log('Origin is not allowed');
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204,
  maxAge: 3600
};