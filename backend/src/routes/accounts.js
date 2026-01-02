const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const accountController = require('../controllers/accountController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Validation rules
const createAccountValidation = [
  body('name').trim().notEmpty().withMessage('El nombre de la cuenta es requerido'),
  body('type').isIn(['cash', 'wallet', 'bank', 'crypto', 'credit_card']).withMessage('Tipo de cuenta inválido'),
  body('currency').isIn(['ARS', 'USD', 'EUR', 'BRL']).withMessage('Moneda inválida'),
  body('issuer').if(body('type').equals('credit_card')).notEmpty().withMessage('La emisora es requerida'),
  body('last4Digits').if(body('type').equals('credit_card')).isLength({ min: 4, max: 4 }).withMessage('Debe ingresar los últimos 4 dígitos'),
  body('expiryDate').if(body('type').equals('credit_card')).notEmpty().withMessage('El vencimiento es requerido'),
  body('creditLimit').if(body('type').equals('credit_card')).isNumeric().withMessage('El límite de crédito debe ser un número'),
  body('paymentDueDay').if(body('type').equals('credit_card')).isInt({ min: 1, max: 31 }).withMessage('El día de vencimiento debe ser entre 1 y 31')
];

// Routes
router.get('/', accountController.getAccounts);
router.get('/summary', accountController.getSummary);
router.get('/:id', accountController.getAccount);
router.post('/', createAccountValidation, accountController.createAccount);
router.put('/:id', accountController.updateAccount);
router.delete('/:id', accountController.deleteAccount);

module.exports = router;
