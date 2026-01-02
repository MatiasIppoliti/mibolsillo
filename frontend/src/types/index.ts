// Type definitions for Personal Finance App

// User types
export interface User {
  _id: string;
  email: string;
  name: string;
  preferredCurrency: Currency;
  createdAt: string;
  updatedAt: string;
}

export type Currency = 'ARS' | 'USD' | 'EUR' | 'BRL';

// Account types
export type AccountType = 'cash' | 'wallet' | 'bank' | 'crypto' | 'credit_card';

export interface Account {
  _id: string;
  userId: string;
  name: string;
  type: AccountType;
  currency: Currency;
  balance: number;
  initialBalance: number;
  color: string;
  icon: string;
  isActive: boolean;
  issuer?: 'VISA' | 'Mastercard' | 'American Express';
  last4Digits?: string;
  expiryDate?: string;
  creditLimit?: number;
  paymentDueDay?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AccountSummary {
  currency: Currency;
  total: number;
  accounts: {
    id: string;
    name: string;
    balance: number;
    type: AccountType;
  }[];
}

// Category types
export type CategoryType = 'income' | 'expense';

export interface Category {
  _id: string;
  userId: string;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  parentCategory?: Category | string | null;
  isActive: boolean;
  createdAt: string;
}

// Transaction types
export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
  _id: string;
  userId: string;
  accountId: Account | string;
  categoryId?: Category | string;
  type: TransactionType;
  amount: number;
  currency: Currency;
  description: string;
  date: string;
  toAccountId?: Account | string;
  tags: string[];
  isRecurring: boolean;
  recurringExpenseId?: string;
  createdAt: string;
  updatedAt: string;
}

// Recurring expense types
export type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurringExpense {
  _id: string;
  userId: string;
  accountId: Account | string;
  categoryId: Category | string;
  name: string;
  amount: number;
  currency: Currency;
  frequency: Frequency;
  startDate: string;
  endDate?: string | null;
  nextDueDate: string;
  lastPaidDate?: string | null;
  isActive: boolean;
  reminderDaysBefore: number;
  createdAt: string;
  updatedAt: string;
}

// Goal types
export interface Goal {
  _id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  currency: Currency;
  deadline?: string | null;
  color: string;
  icon: string;
  isCompleted: boolean;
  progress: number;
  daysRemaining?: number | null;
  createdAt: string;
  updatedAt: string;
}

// API Response types
export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface PaginatedResponse<T> {
  transactions: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface TransactionStats {
  stats: {
    type: TransactionType;
    categoryId?: string;
    categoryName?: string;
    categoryColor?: string;
    categoryIcon?: string;
    accountId?: string;
    accountName?: string;
    accountColor?: string;
    accountType?: AccountType;
    currency?: Currency;
    year?: number;
    month?: number;
    total: number;
    count: number;
  }[];
  totals: {
    _id: { type: TransactionType; currency: Currency };
    total: number;
  }[];
}
