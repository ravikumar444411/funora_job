const express = require('express');
const {
    bulkPushNotification
} = require('../controllers/notification.controller');

const router = express.Router();


router.post('/bulk', bulkPushNotification);

module.exports = router;
