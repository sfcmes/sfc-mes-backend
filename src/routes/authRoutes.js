// const express = require('express');
// const { register, login } = require('../controllers/authController');

// const router = express.Router();

// router.post('/register', (req, res, next) => {
//   console.log('POST /api/auth/register');
//   next();
// }, register);

// router.post('/login', (req, res, next) => {
//   console.log('POST /api/auth/login');
//   next();
// }, login);

// module.exports = router;

const express = require('express');
const { login, register } = require('../controllers/authController');
const router = express.Router();

router.post('/login', login);
router.post('/register', register);

module.exports = router;

