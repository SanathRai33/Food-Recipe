const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const { authenticate } = require('../middleware/auth');

router.get('/feed', authenticate, activityController.getActivityFeed);
router.get('/me', authenticate, activityController.getMyActivities);
router.get('/user/:userId', authenticate, activityController.getUserActivities);

module.exports = router;