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

    const { name, type, currency, balance, color, icon, issuer, last4Digits, expiryDate, creditLimit, closingDate } = req.body;

    // For credit cards, balance represents current debt (stored as negative)
    const initialBalance = type === 'credit_card' ? (balance || 0) : (balance || 0);

    const account = new Account({
      userId: req.userId,
      name,
      type,
      currency,
      balance: initialBalance,
      initialBalance: initialBalance,
      color,
      icon,
      issuer: type === 'credit_card' ? issuer : undefined,
      last4Digits: type === 'credit_card' ? last4Digits : undefined,
      expiryDate: type === 'credit_card' ? expiryDate : undefined,
      creditLimit: type === 'credit_card' ? creditLimit : undefined,
      closingDate: type === 'credit_card' ? closingDate : undefined
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
    const { name, type, color, icon, isActive, issuer, last4Digits, expiryDate, creditLimit, closingDate, balance } = req.body;

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
    if (closingDate !== undefined) updateData.closingDate = closingDate;
    if (balance !== undefined) updateData.balance = balance;

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

// Pay credit card - handles transfer from source account and optional fees/interest
exports.payCreditCard = async (req, res) => {
  try {
    const { sourceAccountId, totalAmount, feesAmount, feesDescription } = req.body;
    const creditCardId = req.params.id;

    // Validate required fields
    if (!sourceAccountId || !totalAmount) {
      return res.status(400).json({ message: 'Cuenta origen y monto total son requeridos' });
    }

    // Get credit card account
    const creditCard = await Account.findOne({
      _id: creditCardId,
      userId: req.userId,
      type: 'credit_card'
    });

    if (!creditCard) {
      return res.status(404).json({ message: 'Tarjeta de crédito no encontrada' });
    }

    // Get source account
    const sourceAccount = await Account.findOne({
      _id: sourceAccountId,
      userId: req.userId
    });

    if (!sourceAccount) {
      return res.status(404).json({ message: 'Cuenta origen no encontrada' });
    }

    // Verify currencies match
    if (sourceAccount.currency !== creditCard.currency) {
      return res.status(400).json({ message: 'Las monedas de las cuentas deben coincidir' });
    }

    // Check source account has sufficient balance
    if (sourceAccount.balance < totalAmount) {
      return res.status(400).json({ message: 'Saldo insuficiente en la cuenta origen' });
    }

    const transactions = [];
    const currentDate = new Date();

    // Calculate the payment amount (total - fees if fees exist)
    const paymentAmount = feesAmount && feesAmount > 0 ? totalAmount - feesAmount : totalAmount;

    // 1. Create the transfer transaction (source -> credit card)
    const transferTransaction = new Transaction({
      userId: req.userId,
      accountId: sourceAccountId,
      type: 'transfer',
      amount: totalAmount,
      currency: sourceAccount.currency,
      description: `Pago de tarjeta ${creditCard.name}`,
      date: currentDate,
      toAccountId: creditCardId,
      tags: ['pago-tarjeta']
    });

    await transferTransaction.save();
    transactions.push(transferTransaction);

    // Update account balances for transfer
    await Account.findByIdAndUpdate(sourceAccountId, { $inc: { balance: -totalAmount } });
    await Account.findByIdAndUpdate(creditCardId, { $inc: { balance: totalAmount } });

    // 2. If there are fees/interest, create an expense transaction
    if (feesAmount && feesAmount > 0) {
      // Find or create the "Intereses / Comisiones" category
      const Category = require('../models/Category');
      let feesCategory = await Category.findOne({
        userId: req.userId,
        name: 'Intereses / Comisiones',
        type: 'expense'
      });

      if (!feesCategory) {
        feesCategory = new Category({
          userId: req.userId,
          name: 'Intereses / Comisiones',
          type: 'expense',
          icon: 'percent',
          color: '#ef4444' // Red color for fees
        });
        await feesCategory.save();
      }

      // Create expense transaction for fees (from credit card)
      const feesTransaction = new Transaction({
        userId: req.userId,
        accountId: creditCardId,
        categoryId: feesCategory._id,
        type: 'expense',
        amount: feesAmount,
        currency: creditCard.currency,
        description: feesDescription || 'Intereses y comisiones de tarjeta',
        date: currentDate,
        tags: ['intereses', 'comisiones']
      });

      await feesTransaction.save();
      transactions.push(feesTransaction);

      // Update credit card balance (fees increase debt)
      await Account.findByIdAndUpdate(creditCardId, { $inc: { balance: -feesAmount } });
    }

    // Get updated accounts
    const updatedCreditCard = await Account.findById(creditCardId);
    const updatedSourceAccount = await Account.findById(sourceAccountId);

    res.json({
      message: 'Pago de tarjeta registrado exitosamente',
      transactions,
      updatedAccounts: {
        creditCard: updatedCreditCard,
        sourceAccount: updatedSourceAccount
      }
    });
  } catch (error) {
    console.error('Pay credit card error:', error);
    res.status(500).json({ message: 'Error al registrar el pago de la tarjeta' });
  }
};
