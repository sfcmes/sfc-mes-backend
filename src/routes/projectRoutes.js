const express = require('express');
const { addProject, getProjects, getProject, updateProject, uploadProjectImage, getProjectImagesController, deleteProject } = require('../controllers/projectController');
const auth = require('../middleware/auth');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');

router.post('/',  addProject);
router.get('/',  getProjects);
router.get('/:id',  getProject);
router.put('/:id',  updateProject);
router.post('/:id/images', auth, upload.single('file'), uploadProjectImage);
router.get('/:id/images', auth, getProjectImagesController);
router.delete('/:id', deleteProject);

module.exports = router;
