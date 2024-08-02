const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createUser, findUserByEmail, findUserByUsername } = require('../queries/userQueries');
const { v4: uuidv4 } = require('uuid');

// const register = async (req, res) => {
//     const { email, username, password, role_id } = req.body;
//     const hashedPassword = await bcrypt.hash(password, 10);
//     const userData = {
//         id: uuidv4(),
//         username,
//         password_hash: hashedPassword,
//         email,
//         role_id,
//         status: 'Active',
//     };
//     try {
//         const existingUserByEmail = await findUserByEmail(email);
//         if (existingUserByEmail) {
//             return res.status(400).json({ error: 'Email already exists' });
//         }

//         const existingUserByUsername = await findUserByUsername(username);
//         if (existingUserByUsername) {
//             return res.status(400).json({ error: 'Username already exists' });
//         }

//         const user = await createUser(userData);
//         res.status(201).json({ message: 'User created successfully', user });
//     } catch (error) {
//         console.error('Error creating user:', error);
//         res.status(500).json({ error: 'Error creating user' });
//     }
// };

// const login = async (req, res) => {
//     const { email, username, password } = req.body;

//     try {
//         let user;
//         if (email) {
//             user = await findUserByEmail(email);
//         } else if (username) {
//             user = await findUserByUsername(username);
//         } else {
//             return res.status(400).json({ error: 'Email or username must be provided' });
//         }

//         if (!user) {
//             return res.status(404).json({ error: 'User not found' });
//         }

//         const isMatch = await bcrypt.compare(password, user.password_hash);
//         if (!isMatch) {
//             return res.status(400).json({ error: 'Invalid credentials' });
//         }

//         const token = jwt.sign({ id: user.id, email: user.email, role: user.role_id }, process.env.JWT_SECRET, { expiresIn: '1h' });
//         res.json({ message: 'Logged in successfully', token });
//     } catch (error) {
//         console.error('Error logging in:', error);
//         res.status(500).json({ error: 'Error logging in' });
//     }
// };

const register = async (req, res) => {
    const { email, username, password, role_id } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const userData = {
        id: uuidv4(),
        username,
        password_hash: hashedPassword,
        email,
        role_id,
        status: 'Active', // Ensure this matches your database enum
    };

    try {
        // Check if the email is already in use
        const existingUserByEmail = await findUserByEmail(email);
        if (existingUserByEmail) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        // Check if the username is already in use
        const existingUserByUsername = await findUserByUsername(username);
        if (existingUserByUsername) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Create the new user
        const user = await createUser(userData);
        res.status(201).json({ message: 'User created successfully', user });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Error creating user' });
    }
};

const login = async (req, res) => {
    const { email, username, password } = req.body;

    try {
        let user;
        if (email) {
            user = await findUserByEmail(email);
        } else if (username) {
            user = await findUserByUsername(username);
        } else {
            return res.status(400).json({ error: 'Email or username must be provided' });
        }

        if (!user) {
            return res.status(404).json({ error: 'Invalid credentials' }); // Generic error message
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' }); // Generic error message
        }

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role_id }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({ message: 'Logged in successfully', token });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ error: 'Error logging in' });
    }
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;
  
    try {
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }
  
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }
  
      const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
  
      res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
    } catch (error) {
      console.error('Error logging in:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };

module.exports = { register, login, loginUser };
