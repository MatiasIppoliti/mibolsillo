const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Account = require('../models/Account');

// Get all transactions for user with filters
exports.getTransactions = async (req, res) => {
  try {
    const { 
      accountId, 
      categoryId, 
      type, 
      startDate, 
      endDate,
      page = 1,
      limit = 50 
    } = req.query;

    const filter = { userId: req.userId };
    
    if (accountId) filter.accountId = accountId;
    if (categoryId) filter.categoryId = categoryId;
    if (type) filter.type = type;
    
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .populate('accountId', 'name currency color')
        .populate('categoryId', 'name icon color type')
        .populate('toAccountId', 'name currency')
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Transaction.countDocuments(filter)
    ]);

    res.json({
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'Error al obtener las transacciones' });
  }
};

// Get single transaction
exports.getTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.userId
    })
      .populate('accountId', 'name currency color')
      .populate('categoryId', 'name icon color type')
      .populate('toAccountId', 'name currency');

    if (!transaction) {
      return res.status(404).json({ message: 'Transacción no encontrada' });
    }

    res.json(transaction);
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ message: 'Error al obtener la transacción' });
  }
};

// Create new transaction
exports.createTransaction = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    let { 
      accountId, 
      categoryId, 
      type, 
      amount, 
      description, 
      date,
      toAccountId,
      tags 
    } = req.body;

    // Verify account belongs to user
    const account = await Account.findOne({ _id: accountId, userId: req.userId });
    if (!account) {
      return res.status(400).json({ message: 'Cuenta no encontrada' });
    }

    // For transfers, verify destination account
    let toAccount = null;
    if (type === 'transfer') {
      toAccount = await Account.findOne({ _id: toAccountId, userId: req.userId });
      if (!toAccount) {
        return res.status(400).json({ message: 'Cuenta destino no encontrada' });
      }
    } else if (categoryId) {
      // Handle category: if it's a name (not ObjectId), find or create it
      if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        const categoryName = categoryId;
        const Category = require('../models/Category');
        
        let existingCategory = await Category.findOne({ 
          userId: req.userId, 
          name: categoryName, 
          type 
        });

        if (existingCategory) {
          categoryId = existingCategory._id;
        } else {
          // Create new category
          const newCategory = new Category({
            userId: req.userId,
            name: categoryName,
            type: type, // 'income' or 'expense'
            icon: 'tag', // Default icon
            color: '#6366f1' // Default color
          });
          await newCategory.save();
          categoryId = newCategory._id;
        }
      }
    }

    const transaction = new Transaction({
      userId: req.userId,
      accountId,
      categoryId: type !== 'transfer' ? categoryId : undefined,
      type,
      amount,
      currency: account.currency,
      description,
      date: date || new Date(),
      toAccountId: type === 'transfer' ? toAccountId : undefined,
      tags
    });

    await transaction.save();

    // Update account balances
    if (type === 'income') {
      await Account.findByIdAndUpdate(accountId, { $inc: { balance: amount } });
    } else if (type === 'expense') {
      await Account.findByIdAndUpdate(accountId, { $inc: { balance: -amount } });
    } else if (type === 'transfer') {
      await Account.findByIdAndUpdate(accountId, { $inc: { balance: -amount } });
      await Account.findByIdAndUpdate(toAccountId, { $inc: { balance: amount } });
    }

    const populatedTransaction = await Transaction.findById(transaction._id)
      .populate('accountId', 'name currency color')
      .populate('categoryId', 'name icon color type')
      .populate('toAccountId', 'name currency');

    res.status(201).json(populatedTransaction);
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ message: 'Error al crear la transacción' });
  }
};

