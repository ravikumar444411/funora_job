const express = require('express');
const { createAndUpdateInstaPostQueue } = require('../controller/insta_index');

const router = express.Router();

router.post('/post_insta', createAndUpdateInstaPostQueue);

module.exports = router;
