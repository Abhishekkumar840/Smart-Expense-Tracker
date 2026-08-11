const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const AuthService = require('../services/AuthService');
const config = require('../config/env.config');

const authService = new AuthService();

const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

function setRefreshCookie(res, token) {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'strict',
    maxAge: REFRESH_COOKIE_MAX_AGE,
  });
}

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const user = await authService.register({
    name,
    email,
    password,
  });

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { user },
        'Account created. Please check your email to verify your account.'
      )
    );
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const { user, accessToken, refreshToken } =
    await authService.login({
      email,
      password,
    });

  setRefreshCookie(res, refreshToken);

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user, accessToken },
        'Login successful'
      )
    );
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie(REFRESH_COOKIE_NAME);

  res
    .status(200)
    .json(
      new ApiResponse(200, null, 'Logged out successfully')
    );
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];

  if (!token) {
    return res
      .status(401)
      .json(
        new ApiResponse(401, null, 'Refresh token is missing')
      );
  }

  const accessToken = authService.refreshAccessToken(token);

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { accessToken },
        'Access token refreshed'
      )
    );
});

const getMe = asyncHandler(async (req, res) => {
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user: req.user },
        'Current user fetched'
      )
    );
});

const updateProfile = asyncHandler(async (req, res) => {
  const { name, email } = req.body;

  const user = await authService.updateProfile(
    req.user.id,
    { name, email }
  );

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user },
        'Profile updated successfully'
      )
    );
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  await authService.changePassword(
    req.user.id,
    currentPassword,
    newPassword
  );

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        null,
        'Password changed successfully'
      )
    );
});

const verifyEmail = asyncHandler(async (req, res) => {
  const user = await authService.verifyEmail(req.params.token);

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user },
        'Email verified successfully'
      )
    );
});

const forgotPassword = asyncHandler(async (req, res) => {
  await authService.requestPasswordReset(req.body.email);

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        null,
        'If an account with that email exists, a reset link has been sent.'
      )
    );
});

const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(
    req.params.token,
    req.body.password
  );

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        null,
        'Password has been reset. You can now log in.'
      )
    );
});

module.exports = {
  register,
  login,
  logout,
  refreshAccessToken,
  getMe,
  updateProfile,
  changePassword,
  verifyEmail,
  forgotPassword,
  resetPassword,
};