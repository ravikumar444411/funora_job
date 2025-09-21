const express = require('express');
const {
    createReminderQueue,
} = require('../controllers/reminder.controller');
const router = express.Router();


router.post('/queue', createReminderQueue);

module.exports = router;