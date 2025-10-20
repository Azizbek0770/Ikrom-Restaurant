const rateLimit = require('express-rate-limit');

const createLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message: message || 'Too many requests, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false
  });
};

const generalLimiter = createLimiter(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests
  'Too many requests from this IP'
);

const authLimiter = createLimiter(
  15 * 60 * 1000,
  5, // 5 login attempts
  'Too many authentication attempts'
);

const orderLimiter = createLimiter(
  60 * 1000, // 1 minute
  10, // 10 orders per minute
  'Too many orders, please slow down'
);

module.exports = {
  generalLimiter,
  authLimiter,
  orderLimiter
};