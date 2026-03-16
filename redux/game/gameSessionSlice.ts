import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface GameSessionState {
    documentId: string | null;
    gameId: string | null;
    status: 'idle' | 'playing' | 'paused' | 'completed';
    score: number;
    rounds: number; // ✨ NEW
    accuracy: number; // ✨ NEW
    streak: number;
    rawTelemetry: unknown[];
}

const initialState: GameSessionState = {
    documentId: null,
    gameId: null,
    status: 'idle',
    score: 0,
    rounds: 0, // ✨ NEW
    accuracy: 0, // ✨ NEW
    streak: 0,
    rawTelemetry: [],
};

export const gameSessionSlice = createSlice({
    name: 'gameSession',
    initialState,
    reducers: {
        initSession: (
            state,
            action: PayloadAction<{ documentId: string; gameId: string }>,
        ) => {
            return { ...initialState, ...action.payload };
        },
        startGame: (state) => {
            state.status = 'playing';
        },
        pauseGame: (state) => {
            state.status = 'paused';
        },
        resumeGame: (state) => {
            state.status = 'playing';
        },
        syncGameData: (
            state,
            action: PayloadAction<{
                score: number;
                rounds: number; // ✨ NEW
                accuracy: number; // ✨ NEW
                telemetry: any[];
            }>,
        ) => {
            state.score = action.payload.score;
            state.rounds = action.payload.rounds; // ✨ NEW
            state.accuracy = action.payload.accuracy; // ✨ NEW
            state.rawTelemetry = action.payload.telemetry;
        },
        completeSession: (state) => {
            state.status = 'completed';
        },
        clearSession: () => initialState,
    },
});

export const {
    initSession,
    startGame,
    pauseGame,
    resumeGame,
    syncGameData,
    completeSession,
    clearSession,
} = gameSessionSlice.actions;

export default gameSessionSlice.reducer;
