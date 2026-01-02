import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { goalsApi } from '../../api/endpoints';
import type { Goal } from '../../types';

interface GoalsState {
  goals: Goal[];
  isLoading: boolean;
  error: string | null;
}

const initialState: GoalsState = {
  goals: [],
  isLoading: false,
  error: null,
};

export const fetchGoals = createAsyncThunk(
  'goals/fetchAll',
  async (includeCompleted: boolean | undefined = false, { rejectWithValue }) => {
    try {
      const response = await goalsApi.getAll(includeCompleted ?? false);
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Error al obtener metas');
    }
  }
);

export const createGoal = createAsyncThunk(
  'goals/create',
  async (data: {
    name: string;
    targetAmount: number;
    currentAmount?: number;
    currency?: string;
    deadline?: string;
    color?: string;
    icon?: string;
  }, { rejectWithValue }) => {
    try {
      const response = await goalsApi.create(data);
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Error al crear meta');
    }
  }
);

export const updateGoal = createAsyncThunk(
  'goals/update',
  async ({ id, data }: { id: string; data: Partial<Goal> }, { rejectWithValue }) => {
    try {
      const response = await goalsApi.update(id, data);
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Error al actualizar meta');
    }
  }
);

export const deleteGoal = createAsyncThunk(
  'goals/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await goalsApi.delete(id);
      return id;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Error al eliminar meta');
    }
  }
);

export const contributeToGoal = createAsyncThunk(
  'goals/contribute',
  async ({ id, amount }: { id: string; amount: number }, { rejectWithValue }) => {
    try {
      const response = await goalsApi.contribute(id, amount);
      return response.data.goal;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Error al agregar contribución');
    }
  }
);

export const withdrawFromGoal = createAsyncThunk(
  'goals/withdraw',
  async ({ id, amount }: { id: string; amount: number }, { rejectWithValue }) => {
    try {
      const response = await goalsApi.withdraw(id, amount);
      return response.data.goal;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Error al retirar');
    }
  }
);

const goalsSlice = createSlice({
  name: 'goals',
  initialState,
  reducers: {
    clearGoalsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGoals.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchGoals.fulfilled, (state, action) => {
        state.isLoading = false;
        state.goals = action.payload;
      })
      .addCase(fetchGoals.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createGoal.fulfilled, (state, action) => {
        state.goals.unshift(action.payload);
      })
      .addCase(updateGoal.fulfilled, (state, action) => {
        const index = state.goals.findIndex(g => g._id === action.payload._id);
        if (index !== -1) {
          state.goals[index] = action.payload;
        }
      })
      .addCase(deleteGoal.fulfilled, (state, action) => {
        state.goals = state.goals.filter(g => g._id !== action.payload);
      })
      .addCase(contributeToGoal.fulfilled, (state, action) => {
        const index = state.goals.findIndex(g => g._id === action.payload._id);
        if (index !== -1) {
          state.goals[index] = action.payload;
        }
      })
      .addCase(withdrawFromGoal.fulfilled, (state, action) => {
        const index = state.goals.findIndex(g => g._id === action.payload._id);
        if (index !== -1) {
          state.goals[index] = action.payload;
        }
      });
  },
});

export const { clearGoalsError } = goalsSlice.actions;
export default goalsSlice.reducer;
