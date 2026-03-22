import { createSlice } from '@reduxjs/toolkit';

const token = localStorage.getItem('customer_token');
const customer = (() => { try { return JSON.parse(localStorage.getItem('customer_info')); } catch { return null; } })();

const authSlice = createSlice({
  name: 'auth',
  initialState: { token: token || null, customer: customer || null, isAuthenticated: !!token },
  reducers: {
    setCredentials(state, { payload }) {
      state.token = payload.accessToken;
      state.customer = payload.customer;
      state.isAuthenticated = true;
      localStorage.setItem('customer_token', payload.accessToken);
      localStorage.setItem('customer_info', JSON.stringify(payload.customer));
    },
    logout(state) {
      state.token = null;
      state.customer = null;
      state.isAuthenticated = false;
      localStorage.removeItem('customer_token');
      localStorage.removeItem('customer_info');
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