// Update transaction
exports.updateTransaction = async (req, res) => {
  try {
    const { description, date, tags, categoryId } = req.body;

    // Note: We don't allow changing amount or type to maintain balance integrity
    const updateData = {};
    if (description !== undefined) updateData.description = description;
    if (date !== undefined) updateData.date = date;
    if (tags !== undefined) updateData.tags = tags;
    if (categoryId !== undefined) updateData.categoryId = categoryId;

    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      updateData,
      { new: true, runValidators: true }
    )
      .populate('accountId', 'name currency color')
      .populate('categoryId', 'name icon color type')
      .populate('toAccountId', 'name currency');

    if (!transaction) {
      return res.status(404).json({ message: 'Transacción no encontrada' });
    }

    res.json(transaction);
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ message: 'Error al actualizar la transacción' });
  }
};

// Delete transaction
exports.deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transacción no encontrada' });
    }

    // Revert account balance changes
    if (transaction.type === 'income') {
      await Account.findByIdAndUpdate(transaction.accountId, { 
        $inc: { balance: -transaction.amount } 
      });
    } else if (transaction.type === 'expense') {
      await Account.findByIdAndUpdate(transaction.accountId, { 
        $inc: { balance: transaction.amount } 
      });
    } else if (transaction.type === 'transfer') {
      await Account.findByIdAndUpdate(transaction.accountId, { 
        $inc: { balance: transaction.amount } 
      });
      await Account.findByIdAndUpdate(transaction.toAccountId, { 
        $inc: { balance: -transaction.amount } 
      });
    }

    await Transaction.findByIdAndDelete(transaction._id);

    res.json({ message: 'Transacción eliminada exitosamente' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ message: 'Error al eliminar la transacción' });
  }
};

// Get transaction statistics
exports.getStats = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'category' } = req.query;

    const matchStage = { 
      userId: req.userId,
      type: { $in: ['income', 'expense'] }
    };
    
    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) matchStage.date.$gte = new Date(startDate);
      if (endDate) matchStage.date.$lte = new Date(endDate);
    }

    let groupId;
    let projectStage = {
      type: '$_id.type',
      total: 1,
      count: 1
    };
    let sortStage = { total: -1 };

    if (groupBy === 'category') {
      groupId = { type: '$type', categoryId: '$categoryId', currency: '$currency' };
      projectStage = {
        ...projectStage,
        categoryId: '$_id.categoryId',
        categoryName: '$category.name',
        categoryColor: '$category.color',
        categoryIcon: '$category.icon',
        currency: '$_id.currency'
      };
    } else if (groupBy === 'account') {
      groupId = { type: '$type', accountId: '$accountId', currency: '$currency' };
      projectStage = {
        ...projectStage,
        accountId: '$_id.accountId',
        accountName: '$account.name',
        accountColor: '$account.color',
        accountType: '$account.type',
        currency: '$_id.currency'
      };
    } else if (groupBy === 'month') {
      groupId = {
        type: '$type',
        currency: '$currency',
        year: { $year: '$date' },
        month: { $month: '$date' }
      };
      projectStage = {
        ...projectStage,
        currency: '$_id.currency',
        year: '$_id.year',
        month: '$_id.month'
      };
      sortStage = { '_id.year': 1, '_id.month': 1 };
    } else {
      // currency default
      groupId = { type: '$type', currency: '$currency' };
      projectStage = {
        ...projectStage,
        currency: '$_id.currency'
      };
    }

    const stats = await Transaction.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: groupId,
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      // Only lookup if grouping by category
      ...(groupBy === 'category' ? [
        {
          $lookup: {
            from: 'categories',
            localField: '_id.categoryId',
            foreignField: '_id',
            as: 'category'
          }
        },
        { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } }
      ] : []),
      // Only lookup if grouping by account
      ...(groupBy === 'account' ? [
        {
          $lookup: {
            from: 'accounts',
            localField: '_id.accountId',
            foreignField: '_id',
            as: 'account'
          }
        },
        { $unwind: { path: '$account', preserveNullAndEmptyArrays: true } }
      ] : []),
      {
        $project: projectStage
      },
      { $sort: sortStage }
    ]);

    // Calculate totals
    const totals = await Transaction.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { type: '$type', currency: '$currency' },
          total: { $sum: '$amount' }
        }
      }
    ]);

    res.json({ stats, totals });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Error al obtener estadísticas' });
  }
};
