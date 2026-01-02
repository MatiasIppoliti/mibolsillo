const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// Validation rules
const loginValidation = [
  body('email').isEmail().withMessage('Ingrese un email válido'),
  body('password').notEmpty().withMessage('La contraseña es requerida')
];

// Public routes
router.post('/login', loginValidation, authController.login);

// Protected routes
router.get('/profile', auth, authController.getProfile);
router.put('/profile', auth, authController.updateProfile);
router.put('/change-password', auth, authController.changePassword);

module.exports = router;
