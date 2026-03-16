import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import {
    initSession,
    startGame,
    pauseGame,
    resumeGame,
    syncGameData,
    completeSession,
    clearSession,
} from '@/redux/game/gameSessionSlice';

export const useTelemetry = () => {
    const dispatch = useDispatch();
    const session = useSelector((state: RootState) => state.gameSession);

    const initialize = useCallback(
        (dId: string, gId: string) => {
            dispatch(initSession({ documentId: dId, gameId: gId }));
        },
        [dispatch],
    );

    const begin = useCallback(() => dispatch(startGame()), [dispatch]);
    const pause = useCallback(() => dispatch(pauseGame()), [dispatch]);
    const resume = useCallback(() => dispatch(resumeGame()), [dispatch]);
    const finish = useCallback(() => dispatch(completeSession()), [dispatch]);
    const reset = useCallback(() => dispatch(clearSession()), [dispatch]);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (
                event.data?.type === 'GAME_SCORE_UPDATE' &&
                session.status === 'playing'
            ) {
                console.log('RECEIVED FROM IFRAME:', event.data);

                dispatch(
                    syncGameData({
                        score: event.data.score || 0,
                        rounds: event.data.rounds || 0,
                        accuracy: event.data.accuracy || 0,
                        telemetry:
                            event.data.rawTelemetry ||
                            event.data.telemetry ||
                            [],
                    }),
                );
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [dispatch, session.status]);

    return { ...session, initialize, begin, pause, resume, finish, reset };
};
