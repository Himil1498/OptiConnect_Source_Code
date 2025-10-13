const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getAllTemporaryAccess,
  grantTemporaryAccess,
  revokeTemporaryAccess,
  getMyTemporaryAccess
} = require('../controllers/temporaryAccessController');

router.use(authenticate);

// User endpoint (must be before /:id routes)
router.get('/my-access', getMyTemporaryAccess);

// Admin/Manager endpoints
router.get('/', getAllTemporaryAccess);
router.post('/', grantTemporaryAccess);
router.delete('/:id', revokeTemporaryAccess);

module.exports = router;
