const express = require('express');
const { runCode } = require('../controllers/executionController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/execute', authenticate, runCode);

module.exports = router;
