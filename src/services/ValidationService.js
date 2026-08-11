// Reusable validation helpers.
class ValidationService {
  static isValidEmail(email) {
    return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  static isStrongPassword(password) {
    return typeof password === 'string' && password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
  }

  static isPositiveAmount(amount) {
    return typeof amount === 'number' && Number.isFinite(amount) && amount > 0;
  }

  static isWithinRange(value, min, max) {
    return typeof value === 'number' && value >= min && value <= max;
  }

  static isValidDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end > start;
  }

  static isNonEmptyString(value, { maxLength = Infinity } = {}) {
    return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= maxLength;
  }

  static isValidHexColor(value) {
    return typeof value === 'string' && /^#([0-9A-Fa-f]{3}){1,2}$/.test(value);
  }

  static isValidObjectIdString(value) {
    return typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
  }

  static validateFields(rules) {
    const errors = [];
    for (const [field, isValid, message] of rules) {
      if (!isValid) errors.push({ field, message });
    }
    return { isValid: errors.length === 0, errors };
  }
}

module.exports = ValidationService;
