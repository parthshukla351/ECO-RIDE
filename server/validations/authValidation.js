const { body } = require('express-validator');

exports.registerValidation = [
  body('name')
    .notEmpty()
    .trim()
    .withMessage('Name is required')
    .isLength({ max: 50 })
    .withMessage('Name cannot exceed 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('phone')
    .matches(/^[0-9]{10}$/)
    .withMessage('Valid 10-digit phone number is required'),
  body('role')
    .isIn(['passenger', 'driver'])
    .withMessage('Role must be passenger or driver'),
  body('gender')
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender is required')
];
