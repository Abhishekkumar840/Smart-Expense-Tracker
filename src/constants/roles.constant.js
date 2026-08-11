// Shared role constants.
const ROLES = Object.freeze({
  USER: 'user',
  ADMIN: 'admin',
});

// Used by Mongoose schema `enum` validators and by role.middleware.js
const ROLE_VALUES = Object.freeze(Object.values(ROLES));

module.exports = { ROLES, ROLE_VALUES };
