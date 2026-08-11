const express = require('express');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authLimiter } = require('../middlewares/rateLimiter.middleware');

const {
  handleValidationErrors,
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  verifyEmailValidation,
} = require('../validations/auth.validation');

const router = express.Router();

router.post(
  '/register',
  authLimiter,
  registerValidation,
  handleValidationErrors,
  authController.register
);

router.post(
  '/login',
  authLimiter,
  loginValidation,
  handleValidationErrors,
  authController.login
);

router.post('/logout', authController.logout);

router.post('/refresh-token', authController.refreshAccessToken);

router.get(
  '/verify-email/:token',
  verifyEmailValidation,
  handleValidationErrors,
  authController.verifyEmail
);

router.post(
  '/forgot-password',
  authLimiter,
  forgotPasswordValidation,
  handleValidationErrors,
  authController.forgotPassword
);

router.post(
  '/reset-password/:token',
  authLimiter,
  resetPasswordValidation,
  handleValidationErrors,
  authController.resetPassword
);

// Protected routes
router.get('/me', authenticate, authController.getMe);

router.put(
  '/profile',
  authenticate,
  authController.updateProfile
);

router.put(
  '/change-password',
  authenticate,
  authController.changePassword
);

module.exports = router;