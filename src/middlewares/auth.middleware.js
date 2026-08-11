// JWT auth and role checks.
const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const config = require('../config/env.config');
const UserModel = require('../models/User.model');
const UserDomain = require('../domain/User');

// Reads "Authorization: Bearer <token>" and returns just the token, or
// null if the header is missing/malformed — kept separate so the main
// function reads as a clear sequence of steps.
function extractBearerToken(req) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.split(' ')[1];
}

// Verifies the access token, loads the corresponding user, and re-checks
// the SAME business rule User.canLogin() enforces at login time — this
// means a token issued before an admin disabled the account stops working
// on its very next request, rather than staying valid until it expires.
const authenticate = asyncHandler(async (req, res, next) => {
  const token = extractBearerToken(req);

  if (!token) {
    throw ApiError.unauthorized("Authentication token is missing");
  }

  let payload;
  try {
    payload = jwt.verify(token, config.jwt.accessSecret);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Access token has expired');
    }
    throw ApiError.unauthorized('Invalid access token');
  }

  const userDoc = await UserModel.findById(payload.sub);
  if (!userDoc) {
    throw ApiError.unauthorized('User belonging to this token no longer exists');
  }

  const user = UserDomain.fromDocument(userDoc);
  if (!user.canLogin()) {
    throw ApiError.forbidden('This account is no longer active');
  }

  req.user = user;
  req.userId = userDoc._id.toString();

  next();
});

function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      // Defensive check — indicates a route wired authorize() without
      // authenticate() first, which is a developer mistake, not a client error.
      throw ApiError.unauthorized('Authentication is required before authorization');
    }
    if (!allowedRoles.includes(req.user.role)) {
      throw ApiError.forbidden('You do not have permission to perform this action');
    }
    next();
  };
}

module.exports = { authenticate, authorize };
