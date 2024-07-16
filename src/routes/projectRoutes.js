const express = require('express');
const { addProject, getProjects, getProject } = require('../controllers/projectController');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/', auth, addProject);
router.get('/', auth, getProjects);
router.get('/:id', auth, getProject);

module.exports = router;


