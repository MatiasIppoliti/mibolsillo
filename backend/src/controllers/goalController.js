const { validationResult } = require('express-validator');
const Goal = require('../models/Goal');

// Get all goals for user
exports.getGoals = async (req, res) => {
  try {
    const { includeCompleted } = req.query;
    const filter = { userId: req.userId };
    
    if (!includeCompleted) filter.isCompleted = false;

    const goals = await Goal.find(filter).sort({ deadline: 1, createdAt: -1 });
    res.json(goals);
  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json({ message: 'Error al obtener las metas' });
  }
};

// Get single goal
exports.getGoal = async (req, res) => {
  try {
    const goal = await Goal.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!goal) {
      return res.status(404).json({ message: 'Meta no encontrada' });
    }

    res.json(goal);
  } catch (error) {
    console.error('Get goal error:', error);
    res.status(500).json({ message: 'Error al obtener la meta' });
  }
};

// Create new goal
exports.createGoal = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, targetAmount, currentAmount, currency, deadline, color, icon } = req.body;

    const goal = new Goal({
      userId: req.userId,
      name,
      targetAmount,
      currentAmount: currentAmount || 0,
      currency: currency || 'ARS',
      deadline,
      color,
      icon
    });

    await goal.save();
    res.status(201).json(goal);
  } catch (error) {
    console.error('Create goal error:', error);
    res.status(500).json({ message: 'Error al crear la meta' });
  }
};

// Update goal
exports.updateGoal = async (req, res) => {
  try {
    const { name, targetAmount, deadline, color, icon, isCompleted } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (targetAmount !== undefined) updateData.targetAmount = targetAmount;
    if (deadline !== undefined) updateData.deadline = deadline;
    if (color !== undefined) updateData.color = color;
    if (icon !== undefined) updateData.icon = icon;
    if (isCompleted !== undefined) updateData.isCompleted = isCompleted;

    const goal = await Goal.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!goal) {
      return res.status(404).json({ message: 'Meta no encontrada' });
    }

    res.json(goal);
  } catch (error) {
    console.error('Update goal error:', error);
    res.status(500).json({ message: 'Error al actualizar la meta' });
  }
};

// Delete goal
exports.deleteGoal = async (req, res) => {
  try {
    const goal = await Goal.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!goal) {
      return res.status(404).json({ message: 'Meta no encontrada' });
    }

    res.json({ message: 'Meta eliminada exitosamente' });
  } catch (error) {
    console.error('Delete goal error:', error);
    res.status(500).json({ message: 'Error al eliminar la meta' });
  }
};

// Add contribution to goal
exports.contribute = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'El monto debe ser mayor a 0' });
    }

    const goal = await Goal.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!goal) {
      return res.status(404).json({ message: 'Meta no encontrada' });
    }

    goal.currentAmount += amount;

    // Check if goal is completed
    if (goal.currentAmount >= goal.targetAmount) {
      goal.isCompleted = true;
    }

    await goal.save();

    res.json({
      message: 'Contribución agregada exitosamente',
      goal
    });
  } catch (error) {
    console.error('Contribute error:', error);
    res.status(500).json({ message: 'Error al agregar contribución' });
  }
};

// Withdraw from goal
exports.withdraw = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'El monto debe ser mayor a 0' });
    }

    const goal = await Goal.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!goal) {
      return res.status(404).json({ message: 'Meta no encontrada' });
    }

    if (amount > goal.currentAmount) {
      return res.status(400).json({ message: 'Monto mayor al disponible' });
    }

    goal.currentAmount -= amount;
    goal.isCompleted = false;

    await goal.save();

    res.json({
      message: 'Retiro registrado exitosamente',
      goal
    });
  } catch (error) {
    console.error('Withdraw error:', error);
    res.status(500).json({ message: 'Error al registrar retiro' });
  }
};
