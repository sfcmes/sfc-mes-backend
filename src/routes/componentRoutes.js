const express = require('express');
const { addComponent, getComponents } = require('../controllers/componentController');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/', auth, addComponent);
router.get('/', auth, getComponents);

module.exports = router;
