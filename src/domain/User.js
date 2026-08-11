// Domain user rules and safe serialization.
const BaseEntity = require('./base/BaseEntity');
const { ROLES } = require('../constants/roles.constant');

class User extends BaseEntity {
  #name;
  #email;
  #role;
  #isActive;
  #isEmailVerified;
  #themePreference;

  constructor({ id, name, email, role = ROLES.USER, isActive = true, isEmailVerified = false, themePreference = 'light', createdAt, updatedAt }) {
    super({ id, createdAt, updatedAt });

    if (!name || name.trim().length < 2) {
      throw new Error('User name must be at least 2 characters');
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('A valid email is required');
    }

    this.#name = name.trim();
    this.#email = email.toLowerCase().trim();
    this.#role = role;
    this.#isActive = isActive;
    this.#isEmailVerified = isEmailVerified;
    this.#themePreference = themePreference;
  }

  get name() {
    return this.#name;
  }
  get email() {
    return this.#email;
  }
  get role() {
    return this.#role;
  }
  get isActive() {
    return this.#isActive;
  }
  get isEmailVerified() {
    return this.#isEmailVerified;
  }
  get themePreference() {
    return this.#themePreference;
  }

  isAdmin() {
    return this.#role === ROLES.ADMIN;
  }

  canLogin() {
    return this.#isActive && this.#isEmailVerified;
  }

  verifyEmail() {
    this.#isEmailVerified = true;
    this.touch();
  }

  deactivate() {
    this.#isActive = false;
    this.touch();
  }

  reactivate() {
    this.#isActive = true;
    this.touch();
  }

  promoteToAdmin() {
    this.#role = ROLES.ADMIN;
    this.touch();
  }

  rename(newName) {
    if (!newName || newName.trim().length < 2) {
      throw new Error('User name must be at least 2 characters');
    }
    this.#name = newName.trim();
    this.touch();
  }

  setThemePreference(theme) {
    if (!['light', 'dark'].includes(theme)) {
      throw new Error('Theme preference must be "light" or "dark"');
    }
    this.#themePreference = theme;
    this.touch();
  }

  static fromDocument(doc) {
    return new User({
      id: doc._id?.toString(),
      name: doc.name,
      email: doc.email,
      role: doc.role,
      isActive: doc.isActive,
      isEmailVerified: doc.isEmailVerified,
      themePreference: doc.themePreference,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  toJSON() {
    return {
      ...super.toJSON(),
      name: this.#name,
      email: this.#email,
      role: this.#role,
      isActive: this.#isActive,
      isEmailVerified: this.#isEmailVerified,
      themePreference: this.#themePreference,
    };
  }
}

module.exports = User;
