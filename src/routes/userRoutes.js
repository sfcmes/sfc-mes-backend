const express = require("express");
const router = express.Router();
const {
  getUserProfile,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getRoles,
  checkUsername,
  assignProjectsToUser,
  checkUsernameAndRole,
} = require("../controllers/userController");
const auth = require("../middleware/auth");

router.post("/check-username", checkUsername);
router.get("/roles", getRoles); // New route to fetch roles
router.post("/check-username-and-role", checkUsernameAndRole); // Add the new route
// router.get('/me',  getUserProfile); // Define this route before the :id route
router.get("/me", auth, getUserProfile);
router.post("/", createUser);
router.get("/:id", getUserById); // This should be after the more specific routes

router.get("/users/roles", getRoles); // New route to fetch roles
// GET all users
router.get("/", getUsers);

// POST create a new user
router.post("/", createUser);
router.post("/:userId/projects", assignProjectsToUser);
router.post("/assign-projects", assignProjectsToUser);

// PUT update an existing user
router.put("/:id", updateUser);

// DELETE a user
router.delete("/:id", deleteUser);

// GET user profile
// router.get('/me', auth, getUserProfile); // Use /me for current user's profile

module.exports = router;
