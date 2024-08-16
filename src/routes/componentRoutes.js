const express = require('express');
const { addComponent, getComponents, getComponentsByProjectId, uploadFileMiddleware, getComponentById, addComponentHistory, updateComponent } = require('../controllers/componentController');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/', auth, uploadFileMiddleware, addComponent); // Use the middleware for file upload
router.get('/', getComponents);
router.get('/project/:projectId', getComponentsByProjectId);
router.get('/:id', getComponentById);  // Add this new route
router.post('/componentHistory', auth, addComponentHistory);
router.put('/:id', auth, updateComponent);

module.exports = router;
