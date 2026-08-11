// User data model.
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { ROLE_VALUES, ROLES } = require('../constants/roles.constant');

const SALT_ROUNDS = 12; // 12 is the current industry-recommended cost factor for bcrypt

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true, // creates a unique index — no two users can share an email
      lowercase: true, // normalizes before saving so "A@x.com" and "a@x.com" collide correctly
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
    },

    // Never store plain-text passwords. `select: false` means password is
    // EXCLUDED from query results by default — a developer has to explicitly
    // opt in with .select('+password') during login, which prevents it from
    // ever accidentally leaking in a normal `User.find()` response.
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },

    role: {
      type: String,
      enum: {
        values: ROLE_VALUES,
        message: 'Role must be either "user" or "admin"',
      },
      default: ROLES.USER,
    },

    avatar: {
      // Cloud-hosted profile picture (Cloudinary/S3 URL), uploaded via Multer.
      url: { type: String, default: '' },
      publicId: { type: String, default: '' }, // needed to delete/replace the file on the cloud provider
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },

    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },

    // Admin feature: disable a user without deleting their data.
    isActive: {
      type: Boolean,
      default: true,
    },

    // Per-user preference, read by the frontend ThemeContext on login.
    themePreference: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light',
    },

    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true, // adds createdAt / updatedAt automatically
  }
);

// ----------------------------------------------------------------------
// INDEXES
// ----------------------------------------------------------------------
// `unique: true` above already creates an index on email, but declaring it
// explicitly here documents WHY: nearly every auth query is `findOne({ email })`,
// so this index keeps login/signup lookups fast even as the users collection grows.
// userSchema.index({ email: 1 }, { unique: true });
// Speeds up the admin "manage users" table when filtering by role or active status.
userSchema.index({ role: 1, isActive: 1 });

// ----------------------------------------------------------------------
// MIDDLEWARE (HOOKS)
// ----------------------------------------------------------------------
// Hash the password automatically before saving — this guarantees a
// plain-text password can NEVER reach the database, even if a developer
// forgets to hash it manually in a controller/service.
userSchema.pre('save', async function hashPassword(next) {
  // Only re-hash if the password was actually modified (avoids re-hashing
  // an already-hashed password every time the user updates their profile).
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
  next();
});

// ----------------------------------------------------------------------
// INSTANCE METHODS
// ----------------------------------------------------------------------
// Encapsulates password comparison so controllers never touch bcrypt
// directly — they just call `user.comparePassword(candidate)`.
userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Generates a random token for email verification, hashes it for storage
// (so the DB never holds the raw token — same principle as passwords),
// and returns the RAW token to be emailed to the user.
userSchema.methods.generateEmailVerificationToken = function generateEmailVerificationToken() {
  const rawToken = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return rawToken;
};

// Same pattern as above, for password-reset links.
userSchema.methods.generatePasswordResetToken = function generatePasswordResetToken() {
  const rawToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  this.passwordResetExpires = Date.now() + 15 * 60 * 1000; // 15 minutes — short-lived on purpose
  return rawToken;
};

// Strips sensitive/internal fields before sending a user object to the
// client. Called explicitly wherever a user document is returned in a
// response, so tokens and password hashes can never leak.
userSchema.methods.toSafeObject = function toSafeObject() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.emailVerificationToken;
  delete obj.emailVerificationExpires;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
