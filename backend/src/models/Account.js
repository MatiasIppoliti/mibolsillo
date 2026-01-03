const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Account name is required'],
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['cash', 'wallet', 'bank', 'crypto', 'credit_card'],
    default: 'bank'
  },
  issuer: {
    type: String,
    enum: ['VISA', 'Mastercard', 'American Express'],
    required: function() { return this.type === 'credit_card'; }
  },
  last4Digits: {
    type: String,
    match: [/^\d{4}$/, 'Must be 4 digits'],
    required: function() { return this.type === 'credit_card'; }
  },
  creditLimit: {
    type: Number,
    required: function() { return this.type === 'credit_card'; }
  },
  closingDate: {
    type: String, // DD/MM format for closing date
    required: function() { return this.type === 'credit_card'; }
  },
  expiryDate: {
    type: String, // MM/YY format
    required: function() { return this.type === 'credit_card'; }
  },
  currency: {
    type: String,
    required: true,
    enum: ['ARS', 'USD', 'EUR', 'BRL'],
    default: 'ARS'
  },
  balance: {
    type: Number,
    default: 0
  },
  initialBalance: {
    type: Number,
    default: 0
  },
  color: {
    type: String,
    default: '#6366f1'
  },
  icon: {
    type: String,
    default: 'wallet'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries
accountSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model('Account', accountSchema);
