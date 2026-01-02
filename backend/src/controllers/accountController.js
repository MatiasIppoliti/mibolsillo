const { validationResult } = require('express-validator');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');

// Get all accounts for user
exports.getAccounts = async (req, res) => {
  try {
    const { includeInactive } = req.query;
    const filter = { userId: req.userId };
    
    if (!includeInactive) {
      filter.isActive = true;
    }

    const accounts = await Account.find(filter).sort({ createdAt: -1 });
    res.json(accounts);
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ message: 'Error al obtener las cuentas' });
  }
};

// Get account by ID
exports.getAccount = async (req, res) => {
  try {
    const account = await Account.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!account) {
      return res.status(404).json({ message: 'Cuenta no encontrada' });
    }

    res.json(account);
  } catch (error) {
    console.error('Get account error:', error);
    res.status(500).json({ message: 'Error al obtener la cuenta' });
  }
};

// Create new account
exports.createAccount = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, type, currency, balance, color, icon, issuer, last4Digits, expiryDate, creditLimit, paymentDueDay } = req.body;

    const account = new Account({
      userId: req.userId,
      name,
      type,
      currency,
      balance: type === 'credit_card' ? 0 : (balance || 0), // Credit cards start with 0 balance (debt starts at 0)
      initialBalance: type === 'credit_card' ? 0 : (balance || 0),
      color,
      icon,
      issuer: type === 'credit_card' ? issuer : undefined,
      last4Digits: type === 'credit_card' ? last4Digits : undefined,
      expiryDate: type === 'credit_card' ? expiryDate : undefined,
      creditLimit: type === 'credit_card' ? creditLimit : undefined,
      paymentDueDay: type === 'credit_card' ? paymentDueDay : undefined
    });

    await account.save();
    res.status(201).json(account);
  } catch (error) {
    console.error('Create account error:', error);
    res.status(500).json({ message: 'Error al crear la cuenta' });
  }
};

// Update account
exports.updateAccount = async (req, res) => {
  try {
    const { name, type, color, icon, isActive, issuer, last4Digits, expiryDate, creditLimit, paymentDueDay } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (color !== undefined) updateData.color = color;
    if (icon !== undefined) updateData.icon = icon;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (issuer !== undefined) updateData.issuer = issuer;
    if (last4Digits !== undefined) updateData.last4Digits = last4Digits;
    if (expiryDate !== undefined) updateData.expiryDate = expiryDate;
    if (creditLimit !== undefined) updateData.creditLimit = creditLimit;
    if (paymentDueDay !== undefined) updateData.paymentDueDay = paymentDueDay;

    const account = await Account.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!account) {
      return res.status(404).json({ message: 'Cuenta no encontrada' });
    }

    res.json(account);
  } catch (error) {
    console.error('Update account error:', error);
    res.status(500).json({ message: 'Error al actualizar la cuenta' });
  }
};

// Delete account (hard delete)
exports.deleteAccount = async (req, res) => {
  try {
    const account = await Account.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!account) {
      return res.status(404).json({ message: 'Cuenta no encontrada' });
    }

    // Also delete or unlink transactions associated?
    // For now, let's keep transactions but maybe nullify accountId? 
    // Or just delete the account as requested. 
    // Ideally we should warn about transactions, but user asked for deletion.
    
    // Check if there are transactions
    const transactionCount = await Transaction.countDocuments({ accountId: req.params.id });
    if (transactionCount > 0) {
      // Option 1: Block deletion
      // return res.status(400).json({ message: 'No se puede eliminar una cuenta con movimientos asociados.' });
      
      // Option 2: Delete transactions (Cascading)
      await Transaction.deleteMany({ accountId: req.params.id });
    }

    res.json({ message: 'Cuenta eliminada exitosamente', id: req.params.id });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Error al eliminar la cuenta' });
  }
};

// Get accounts summary (totals by currency)
exports.getSummary = async (req, res) => {
  try {
    const accounts = await Account.find({ 
      userId: req.userId, 
      isActive: true 
    });

    const summary = accounts.reduce((acc, account) => {
      if (!acc[account.currency]) {
        acc[account.currency] = {
          currency: account.currency,
          total: 0,
          accounts: []
        };
      }
      acc[account.currency].total += account.balance;
      acc[account.currency].accounts.push({
        id: account._id,
        name: account.name,
        balance: account.balance,
        type: account.type
      });
      return acc;
    }, {});

    res.json(Object.values(summary));
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({ message: 'Error al obtener el resumen' });
  }
};
