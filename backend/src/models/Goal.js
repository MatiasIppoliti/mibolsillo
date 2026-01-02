const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Goal name is required'],
    trim: true
  },
  targetAmount: {
    type: Number,
    required: [true, 'Target amount is required'],
    min: [1, 'Target amount must be at least 1']
  },
  currentAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    enum: ['ARS', 'USD', 'EUR', 'BRL'],
    default: 'ARS'
  },
  deadline: {
    type: Date,
    default: null
  },
  color: {
    type: String,
    default: '#10b981'
  },
  icon: {
    type: String,
    default: 'target'
  },
  isCompleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Virtual for progress percentage
goalSchema.virtual('progress').get(function() {
  if (this.targetAmount === 0) return 100;
  return Math.min(100, Math.round((this.currentAmount / this.targetAmount) * 100));
});

// Virtual for days remaining
goalSchema.virtual('daysRemaining').get(function() {
  if (!this.deadline) return null;
  const now = new Date();
  const deadline = new Date(this.deadline);
  const diffTime = deadline - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
});

// Include virtuals in JSON output
goalSchema.set('toJSON', { virtuals: true });
goalSchema.set('toObject', { virtuals: true });

// Index for faster queries
goalSchema.index({ userId: 1, isCompleted: 1 });

module.exports = mongoose.model('Goal', goalSchema);
