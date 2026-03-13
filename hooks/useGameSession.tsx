// hooks/useGameSession.ts
import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import {
    syncGameData,
    startGame,
    completeSession,
    initSession,
} from '@/redux/game/gameSessionSlice';

export const useGameSession = () => {
    const dispatch = useDispatch();
    const session = useSelector((state: RootState) => state.gameSession);

    const handleMessage = useCallback(
        (event: MessageEvent) => {
            if (
                event.data?.type === 'GAME_SCORE_UPDATE' &&
                session.status === 'playing'
            ) {
                dispatch(
                    syncGameData({
                        score: event.data.score || 0,
                        telemetry: event.data.rawTelemetry || [],
                    }),
                );
            }
        },
        [dispatch, session.status],
    );

    useEffect(() => {
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [handleMessage]);

    return {
        // State
        ...session,
        // Methods to control the session
        setup: (docId: string, gId: string) =>
            dispatch(initSession({ documentId: docId, gameId: gId })),
        begin: () => dispatch(startGame()),
        end: () => dispatch(completeSession()),
    };
};
