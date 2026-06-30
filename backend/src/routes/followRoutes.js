const express = require('express');
const router = express.Router();
const followController = require('../controllers/followController');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, followController.followUser);
router.delete('/:user_id', authenticate, followController.unfollowUser);
router.get('/check/:user_id', authenticate, followController.checkFollow);
router.get('/:user_id/followers', followController.getFollowers);
router.get('/:user_id/following', followController.getFollowing);

module.exports = router;