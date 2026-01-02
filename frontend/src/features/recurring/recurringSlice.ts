import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { recurringApi } from '../../api/endpoints';
import type { RecurringExpense } from '../../types';

interface RecurringState {
  recurring: RecurringExpense[];
  upcoming: RecurringExpense[];
  isLoading: boolean;
  error: string | null;
}

const initialState: RecurringState = {
  recurring: [],
  upcoming: [],
  isLoading: false,
  error: null,
};

export const fetchRecurring = createAsyncThunk(
  'recurring/fetchAll',
  async (includeInactive: boolean | undefined = false, { rejectWithValue }) => {
    try {
      const response = await recurringApi.getAll(includeInactive ?? false);
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Error al obtener gastos recurrentes');
    }
  }
);

export const fetchUpcoming = createAsyncThunk(
  'recurring/fetchUpcoming',
  async (days: number = 7, { rejectWithValue }) => {
    try {
      const response = await recurringApi.getUpcoming(days);
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Error al obtener próximos vencimientos');
    }
  }
);

export const createRecurring = createAsyncThunk(
  'recurring/create',
  async (data: {
    accountId: string;
    categoryId: string;
    name: string;
    amount: number;
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    startDate?: string;
    endDate?: string;
    reminderDaysBefore?: number;
  }, { rejectWithValue }) => {
    try {
      const response = await recurringApi.create(data);
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Error al crear gasto recurrente');
    }
  }
);

export const updateRecurring = createAsyncThunk(
  'recurring/update',
  async ({ id, data }: { id: string; data: Partial<RecurringExpense> }, { rejectWithValue }) => {
    try {
      const response = await recurringApi.update(id, data);
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Error al actualizar gasto recurrente');
    }
  }
);

export const deleteRecurring = createAsyncThunk(
  'recurring/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await recurringApi.delete(id);
      return id;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Error al eliminar gasto recurrente');
    }
  }
);

export const payRecurring = createAsyncThunk(
  'recurring/pay',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await recurringApi.pay(id);
      return response.data.recurring;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Error al registrar pago');
    }
  }
);

const recurringSlice = createSlice({
  name: 'recurring',
  initialState,
  reducers: {
    clearRecurringError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRecurring.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRecurring.fulfilled, (state, action) => {
        state.isLoading = false;
        state.recurring = action.payload;
      })
      .addCase(fetchRecurring.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchUpcoming.fulfilled, (state, action) => {
        state.upcoming = action.payload;
      })
      .addCase(createRecurring.fulfilled, (state, action) => {
        state.recurring.unshift(action.payload);
      })
      .addCase(updateRecurring.fulfilled, (state, action) => {
        const index = state.recurring.findIndex(r => r._id === action.payload._id);
        if (index !== -1) {
          state.recurring[index] = action.payload;
        }
      })
      .addCase(deleteRecurring.fulfilled, (state, action) => {
        state.recurring = state.recurring.filter(r => r._id !== action.payload);
      })
      .addCase(payRecurring.fulfilled, (state, action) => {
        const index = state.recurring.findIndex(r => r._id === action.payload._id);
        if (index !== -1) {
          state.recurring[index] = action.payload;
        }
        // Update upcoming list
        state.upcoming = state.upcoming.filter(r => r._id !== action.payload._id);
      });
  },
});

export const { clearRecurringError } = recurringSlice.actions;
export default recurringSlice.reducer;
