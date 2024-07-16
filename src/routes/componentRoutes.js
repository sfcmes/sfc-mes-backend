const express = require('express');
const router = express.Router();
const { addComponent, getComponents } = require('../controllers/componentController');
const auth = require('../middleware/auth');

router.post('/', auth, addComponent);
router.get('/:sectionId', auth, getComponents);

module.exports = router;
