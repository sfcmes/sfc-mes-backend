const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const sectionRoutes = require('./routes/sectionRoutes');
const componentRoutes = require('./routes/componentRoutes');
const userRoutes = require('./routes/userRoutes'); // Assuming you have user routes

const app = express();

const allowedOrigins = [
  'http://localhost:3000', 
  'https://sfcpcsystem.ngrok.io', 
  'http://localhost:5173',  // Ensure to use the correct port for your frontend
  'http://localhost:5174'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
};

app.use(cors(corsOptions)); // Enable CORS with the specified options

app.use(bodyParser.json());

app.use((req, res, next) => {
  console.log(`Received request: ${req.method} ${req.url}`);
  next();
});

app.use('/api/auth', authRoutes); // Ensure this line is correct
app.use('/api/projects', projectRoutes);
app.use('/api/sections', sectionRoutes);
app.use('/api/users', userRoutes); // Assuming you have user routes
app.use('/api/components', componentRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
