import { configureStore, combineReducers, Action } from '@reduxjs/toolkit';
import {
    persistStore,
    persistReducer,
    FLUSH,
    REHYDRATE,
    PAUSE,
    PERSIST,
    PURGE,
    REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import authReducer from './auth/authSlice';

// 1. Define the app-level combined reducer
const appReducer = combineReducers({
    auth: authReducer,
});

// 2. Define the Root Reducer with the reset logic
const rootReducer = (
    state: ReturnType<typeof appReducer> | undefined,
    action: Action,
) => {
    if (action.type === 'auth/logout') {
        // Clear physical storage
        storage.removeItem('persist:root');
        // Reset state to undefined (triggering initialStates)
        state = undefined;
    }
    return appReducer(state, action);
};

const persistConfig = {
    key: 'root',
    version: 1,
    storage,
    whitelist: ['auth'],
};

// 3. Create the persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [
                    FLUSH,
                    REHYDRATE,
                    PAUSE,
                    PERSIST,
                    PURGE,
                    REGISTER,
                ],
            },
        }),
});

export const persistor = persistStore(store);

// --- THE FIX FOR THE TYPE ERROR ---
// Use appReducer instead of store.getState to avoid 'PersistPartial' confusion
export type RootState = ReturnType<typeof appReducer>;
export type AppDispatch = typeof store.dispatch;
