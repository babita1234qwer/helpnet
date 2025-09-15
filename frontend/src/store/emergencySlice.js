import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api'; // Update with your backend URL

// Fetch active emergencies
export const fetchEmergencies = createAsyncThunk(
  'emergency/fetchEmergencies',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_BASE}/emergencies/active`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Create a new emergency
export const createEmergency = createAsyncThunk(
  'emergency/createEmergency',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${API_BASE}/emergencies`, payload, {
        headers: { Authorization: `Bearer ${payload.token}` },
      });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Respond to an emergency
export const respondToEmergency = createAsyncThunk(
  'emergency/respondToEmergency',
  async ({ id, token }, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${API_BASE}/emergencies/${id}/respond`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

const emergencySlice = createSlice({
  name: 'emergency',
  initialState: {
    emergencies: [],
    loading: false,
    error: null,
    createdEmergency: null,
  },
  reducers: {
    clearCreatedEmergency: (state) => {
      state.createdEmergency = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmergencies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmergencies.fulfilled, (state, action) => {
        state.loading = false;
        state.emergencies = action.payload;
      })
      .addCase(fetchEmergencies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createEmergency.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createEmergency.fulfilled, (state, action) => {
        state.loading = false;
        state.createdEmergency = action.payload;
        state.emergencies = [action.payload, ...state.emergencies];
      })
      .addCase(createEmergency.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(respondToEmergency.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(respondToEmergency.fulfilled, (state, action) => {
        state.loading = false;
        // Optionally update the emergency in the list
      })
      .addCase(respondToEmergency.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCreatedEmergency } = emergencySlice.actions;
export default emergencySlice.reducer;
