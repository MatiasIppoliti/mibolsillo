import api from './client';
import type { 
  AuthResponse, 
  User, 
  Account, 
  AccountSummary,
  Category, 
  Transaction, 
  PaginatedResponse,
  TransactionStats,
  RecurringExpense, 
  Goal 
} from '../types';

// Auth endpoints
export const authApi = {
  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', data),
  
  getProfile: () => api.get<User>('/auth/profile'),
  
  updateProfile: (data: { name?: string; preferredCurrency?: string }) =>
    api.put<{ message: string; user: User }>('/auth/profile', data),
  
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put<{ message: string }>('/auth/change-password', data),
};

// Account endpoints
export const accountsApi = {
  getAll: (includeInactive = false) =>
    api.get<Account[]>('/accounts', { params: { includeInactive } }),
  
  getById: (id: string) => api.get<Account>(`/accounts/${id}`),
  
  getSummary: () => api.get<AccountSummary[]>('/accounts/summary'),
  
  create: (data: Omit<Account, '_id' | 'userId' | 'createdAt' | 'updatedAt' | 'initialBalance'>) =>
    api.post<Account>('/accounts', data),
  
  update: (id: string, data: Partial<Account>) =>
    api.put<Account>(`/accounts/${id}`, data),
  
  delete: (id: string) => api.delete<{ message: string }>(`/accounts/${id}`),
};

// Category endpoints
export const categoriesApi = {
  getAll: (type?: 'income' | 'expense', includeInactive = false) =>
    api.get<Category[]>('/categories', { params: { type, includeInactive } }),
  
  getById: (id: string) => api.get<Category>(`/categories/${id}`),
  
  create: (data: Omit<Category, '_id' | 'userId' | 'createdAt' | 'isActive'>) =>
    api.post<Category>('/categories', data),
  
  update: (id: string, data: Partial<Category>) =>
    api.put<Category>(`/categories/${id}`, data),
  
  delete: (id: string) => api.delete<{ message: string }>(`/categories/${id}`),
};

// Transaction endpoints
export const transactionsApi = {
  getAll: (params?: {
    accountId?: string;
    categoryId?: string;
    type?: 'income' | 'expense' | 'transfer';
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => api.get<PaginatedResponse<Transaction>>('/transactions', { params }),
  
  getById: (id: string) => api.get<Transaction>(`/transactions/${id}`),
  
  getStats: (params?: { startDate?: string; endDate?: string; groupBy?: 'category' | 'account' | 'currency' | 'month' }) =>
    api.get<TransactionStats>('/transactions/stats', { params }),
  
  create: (data: {
    accountId: string;
    categoryId?: string;
    type: 'income' | 'expense' | 'transfer';
    amount: number;
    description?: string;
    date?: string;
    toAccountId?: string;
    tags?: string[];
  }) => api.post<Transaction>('/transactions', data),
  
  update: (id: string, data: Partial<Transaction>) =>
    api.put<Transaction>(`/transactions/${id}`, data),
  
  delete: (id: string) => api.delete<{ message: string }>(`/transactions/${id}`),
};

// Recurring expense endpoints
export const recurringApi = {
  getAll: (includeInactive = false) =>
    api.get<RecurringExpense[]>('/recurring', { params: { includeInactive } }),
  
  getById: (id: string) => api.get<RecurringExpense>(`/recurring/${id}`),
  
  getUpcoming: (days = 7) =>
    api.get<RecurringExpense[]>('/recurring/upcoming', { params: { days } }),
  
  create: (data: {
    accountId: string;
    categoryId: string;
    name: string;
    amount: number;
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    startDate?: string;
    endDate?: string;
    reminderDaysBefore?: number;
  }) => api.post<RecurringExpense>('/recurring', data),
  
  update: (id: string, data: Partial<RecurringExpense>) =>
    api.put<RecurringExpense>(`/recurring/${id}`, data),
  
  delete: (id: string) => api.delete<{ message: string }>(`/recurring/${id}`),
  
  pay: (id: string) => api.post<{ message: string; recurring: RecurringExpense; transaction: Transaction }>(`/recurring/${id}/pay`),
};

// Goal endpoints
export const goalsApi = {
  getAll: (includeCompleted = false) =>
    api.get<Goal[]>('/goals', { params: { includeCompleted } }),
  
  getById: (id: string) => api.get<Goal>(`/goals/${id}`),
  
  create: (data: {
    name: string;
    targetAmount: number;
    currentAmount?: number;
    currency?: string;
    deadline?: string;
    color?: string;
    icon?: string;
  }) => api.post<Goal>('/goals', data),
  
  update: (id: string, data: Partial<Goal>) =>
    api.put<Goal>(`/goals/${id}`, data),
  
  delete: (id: string) => api.delete<{ message: string }>(`/goals/${id}`),
  
  contribute: (id: string, amount: number) =>
    api.post<{ message: string; goal: Goal }>(`/goals/${id}/contribute`, { amount }),
  
  withdraw: (id: string, amount: number) =>
    api.post<{ message: string; goal: Goal }>(`/goals/${id}/withdraw`, { amount }),
};
