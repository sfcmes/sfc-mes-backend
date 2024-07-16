const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createUser, findUserByEmail, findUserByUsername } = require('../queries/userQueries');
const { v4: uuidv4 } = require('uuid');

const register = async (req, res) => {
    console.log('register function called');
    const { email, username, password, role_id } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const userData = {
        id: uuidv4(),
        username,
        password_hash: hashedPassword,
        email,
        role_id,
        status: 'Active',
    };
    try {
        const existingUserByEmail = await findUserByEmail(email);
        if (existingUserByEmail) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        const existingUserByUsername = await findUserByUsername(username);
        if (existingUserByUsername) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const user = await createUser(userData);
        res.status(201).json({ message: 'User created successfully', user });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Error creating user' });
    }
};

const login = async (req, res) => {
    console.log('login function called');
    const { email, username, password } = req.body;
  
    try {
      let user;
      if (email) {
        console.log(`Executing query: SELECT * FROM users WHERE email = $1 with email: ${email}`);
        user = await findUserByEmail(email);
      } else if (username) {
        console.log(`Executing query: SELECT * FROM users WHERE username = $1 with username: ${username}`);
        user = await findUserByUsername(username);
      } else {
        return res.status(400).json({ error: 'Email or username must be provided' });
      }
  
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }
  
      const token = jwt.sign({ id: user.id, role: user.role_id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.json({ message: 'Logged in successfully', token });
    } catch (error) {
      console.error('Error logging in:', error);
      res.status(500).json({ error: 'Error logging in' });
    }
  };

module.exports = {
    register,
    login,
};
