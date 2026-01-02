import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { categoriesApi } from '../../api/endpoints';
import type { Category } from '../../types';

interface CategoriesState {
  categories: Category[];
  incomeCategories: Category[];
  expenseCategories: Category[];
  isLoading: boolean;
  error: string | null;
}

const initialState: CategoriesState = {
  categories: [],
  incomeCategories: [],
  expenseCategories: [],
  isLoading: false,
  error: null,
};

export const fetchCategories = createAsyncThunk(
  'categories/fetchAll',
  async (params: { type?: 'income' | 'expense'; includeInactive?: boolean } = {}, { rejectWithValue }) => {
    try {
      const response = await categoriesApi.getAll(params.type, params.includeInactive);
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Error al obtener categorías');
    }
  }
);

export const createCategory = createAsyncThunk(
  'categories/create',
  async (data: Omit<Category, '_id' | 'userId' | 'createdAt' | 'isActive'>, { rejectWithValue }) => {
    try {
      const response = await categoriesApi.create(data);
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Error al crear categoría');
    }
  }
);

export const updateCategory = createAsyncThunk(
  'categories/update',
  async ({ id, data }: { id: string; data: Partial<Category> }, { rejectWithValue }) => {
    try {
      const response = await categoriesApi.update(id, data);
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Error al actualizar categoría');
    }
  }
);

export const deleteCategory = createAsyncThunk(
  'categories/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await categoriesApi.delete(id);
      return id;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Error al eliminar categoría');
    }
  }
);

const categoriesSlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    clearCategoriesError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.isLoading = false;
        state.categories = action.payload;
        state.incomeCategories = action.payload.filter(c => c.type === 'income');
        state.expenseCategories = action.payload.filter(c => c.type === 'expense');
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.categories.push(action.payload);
        if (action.payload.type === 'income') {
          state.incomeCategories.push(action.payload);
        } else {
          state.expenseCategories.push(action.payload);
        }
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        const index = state.categories.findIndex(c => c._id === action.payload._id);
        if (index !== -1) {
          state.categories[index] = action.payload;
        }
        state.incomeCategories = state.categories.filter(c => c.type === 'income');
        state.expenseCategories = state.categories.filter(c => c.type === 'expense');
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.categories = state.categories.filter(c => c._id !== action.payload);
        state.incomeCategories = state.categories.filter(c => c.type === 'income');
        state.expenseCategories = state.categories.filter(c => c.type === 'expense');
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { clearCategoriesError } = categoriesSlice.actions;
export default categoriesSlice.reducer;
