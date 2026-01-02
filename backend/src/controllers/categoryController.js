const { validationResult } = require('express-validator');
const Category = require('../models/Category');

// Get all categories for user
exports.getCategories = async (req, res) => {
  try {
    const { type, includeInactive } = req.query;
    const filter = { userId: req.userId };
    
    if (type) filter.type = type;
    
    // Only exclude inactive if includeInactive is NOT 'true'
    if (includeInactive !== 'true') {
      filter.isActive = true;
    }

    const categories = await Category.find(filter)
      .populate('parentCategory', 'name')
      .sort({ type: 1, name: 1 });

    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Error al obtener las categorías' });
  }
};

// Get single category
exports.getCategory = async (req, res) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      userId: req.userId
    }).populate('parentCategory', 'name');

    if (!category) {
      return res.status(404).json({ message: 'Categoría no encontrada' });
    }

    res.json(category);
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ message: 'Error al obtener la categoría' });
  }
};

// Create new category
exports.createCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, type, icon, color, parentCategory } = req.body;

    // If parent category is specified, verify it exists and belongs to user
    if (parentCategory) {
      const parent = await Category.findOne({
        _id: parentCategory,
        userId: req.userId,
        type: type // Parent must be same type
      });
      if (!parent) {
        return res.status(400).json({ message: 'Categoría padre inválida' });
      }
    }

    const category = new Category({
      userId: req.userId,
      name,
      type,
      icon,
      color,
      parentCategory
    });

    await category.save();
    res.status(201).json(category);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ message: 'Error al crear la categoría' });
  }
};

// Update category
exports.updateCategory = async (req, res) => {
  try {
    const { name, icon, color, isActive } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (icon !== undefined) updateData.icon = icon;
    if (color !== undefined) updateData.color = color;
    if (isActive !== undefined) updateData.isActive = isActive;

    const category = await Category.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ message: 'Categoría no encontrada' });
    }

    res.json(category);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ message: 'Error al actualizar la categoría' });
  }
};

// Delete category (soft delete)
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { isActive: false },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({ message: 'Categoría no encontrada' });
    }

    // Also deactivate subcategories
    await Category.updateMany(
      { parentCategory: req.params.id, userId: req.userId },
      { isActive: false }
    );

    res.json({ message: 'Categoría eliminada exitosamente' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ message: 'Error al eliminar la categoría' });
  }
};
