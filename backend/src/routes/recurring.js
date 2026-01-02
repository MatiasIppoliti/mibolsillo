const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const recurringController = require('../controllers/recurringController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Validation rules
const createRecurringValidation = [
  body('accountId').isMongoId().withMessage('Cuenta inválida'),
  body('categoryId').isMongoId().withMessage('Categoría inválida'),
  body('name').trim().notEmpty().withMessage('El nombre es requerido'),
  body('amount').isFloat({ min: 0.01 }).withMessage('El monto debe ser mayor a 0'),
  body('frequency').isIn(['daily', 'weekly', 'monthly', 'yearly']).withMessage('Frecuencia inválida')
];

// Routes
router.get('/', recurringController.getRecurring);
router.get('/upcoming', recurringController.getUpcoming);
router.get('/:id', recurringController.getRecurringById);
router.post('/', createRecurringValidation, recurringController.createRecurring);
router.put('/:id', recurringController.updateRecurring);
router.delete('/:id', recurringController.deleteRecurring);
router.post('/:id/pay', recurringController.payRecurring);

module.exports = router;
