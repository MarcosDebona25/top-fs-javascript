'use strict';

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../lib/async-handler');
const homeController = require('../controllers/home');

router.get('/', asyncHandler(homeController.showHome));

module.exports = router;
