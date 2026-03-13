// utils/game-bridge.ts

/**
 * 📊 Professional Game-to-Shell Bridge
 * Standardizes the 'postMessage' protocol for clinical telemetry.
 */

export interface GameUpdatePayload {
    score: number;
    rawTelemetry: any[];
}

export const sendGameUpdate = (payload: GameUpdatePayload) => {
    if (typeof window !== 'undefined' && window.parent) {
        window.parent.postMessage(
            {
                type: 'GAME_SCORE_UPDATE',
                ...payload,
            },
            '*',
        );

        // Log locally for debugging during development
        console.log('📡 [Bridge] Data beamed to Shell:', payload);
    }
};
