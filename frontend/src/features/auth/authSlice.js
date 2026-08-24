import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null, // { id, name, email, avatarUrl, role }
  accessToken: null, // short-lived JWT; refresh token stays in an httpOnly cookie, never touches JS
  status: 'idle', // 'idle' | 'loading' | 'authenticated' | 'error'
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart(state) {
      state.status = 'loading';
    },
    loginSuccess(state, action) {
      state.status = 'authenticated';
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
    },
    loginFailure(state) {
      state.status = 'error';
      state.user = null;
      state.accessToken = null;
    },
    logout(state) {
      state.status = 'idle';
      state.user = null;
      state.accessToken = null;
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout } = authSlice.actions;
export default authSlice.reducer;
