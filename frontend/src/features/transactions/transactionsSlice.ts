import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { transactionsApi } from '../../api/endpoints';
import type { Transaction, TransactionStats } from '../../types';

interface TransactionsState {
  transactions: Transaction[];
  stats: TransactionStats | null;
  monthlyStats: TransactionStats | null;
  distributionStats: TransactionStats | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  isLoading: boolean;
  error: string | null;
}

const initialState: TransactionsState = {
  transactions: [],
  stats: null,
  monthlyStats: null,
  distributionStats: null,
  pagination: {
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  },
  isLoading: false,
  error: null,
};

export const fetchTransactions = createAsyncThunk(
  'transactions/fetchAll',
  async (params: {
    accountId?: string;
    categoryId?: string;
    type?: 'income' | 'expense' | 'transfer';
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  } = {}, { rejectWithValue }) => {
    try {
      const response = await transactionsApi.getAll(params);
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Error al obtener transacciones');
    }
  }
);

export const fetchTransactionStats = createAsyncThunk(
  'transactions/fetchStats',
  async (params: { startDate?: string; endDate?: string; groupBy?: 'category' | 'currency' } = {}, { rejectWithValue }) => {
    try {
      const response = await transactionsApi.getStats(params);
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Error al obtener estadísticas');
    }
  }
);

export const fetchMonthlyStats = createAsyncThunk(
  'transactions/fetchMonthlyStats',
  async (params: { startDate?: string; endDate?: string; groupBy: 'month' }, { rejectWithValue }) => {
    try {
      const response = await transactionsApi.getStats(params);
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Error al obtener estadísticas mensuales');
    }
  }
);

export const fetchDistributionStats = createAsyncThunk(
  'transactions/fetchDistributionStats',
  async (params: { startDate?: string; endDate?: string; groupBy: 'category' | 'account' }, { rejectWithValue }) => {
    try {
      const response = await transactionsApi.getStats(params);
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Error al obtener estadísticas de distribución');
    }
  }
);

export const createTransaction = createAsyncThunk(
  'transactions/create',
  async (data: {
    accountId: string;
    categoryId?: string;
    type: 'income' | 'expense' | 'transfer';
    amount: number;
    description?: string;
    date?: string;
    toAccountId?: string;
    tags?: string[];
  }, { rejectWithValue }) => {
    try {
      const response = await transactionsApi.create(data);
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Error al crear transacción');
    }
  }
);

export const updateTransaction = createAsyncThunk(
  'transactions/update',
  async ({ id, data }: { id: string; data: Partial<Transaction> }, { rejectWithValue }) => {
    try {
      const response = await transactionsApi.update(id, data);
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Error al actualizar transacción');
    }
  }
);

export const deleteTransaction = createAsyncThunk(
  'transactions/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await transactionsApi.delete(id);
      return id;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Error al eliminar transacción');
    }
  }
);

const transactionsSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    clearTransactionsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransactions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.transactions = action.payload.transactions;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchTransactionStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })
      .addCase(fetchMonthlyStats.fulfilled, (state, action) => {
        state.monthlyStats = action.payload;
      })
      .addCase(fetchDistributionStats.fulfilled, (state, action) => {
        state.distributionStats = action.payload;
      })
      .addCase(createTransaction.fulfilled, (state, action) => {
        state.transactions.unshift(action.payload);
      })
      .addCase(updateTransaction.fulfilled, (state, action) => {
        const index = state.transactions.findIndex(t => t._id === action.payload._id);
        if (index !== -1) {
          state.transactions[index] = action.payload;
        }
      })
      .addCase(deleteTransaction.fulfilled, (state, action) => {
        state.transactions = state.transactions.filter(t => t._id !== action.payload);
      });
  },
});

export const { clearTransactionsError } = transactionsSlice.actions;
export default transactionsSlice.reducer;
