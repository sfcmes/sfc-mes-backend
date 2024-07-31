const {
  getAllUsers,
  createUser: queryCreateUser,
  updateUserById,
  deleteUserById
} = require('../queries/userQueries');
const { getUserById: queryGetUserById, getUserByEmail: queryGetUserByEmail } = require('../queries/userQueries');

// GET all users
const getUsers = async (req, res) => {
  try {
      const users = await getAllUsers();
      res.json(users);
  } catch (error) {
      res.status(500).json({ error: 'Error retrieving users' });
  }
};

// GET user by ID
const getUserById = async (req, res) => {
  const { id } = req.params;
  try {
      const user = await queryGetUserById(id); // Use renamed function
      if (!user) {
          return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
  } catch (error) {
      res.status(500).json({ error: 'Error retrieving user' });
  }
};

const getUserProfile = async (req, res) => {
  console.log('Fetching user profile for user:', req.user); // Log the entire user object
  try {
      const userId = req.user.id;
      const userEmail = req.user.email;
      console.log('userId:', userId); // Log userId
      console.log('userEmail:', userEmail); // Log userEmail

      let user;
      if (userId) {
          console.log(`Querying database for user ID: ${userId}`);
          user = await queryGetUserById(userId);
      } else if (userEmail) {
          console.log(`Querying database for user email: ${userEmail}`);
          user = await queryGetUserByEmail(userEmail);
      } else {
          return res.status(400).json({ error: 'User ID or email must be provided' });
      }

      console.log('User found:', user);
      if (!user) {
          return res.status(404).json({ error: 'User not found' });
      }

      res.json(user);
  } catch (error) {
      console.error('Error fetching user profile:', error);
      res.status(500).json({ error: 'Error retrieving user' });
  }
};

// const getUserProfileById = async (req, res) => {
//   const userId = req.params.id;
//   console.log(`Fetching user profile for user ID: ${userId}`);

//   // Check if the user ID is valid UUID
//   const isValidUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[4-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(userId);
//   if (!isValidUUID) {
//       return res.status(400).json({ error: 'Invalid user ID format' });
//   }

//   // Check if the user is authorized to access this resource
//   if (req.user.id !== userId && req.user.role !== 'Admin') {
//       return res.status(403).json({ error: 'Access denied' });
//   }

//   try {
//       const user = await queryGetUserById(userId);
//       console.log('User found:', user);
//       if (!user) {
//           return res.status(404).json({ error: 'User not found' });
//       }
//       res.json(user);
//   } catch (error) {
//       console.error('Error fetching user profile:', error);
//       res.status(500).json({ error: 'Error retrieving user' });
//   }
// };
const getUserProfileById = async (req, res) => {
    const { id } = req.params;
    console.log(`Fetching user profile for user ID: ${id}`);
    try {
        const user = await queryGetUserById(id); // Use renamed function
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Error retrieving user' });
    }
  };

// POST create a new user
const createUser = async (req, res) => {
  const { username, password, email, roleId, status } = req.body;
  const userData = {
      username,
      password, // Ensure to hash the password securely before storing
      email,
      roleId,
      status
  };
  try {
      const newUser = await queryCreateUser(userData); // Use renamed function
      res.status(201).json({ message: 'User created successfully', user: newUser });
  } catch (error) {
      res.status(500).json({ error: 'Error creating user' });
  }
};

// PUT update an existing user
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, email, roleId, status } = req.body;
  const updatedUserData = {
      username,
      email,
      roleId,
      status
  };
  try {
      const updatedUser = await updateUserById(id, updatedUserData);
      if (!updatedUser) {
          return res.status(404).json({ error: 'User not found' });
      }
      res.json({ message: 'User updated successfully', user: updatedUser });
  } catch (error) {
      res.status(500).json({ error: 'Error updating user' });
  }
};

// DELETE a user
const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
      const deletedUser = await deleteUserById(id);
      if (!deletedUser) {
          return res.status(404).json({ error: 'User not found' });
      }
      res.json({ message: 'User deleted successfully', user: deletedUser });
  } catch (error) {
      res.status(500).json({ error: 'Error deleting user' });
  }
};

module.exports = { getUserProfile, getUserProfileById,  getUsers, getUserById, createUser, updateUser, deleteUser };