const express = require('express');
const {
    createAndUpdateEventQueue,
} = require('../controllers/event.controller');
const router = express.Router();


router.post('/queue', createAndUpdateEventQueue);

module.exports = router;