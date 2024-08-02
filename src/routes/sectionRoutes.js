const express = require('express');
const { addSection, getSections, getSectionsByProject,getSectionById   } = require('../controllers/sectionController');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/', auth, addSection);
router.get('/', auth, getSections);
router.get('/projects/:projectId/sections', auth, getSectionsByProject);
router.get('/:sectionId', getSectionById);

module.exports = router;
