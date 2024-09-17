const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getRoles,
  checkUsername
} = require('../controllers/userController');
const auth = require('../middleware/auth');

// Public routes
router.post('/check-username', checkUsername);
router.get('/roles', getRoles);

// User management routes
router.get('/', getUsers);
router.post('/', createUser);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

// Authenticated routes
router.get('/me', auth, getUserProfile);

module.exports = router;