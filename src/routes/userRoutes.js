const express = require('express');
const router = express.Router();
const { getUserProfile, getUsers, getUserById, createUser, updateUser, deleteUser, getRoles  } = require('../controllers/userController');
const auth = require('../middleware/auth');

router.get('/roles', getRoles); // New route to fetch roles
router.get('/me', auth, getUserProfile); // Define this route before the :id route
router.post('/', createUser);
router.get('/:id', auth, getUserById); // This should be after the more specific routes


router.get('/users/roles', getRoles); // New route to fetch roles
// GET all users
router.get('/', auth, getUsers);


// POST create a new user
router.post('/', auth, createUser);

// PUT update an existing user
router.put('/:id', auth, updateUser);

// DELETE a user
router.delete('/:id', auth, deleteUser);

// GET user profile
// router.get('/me', auth, getUserProfile); // Use /me for current user's profile






module.exports = router;
