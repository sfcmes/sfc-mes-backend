const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://13.251.248.92', 'http://www.sfcpcsystem.com', '*.sfcpcsystem.com'];

const log = (message, origin) => {
  console.log(`[${new Date().toISOString()}] CORS - ${message}`, origin ? `Origin: ${origin}` : '');
};

const isAllowedOrigin = (origin) => {
  return allowedOrigins.some(allowedOrigin => {
    if (allowedOrigin.includes('*')) {
      const regex = new RegExp('^' + allowedOrigin.replace('*', '.*') + '$');
      return regex.test(origin);
    }
    return allowedOrigin === origin;
  });
};

log('Allowed origins:', allowedOrigins);

module.exports = {
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
      callback(new Error(`Origin ${origin} is not allowed by CORS`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204,
  maxAge: 3600
};