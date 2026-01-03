import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { accountsApi } from '../../api/endpoints';
import type { Account, AccountSummary } from '../../types';

interface AccountsState {
  accounts: Account[];
  summary: AccountSummary[];
  selectedAccount: Account | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AccountsState = {
  accounts: [],
  summary: [],
  selectedAccount: null,
  isLoading: false,
  error: null,
};

export const fetchAccounts = createAsyncThunk(
  'accounts/fetchAll',
  async (includeInactive: boolean | undefined = false, { rejectWithValue }) => {
    try {
      const response = await accountsApi.getAll(includeInactive ?? false);
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Error al obtener cuentas');
    }
  }
);

export const fetchAccountsSummary = createAsyncThunk(
  'accounts/fetchSummary',
  async (_, { rejectWithValue }) => {
    try {
      const response = await accountsApi.getSummary();
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Error al obtener resumen');
    }
  }
);

export const createAccount = createAsyncThunk(
  'accounts/create',
  async (data: Omit<Account, '_id' | 'userId' | 'createdAt' | 'updatedAt' | 'initialBalance'>, { rejectWithValue }) => {
    try {
      const response = await accountsApi.create(data);
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Error al crear cuenta');
    }
  }
);

export const updateAccount = createAsyncThunk(
  'accounts/update',
  async ({ id, data }: { id: string; data: Partial<Account> }, { rejectWithValue }) => {
    try {
      const response = await accountsApi.update(id, data);
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Error al actualizar cuenta');
    }
  }
);

export const deleteAccount = createAsyncThunk(
  'accounts/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await accountsApi.delete(id);
      return id;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Error al eliminar cuenta');
    }
  }
);

export const payCreditCard = createAsyncThunk(
  'accounts/payCreditCard',
  async (
    { creditCardId, data }: {
      creditCardId: string;
      data: {
        sourceAccountId: string;
        totalAmount: number;
        feesAmount?: number;
        feesDescription?: string;
      };
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await accountsApi.payCreditCard(creditCardId, data);
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Error al pagar la tarjeta');
    }
  }
);

const accountsSlice = createSlice({
  name: 'accounts',
  initialState,
  reducers: {
    selectAccount: (state, action) => {
      state.selectedAccount = action.payload;
    },
    clearAccountsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAccounts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAccounts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.accounts = action.payload;
      })
      .addCase(fetchAccounts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchAccountsSummary.fulfilled, (state, action) => {
        state.summary = action.payload;
      })
      .addCase(createAccount.fulfilled, (state, action) => {
        state.accounts.unshift(action.payload);
      })
      .addCase(updateAccount.fulfilled, (state, action) => {
        const index = state.accounts.findIndex(a => a._id === action.payload._id);
        if (index !== -1) {
          state.accounts[index] = action.payload;
        }
      })
      .addCase(deleteAccount.fulfilled, (state, action) => {
        state.accounts = state.accounts.filter(a => a._id !== action.payload);
      })
      .addCase(payCreditCard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(payCreditCard.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update the affected accounts in the state
        const { creditCard, sourceAccount } = action.payload.updatedAccounts;
        const creditCardIndex = state.accounts.findIndex(a => a._id === creditCard._id);
        const sourceIndex = state.accounts.findIndex(a => a._id === sourceAccount._id);
        if (creditCardIndex !== -1) {
          state.accounts[creditCardIndex] = creditCard;
        }
        if (sourceIndex !== -1) {
          state.accounts[sourceIndex] = sourceAccount;
        }
      })
      .addCase(payCreditCard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { selectAccount, clearAccountsError } = accountsSlice.actions;
export default accountsSlice.reducer;
