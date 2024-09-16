const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [
      'http://13.251.248.92',
      'https://13.251.248.92',
      'http://www.sfcpcsystem.com',
      'https://www.sfcpcsystem.com',
      'http://sfcpcsystem.com',
      'https://sfcpcsystem.com',
      'http://localhost:5173'
    ];

const log = (message, origin) => {
  console.log(`[${new Date().toISOString()}] CORS - ${message}`, origin ? `Origin: ${origin}` : '');
};

const isAllowedOrigin = (origin) => {
  return allowedOrigins.includes(origin);
};

log('Allowed origins:', allowedOrigins);

const corsOptions = {
  origin: function (origin, callback) {
    log('Received request from origin:', origin);
    if (!origin) {
      log('No origin specified (e.g., same-origin request)');
      callback(null, true);
    } else if (isAllowedOrigin(origin)) {
      log('Origin is allowed');
      callback(null, true);
    } else {
      log('Origin is not allowed');
      callback(new Error(`CORS error: Origin ${origin} is not allowed. Allowed origins are: ${allowedOrigins.join(', ')}`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204,
  maxAge: 3600 // 1 hour, adjust as needed
};

module.exports = {
  corsOptions,
  getCorsOptions: (env) => corsOptions
};
