const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const {
  createUser,
  listUsers,
  updateUser,
  deleteUser
} = require('../controllers/userController');

// API 8
router.post('/tenants/:tenantId/users', auth, authorize(['tenant_admin']), createUser);

// API 9
router.get('/tenants/:tenantId/users', auth, listUsers);

// API 10
router.put('/users/:userId', auth, updateUser);

// API 11
router.delete('/users/:userId', auth, authorize(['tenant_admin']), deleteUser);

module.exports = router;
