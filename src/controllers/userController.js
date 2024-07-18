const {
    getAllUsers,
    getUserById: queryGetUserById, // Renamed to avoid conflict
    createUser: queryCreateUser, // Renamed to avoid conflict
    updateUserById,
    deleteUserById
  } = require('../queries/userQueries');
  
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
    console.log('Fetching user profile for user ID:', req.user.id); // Add logging
    try {
        const userId = req.user.id;
        console.log(`Querying database for user ID: ${userId}`); // Add detailed logging
        const user = await queryGetUserById(userId); // Correctly use query function
        console.log('User found:', user); // Add logging
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ error: 'Error fetching user profile' });
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
  
  module.exports = {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    getUserProfile,
  };
  