const { validationResult } = require('express-validator');
const RecurringExpense = require('../models/RecurringExpense');
const Transaction = require('../models/Transaction');
const Account = require('../models/Account');

// Get all recurring expenses for user
exports.getRecurring = async (req, res) => {
  try {
    const { includeInactive } = req.query;
    const filter = { userId: req.userId };
    
    if (!includeInactive) filter.isActive = true;

    const recurring = await RecurringExpense.find(filter)
      .populate('accountId', 'name currency color')
      .populate('categoryId', 'name icon color')
      .sort({ nextDueDate: 1 });

    res.json(recurring);
  } catch (error) {
    console.error('Get recurring error:', error);
    res.status(500).json({ message: 'Error al obtener gastos recurrentes' });
  }
};

// Get single recurring expense
exports.getRecurringById = async (req, res) => {
  try {
    const recurring = await RecurringExpense.findOne({
      _id: req.params.id,
      userId: req.userId
    })
      .populate('accountId', 'name currency color')
      .populate('categoryId', 'name icon color');

    if (!recurring) {
      return res.status(404).json({ message: 'Gasto recurrente no encontrado' });
    }

    res.json(recurring);
  } catch (error) {
    console.error('Get recurring by id error:', error);
    res.status(500).json({ message: 'Error al obtener gasto recurrente' });
  }
};

// Create new recurring expense
exports.createRecurring = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      accountId, 
      categoryId, 
      name, 
      amount, 
      frequency, 
      startDate,
      endDate,
      reminderDaysBefore 
    } = req.body;

    // Verify account belongs to user
    const account = await Account.findOne({ _id: accountId, userId: req.userId });
    if (!account) {
      return res.status(400).json({ message: 'Cuenta no encontrada' });
    }

    const recurring = new RecurringExpense({
      userId: req.userId,
      accountId,
      categoryId,
      name,
      amount,
      currency: account.currency,
      frequency,
      startDate: startDate || new Date(),
      endDate,
      nextDueDate: startDate || new Date(),
      reminderDaysBefore
    });

    await recurring.save();

    const populatedRecurring = await RecurringExpense.findById(recurring._id)
      .populate('accountId', 'name currency color')
      .populate('categoryId', 'name icon color');

    res.status(201).json(populatedRecurring);
  } catch (error) {
    console.error('Create recurring error:', error);
    res.status(500).json({ message: 'Error al crear gasto recurrente' });
  }
};

// Update recurring expense
exports.updateRecurring = async (req, res) => {
  try {
    const { 
      name, 
      amount, 
      frequency, 
      endDate, 
      isActive,
      reminderDaysBefore 
    } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (amount !== undefined) updateData.amount = amount;
    if (frequency !== undefined) updateData.frequency = frequency;
    if (endDate !== undefined) updateData.endDate = endDate;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (reminderDaysBefore !== undefined) updateData.reminderDaysBefore = reminderDaysBefore;

    const recurring = await RecurringExpense.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      updateData,
      { new: true, runValidators: true }
    )
      .populate('accountId', 'name currency color')
      .populate('categoryId', 'name icon color');

    if (!recurring) {
      return res.status(404).json({ message: 'Gasto recurrente no encontrado' });
    }

    res.json(recurring);
  } catch (error) {
    console.error('Update recurring error:', error);
    res.status(500).json({ message: 'Error al actualizar gasto recurrente' });
  }
};

// Delete recurring expense
exports.deleteRecurring = async (req, res) => {
  try {
    const recurring = await RecurringExpense.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { isActive: false },
      { new: true }
    );

    if (!recurring) {
      return res.status(404).json({ message: 'Gasto recurrente no encontrado' });
    }

    res.json({ message: 'Gasto recurrente eliminado exitosamente' });
  } catch (error) {
    console.error('Delete recurring error:', error);
    res.status(500).json({ message: 'Error al eliminar gasto recurrente' });
  }
};

// Pay recurring expense (create transaction and update next due date)
exports.payRecurring = async (req, res) => {
  try {
    const recurring = await RecurringExpense.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!recurring) {
      return res.status(404).json({ message: 'Gasto recurrente no encontrado' });
    }

    // Create transaction
    const transaction = new Transaction({
      userId: req.userId,
      accountId: recurring.accountId,
      categoryId: recurring.categoryId,
      type: 'expense',
      amount: recurring.amount,
      currency: recurring.currency,
      description: recurring.name,
      date: new Date(),
      isRecurring: true,
      recurringExpenseId: recurring._id
    });

    await transaction.save();

    // Update account balance
    await Account.findByIdAndUpdate(recurring.accountId, {
      $inc: { balance: -recurring.amount }
    });

    // Calculate and update next due date
    const nextDueDate = recurring.calculateNextDueDate();
    recurring.nextDueDate = nextDueDate;
    recurring.lastPaidDate = new Date();

    // Check if recurring should end
    if (recurring.endDate && nextDueDate > recurring.endDate) {
      recurring.isActive = false;
    }

    await recurring.save();

    const populatedRecurring = await RecurringExpense.findById(recurring._id)
      .populate('accountId', 'name currency color')
      .populate('categoryId', 'name icon color');

    res.json({
      message: 'Pago registrado exitosamente',
      recurring: populatedRecurring,
      transaction
    });
  } catch (error) {
    console.error('Pay recurring error:', error);
    res.status(500).json({ message: 'Error al registrar el pago' });
  }
};

// Get upcoming recurring expenses
exports.getUpcoming = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + parseInt(days));

    const upcoming = await RecurringExpense.find({
      userId: req.userId,
      isActive: true,
      nextDueDate: { $lte: endDate }
    })
      .populate('accountId', 'name currency color')
      .populate('categoryId', 'name icon color')
      .sort({ nextDueDate: 1 });

    res.json(upcoming);
  } catch (error) {
    console.error('Get upcoming error:', error);
    res.status(500).json({ message: 'Error al obtener próximos vencimientos' });
  }
};
