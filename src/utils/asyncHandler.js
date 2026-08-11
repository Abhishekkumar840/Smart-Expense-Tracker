// Wrap async controllers for Express error handling.
const asyncHandler = (requestHandler) => (req, res, next) => {
  Promise.resolve(requestHandler(req, res, next)).catch(next);
};

module.exports = asyncHandler;
