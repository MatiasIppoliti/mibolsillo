const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Validation rules
const createTransactionValidation = [
  body('accountId').isMongoId().withMessage('Cuenta inválida'),
  body('type').isIn(['income', 'expense', 'transfer']).withMessage('Tipo de transacción inválido'),
  body('amount').isFloat({ min: 0.01 }).withMessage('El monto debe ser mayor a 0')
];

// Routes
router.get('/', transactionController.getTransactions);
router.get('/stats', transactionController.getStats);
router.get('/:id', transactionController.getTransaction);
router.post('/', createTransactionValidation, transactionController.createTransaction);
router.put('/:id', transactionController.updateTransaction);
router.delete('/:id', transactionController.deleteTransaction);

module.exports = router;
