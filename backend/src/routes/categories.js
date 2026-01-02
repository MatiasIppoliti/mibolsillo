const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Validation rules
const createCategoryValidation = [
  body('name').trim().notEmpty().withMessage('El nombre de la categoría es requerido'),
  body('type').isIn(['income', 'expense']).withMessage('Tipo de categoría inválido')
];

// Routes
router.get('/', categoryController.getCategories);
router.get('/:id', categoryController.getCategory);
router.post('/', createCategoryValidation, categoryController.createCategory);
router.put('/:id', categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;
