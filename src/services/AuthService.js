const jwt = require('jsonwebtoken');
const UserModel = require('../models/User.model');
const EmailService = require('./EmailService');
const ValidationService = require('./ValidationService');
const ApiError = require('../utils/ApiError');
const config = require('../config/env.config');
const UserDomain = require('../domain/User');

class AuthService {
  #userModel;
  #emailService;

  constructor(userModel = UserModel, emailService = new EmailService()) {
    this.#userModel = userModel;
    this.#emailService = emailService;
  }

  #generateTokens(userId) {
    const accessToken = jwt.sign(
      { sub: userId },
      config.jwt.accessSecret,
      { expiresIn: config.jwt.accessExpiry }
    );

    const refreshToken = jwt.sign(
      { sub: userId },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiry }
    );

    return { accessToken, refreshToken };
  }

  async register({ name, email, password }) {
    if (!ValidationService.isNonEmptyString(name, { maxLength: 50 })) {
      throw ApiError.badRequest('A valid name is required');
    }

    if (!ValidationService.isValidEmail(email)) {
      throw ApiError.badRequest('A valid email is required');
    }

    if (!ValidationService.isStrongPassword(password)) {
      throw ApiError.badRequest(
        'Password must be at least 8 characters and include a letter and a number'
      );
    }

    const existing = await this.#userModel.findOne({
      email: email.toLowerCase()
    });

    if (existing) {
      throw ApiError.conflict('An account with this email already exists');
    }

    const userDoc = new this.#userModel({
      name,
      email,
      password,
      isEmailVerified: true,
    });

    await userDoc.save();

    return UserDomain.fromDocument(userDoc);
  }

  async login({ email, password }) {
    if (!ValidationService.isValidEmail(email)) {
      throw ApiError.badRequest('A valid email is required');
    }

    const userDoc = await this.#userModel
      .findOne({ email: email.toLowerCase() })
      .select('+password');

    if (!userDoc) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const isMatch = await userDoc.comparePassword(password);

    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const user = UserDomain.fromDocument(userDoc);

    if (!user.canLogin()) {
      throw ApiError.forbidden('Your account has been disabled');
    }

    userDoc.lastLoginAt = new Date();
    await userDoc.save();

    return {
      user,
      ...this.#generateTokens(userDoc._id.toString())
    };
  }

  async verifyEmail(rawToken) {
    const crypto = require('crypto');

    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const userDoc = await this.#userModel.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!userDoc) {
      throw ApiError.badRequest(
        'Verification link is invalid or has expired'
      );
    }

    userDoc.isEmailVerified = true;
    userDoc.emailVerificationToken = undefined;
    userDoc.emailVerificationExpires = undefined;

    await userDoc.save();

    return UserDomain.fromDocument(userDoc);
  }

  async requestPasswordReset(email) {
    const userDoc = await this.#userModel.findOne({
      email: email.toLowerCase()
    });

    if (!userDoc) return;

    const token = userDoc.generatePasswordResetToken();

    await userDoc.save();

    await this.#emailService
      .sendPasswordResetEmail(userDoc, token)
      .catch(() => {});
  }

  async resetPassword(rawToken, newPassword) {
    if (!ValidationService.isStrongPassword(newPassword)) {
      throw ApiError.badRequest(
        'Password must be at least 8 characters and include a letter and a number'
      );
    }

    const crypto = require('crypto');

    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const userDoc = await this.#userModel.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!userDoc) {
      throw ApiError.badRequest(
        'Reset link is invalid or has expired'
      );
    }

    userDoc.password = newPassword;
    userDoc.passwordResetToken = undefined;
    userDoc.passwordResetExpires = undefined;

    await userDoc.save();
  }

  async updateProfile(userId, { name, email }) {
    const userDoc = await this.#userModel.findById(userId);

    if (!userDoc) {
      throw ApiError.notFound('User not found');
    }

    if (name !== undefined) {
      if (!ValidationService.isNonEmptyString(name, { maxLength: 50 })) {
        throw ApiError.badRequest('A valid name is required');
      }

      userDoc.name = name.trim();
    }

    if (email !== undefined) {
      if (!ValidationService.isValidEmail(email)) {
        throw ApiError.badRequest('A valid email is required');
      }

      const newEmail = email.toLowerCase().trim();

      if (newEmail !== userDoc.email) {
        const existing = await this.#userModel.findOne({
          email: newEmail,
          _id: { $ne: userId }
        });

        if (existing) {
          throw ApiError.conflict(
            'An account with this email already exists'
          );
        }

        userDoc.email = newEmail;
      }
    }

    await userDoc.save();

    return UserDomain.fromDocument(userDoc);
  }

  async changePassword(userId, currentPassword, newPassword) {
    if (!currentPassword) {
      throw ApiError.badRequest('Current password is required');
    }

    if (!ValidationService.isStrongPassword(newPassword)) {
      throw ApiError.badRequest(
        'Password must be at least 8 characters and include a letter and a number'
      );
    }

    const userDoc = await this.#userModel
      .findById(userId)
      .select('+password');

    if (!userDoc) {
      throw ApiError.notFound('User not found');
    }

    const isMatch = await userDoc.comparePassword(currentPassword);

    if (!isMatch) {
      throw ApiError.unauthorized('Current password is incorrect');
    }

    userDoc.password = newPassword;

    await userDoc.save();
  }

  refreshAccessToken(refreshToken) {
    try {
      const payload = jwt.verify(
        refreshToken,
        config.jwt.refreshSecret
      );

      return this.#generateTokens(payload.sub).accessToken;
    } catch {
      throw ApiError.unauthorized(
        'Invalid or expired refresh token'
      );
    }
  }
}

module.exports = AuthService;