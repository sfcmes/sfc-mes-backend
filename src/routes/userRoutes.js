const express = require('express');
const router = express.Router();
const { getUsers, getUserById, createUser, updateUser, deleteUser, getUserProfile  } = require('../controllers/userController');
const auth = require('../middleware/auth');

// GET all users
router.get('/', auth, getUsers);

// GET user by ID
router.get('/:id', auth, getUserById);

// POST create a new user
router.post('/', auth, createUser);

// PUT update an existing user
router.put('/:id', auth, updateUser);

// DELETE a user
router.delete('/:id', auth, deleteUser);

router.get('/me', auth, getUserProfile);

router.put('/me', auth, updateUser);


module.exports = router;
