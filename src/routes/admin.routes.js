/**
 * backend/src/routes/admin.routes.js
 */

const express = require('express');
const router = express.Router();

const {
  getAdminDashboard,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  blockUser,
  unblockUser,
  getUserStatistics,
  getOverallExpenseStatistics,
  getOverallIncomeStatistics,
} = require('../controllers/admin.controller');

const { authenticate, authorize } = require('../middlewares/auth.middleware');

// All admin routes require authentication and the 'admin' role
router.use(authenticate, authorize('admin'));

router.get('/dashboard', getAdminDashboard);

router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.patch('/users/:id/block', blockUser);
router.patch('/users/:id/unblock', unblockUser);

router.get('/statistics/users', getUserStatistics);
router.get('/statistics/expenses', getOverallExpenseStatistics);
router.get('/statistics/incomes', getOverallIncomeStatistics);

module.exports = router;
