const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const goalController = require('../controllers/goalController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Validation rules
const createGoalValidation = [
  body('name').trim().notEmpty().withMessage('El nombre de la meta es requerido'),
  body('targetAmount').isFloat({ min: 1 }).withMessage('El monto objetivo debe ser al menos 1'),
  body('currency').optional().isIn(['ARS', 'USD', 'EUR', 'BRL']).withMessage('Moneda inválida')
];

// Routes
router.get('/', goalController.getGoals);
router.get('/:id', goalController.getGoal);
router.post('/', createGoalValidation, goalController.createGoal);
router.put('/:id', goalController.updateGoal);
router.delete('/:id', goalController.deleteGoal);
router.post('/:id/contribute', goalController.contribute);
router.post('/:id/withdraw', goalController.withdraw);

module.exports = router;
