const express = require('express');
const { addSection, getSections } = require('../controllers/sectionController');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/', auth, addSection);
router.get('/:projectId', auth, getSections);
router.get('/projects/:projectId/sections', auth, getSections);

module.exports = router;
