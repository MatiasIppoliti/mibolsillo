import type { Currency } from '../types';

// Format currency with proper symbol and locale
export const formatCurrency = (amount: number, currency: Currency = 'ARS'): string => {
  // Force Argentine locale for all currencies to ensure dots for thousands and commas for decimals
  const locale = 'es-AR';

  const symbols: Record<Currency, string> = {
    ARS: '$',
    USD: 'US$',
    EUR: '€',
    BRL: 'R$',
  };

  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));

  const sign = amount < 0 ? '-' : '';
  return `${sign}${symbols[currency]} ${formatted}`;
};

// Format date in Spanish
export const formatDate = (dateString: string, options?: Intl.DateTimeFormatOptions): string => {
  const date = new Date(dateString);
  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  };
  return date.toLocaleDateString('es-AR', options || defaultOptions);
};

// Format date relative (today, yesterday, etc.)
export const formatRelativeDate = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Hoy';
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Ayer';
  }
  
  return formatDate(dateString);
};

// Format frequency to Spanish
export const formatFrequency = (frequency: string): string => {
  const frequencies: Record<string, string> = {
    daily: 'Diario',
    weekly: 'Semanal',
    monthly: 'Mensual',
    yearly: 'Anual',
  };
  return frequencies[frequency] || frequency;
};

// Format account type to Spanish
export const formatAccountType = (type: string): string => {
  const types: Record<string, string> = {
    cash: 'Efectivo',
    wallet: 'Billetera',
    bank: 'Banco',
    crypto: 'Cripto',
    credit_card: 'Tarjeta de Crédito',
  };
  return types[type] || type;
};

// Get currency symbol
export const getCurrencySymbol = (currency: Currency): string => {
  const symbols: Record<Currency, string> = {
    ARS: '$',
    USD: 'US$',
    EUR: '€',
    BRL: 'R$',
  };
  return symbols[currency];
};

// Calculate percentage
export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
};

// Truncate text
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Generate random color from palette
export const generateColor = (): string => {
  const colors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', 
    '#f97316', '#f59e0b', '#84cc16', '#10b981',
    '#14b8a6', '#06b6d4', '#3b82f6', '#a855f7'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Validate email
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Format number with abbreviation (1K, 1M, etc.)
export const formatCompactNumber = (num: number): string => {
  const absNum = Math.abs(num);
  if (absNum >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  }
  if (absNum >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (absNum >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toFixed(0);
};

// Format number with abbreviation AND currency symbol ($ 1.3M, US$ 500K)
export const formatCompactCurrency = (num: number, currency: Currency = 'ARS'): string => {
  const symbols: Record<Currency, string> = {
    ARS: '$',
    USD: 'US$',
    EUR: '€',
    BRL: 'R$',
  };
  
  const absNum = Math.abs(num);
  let formatted: string;
  
  if (absNum >= 1000000000) {
    formatted = (absNum / 1000000000).toFixed(1) + 'B';
  } else if (absNum >= 1000000) {
    formatted = (absNum / 1000000).toFixed(1) + 'M';
  } else if (absNum >= 1000) {
    formatted = (absNum / 1000).toFixed(1) + 'K';
  } else {
    formatted = absNum.toFixed(0);
  }
  
  const sign = num < 0 ? '-' : '';
  return `${sign}${symbols[currency]} ${formatted}`;
};
