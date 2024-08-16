const express = require('express');
const { addSection, getSections, getSectionsByProject,getSectionById   } = require('../controllers/sectionController');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/',  addSection);
router.get('/',  getSections);
router.get('/projects/:projectId/sections',  getSectionsByProject);
router.get('/:sectionId', getSectionById);

module.exports = router;
