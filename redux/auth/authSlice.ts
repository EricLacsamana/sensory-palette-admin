import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

const initialState: AuthState = {
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
};

interface LoginPayload {
    jwt: string;
}

// Payload specifically for direct token injection (like our Passcode flow)
interface CredentialsPayload {
    token: string;
    user?: any; // We accept the user object, but React Query handles storing it!
}

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        loginStart: (state) => {
            state.isLoading = true;
            state.error = null;
        },
        loginSuccess: (state, action: PayloadAction<LoginPayload>) => {
            state.isLoading = false;
            state.token = action.payload.jwt;
            state.isAuthenticated = true;
            state.error = null;
        },
        loginFailure: (state, action: PayloadAction<string>) => {
            state.isLoading = false;
            state.error = action.payload;
            state.token = null;
            state.isAuthenticated = false;
        },
        // ✨ NEW: Instantly injects credentials (used by the Student Passcode Login)
        setCredentials: (state, action: PayloadAction<CredentialsPayload>) => {
            state.token = action.payload.token;
            state.isAuthenticated = true;
            state.isLoading = false;
            state.error = null;
        },
        // 🔥 THE SEAMLESS RESET: Return to initialState exactly
        logout: () => initialState,
    },
});

export const {
    loginStart,
    loginSuccess,
    loginFailure,
    logout,
    setCredentials,
} = authSlice.actions;
export default authSlice.reducer;

export const selectIsAuthenticated = (state: { auth: AuthState }) =>
    state.auth.isAuthenticated;
export const selectToken = (state: { auth: AuthState }) => state.auth.token;
