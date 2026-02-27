'use client';

import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
    getActivitySessionsNew,
    updateActivitySession,
} from '@/api/acitivity-session';
import {
    ActivitySessionResponse,
    ActivitySessionStatus,
} from '@/types/activitiy-session';
import { useTelemetry } from '@/hooks/useTelemetry';
import GameShellView from '@/components/GameShellView';
import StudentDashboard from '@/components/StudentDashboard';

interface LauncherProps {
    user: any;
}

export default function ActivitySessionLauncher({ user }: LauncherProps) {
    const queryClient = useQueryClient();
    const telemetry = useTelemetry();
    const { status, score, rawTelemetry, pause, resume, finish, begin } =
        telemetry;

    const [latchedSession, setLatchedSession] =
        useState<ActivitySessionResponse>();
    const [isSaving, setIsSaving] = useState(false);
    const [isLocalToggling, setIsLocalToggling] = useState(false);
    const isDraining = useRef(false);

    // --- QUERIES ---
    const { data: activeSessions = [] } = useQuery({
        queryKey: [
            'active-session-poll',
            {
                filters: {
                    student: { id: { $eq: user?.id } },
                    $or: [
                        {
                            activitySessionStatus: {
                                $eq: ActivitySessionStatus.InProgress,
                            },
                        },
                        {
                            activitySessionStatus: {
                                $eq: ActivitySessionStatus.Paused,
                            },
                        },
                    ],
                },
                populate: {
                    activity: { populate: '*' },
                    student: { populate: '*' },
                },
            },
        ],
        queryFn: getActivitySessionsNew,
        enabled: !!user?.id,
        refetchInterval: 3000,
    });

    // 🔥 NEW: BACKGROUND DATA FLUSH 🔥
    // If the therapist forces a stop or a skip, this guarantees local telemetry is saved
    // before the session unmounts from the student's screen.
    const flushData = useCallback(
        (docId: string, finalScore: any, finalTelemetry: any) => {
            if (!docId) return;
            updateActivitySession(docId, {
                score: finalScore,
                rawTelemetry: finalTelemetry,
            }).catch((err) =>
                console.error('Failed to background flush telemetry', err),
            );
        },
        [],
    );

    const handleFinish = useCallback(
        async (sessionToSave: ActivitySessionResponse) => {
            if (isSaving || isDraining.current) return;
            setIsSaving(true);
            isDraining.current = true;
            try {
                await updateActivitySession(sessionToSave.documentId, {
                    activitySessionStatus: ActivitySessionStatus.Completed,
                    actualEndAt: new Date().toISOString(),
                    score,
                    rawTelemetry,
                });
                finish();

                // If Hands-Free, do NOT unmount. Let the therapist command dictate the swap.
                if (!sessionToSave.isHandsFree) {
                    setLatchedSession(undefined);
                }

                await queryClient.invalidateQueries({
                    queryKey: ['active-session-poll'],
                });
                toast.success('Activity data synced');
            } catch (error) {
                toast.error('Sync failed. Please do not close tab.');
            } finally {
                setIsSaving(false);
                isDraining.current = false;
            }
        },
        [score, rawTelemetry, finish, queryClient, isSaving],
    );

    const handleStart = useCallback(
        async (now: string) => {
            if (!latchedSession) return;
            setIsLocalToggling(true);
            const payload = {
                actualStartAt: now,
                activitySessionStatus: ActivitySessionStatus.InProgress,
                timeLogs: [
                    ...(latchedSession.timeLogs || []),
                    { status: 'start' as const, timestamp: now },
                ],
            };
            try {
                setLatchedSession((prev) =>
                    prev
                        ? ({ ...prev, ...payload } as ActivitySessionResponse)
                        : undefined,
                );
                await updateActivitySession(latchedSession.documentId, payload);
                begin();
                await queryClient.invalidateQueries({
                    queryKey: ['active-session-poll'],
                });
            } catch (error) {
                toast.error('Failed to start session');
            } finally {
                setIsLocalToggling(false);
            }
        },
        [latchedSession, begin, queryClient],
    );

    const handlePause = useCallback(async () => {
        if (!latchedSession) return;
        setIsLocalToggling(true);
        pause();
        const payload = {
            activitySessionStatus: ActivitySessionStatus.Paused,
            timeLogs: [
                ...(latchedSession.timeLogs || []),
                {
                    status: 'pause' as const,
                    timestamp: new Date().toISOString(),
                    reason: 'Learner Initiated',
                },
            ],
        };
        try {
            setLatchedSession((prev) =>
                prev
                    ? ({ ...prev, ...payload } as ActivitySessionResponse)
                    : undefined,
            );
            await updateActivitySession(latchedSession.documentId, payload);
            await queryClient.invalidateQueries({
                queryKey: ['active-session-poll'],
            });
        } finally {
            setIsLocalToggling(false);
        }
    }, [latchedSession, pause, queryClient]);

    const handleResume = useCallback(async () => {
        if (!latchedSession) return;
        setIsLocalToggling(true);
        resume();
        const payload = {
            activitySessionStatus: ActivitySessionStatus.InProgress,
            timeLogs: [
                ...(latchedSession.timeLogs || []),
                {
                    status: 'resume' as const,
                    timestamp: new Date().toISOString(),
                },
            ],
        };
        try {
            setLatchedSession((prev) =>
                prev
                    ? ({ ...prev, ...payload } as ActivitySessionResponse)
                    : undefined,
            );
            await updateActivitySession(latchedSession.documentId, payload);
            await queryClient.invalidateQueries({
                queryKey: ['active-session-poll'],
            });
        } finally {
            setIsLocalToggling(false);
        }
    }, [latchedSession, resume, queryClient]);

    // --- SYNC LOCAL STATE WITH SERVER ---
    useEffect(() => {
        if (isDraining.current || isSaving || isLocalToggling) return;

        if (activeSessions.length === 0) {
            if (
                latchedSession &&
                latchedSession.activitySessionStatus !==
                    ActivitySessionStatus.Completed
            ) {
                // 🔥 THE FIX: Therapist hit "Stop" or queue emptied.
                // Force a save of the current telemetry before dropping the session!
                flushData(latchedSession.documentId, score, rawTelemetry);
                setLatchedSession(undefined);
                telemetry.reset();
            }
            return;
        }

        const serverSession = activeSessions[0];

        if (!latchedSession) {
            setLatchedSession(serverSession);
        } else if (serverSession.documentId !== latchedSession.documentId) {
            // 🔥 THE FIX: Therapist hit "Next". A new game ID just arrived!
            // Save the OLD telemetry data in the background, then swap to the NEW game.
            flushData(latchedSession.documentId, score, rawTelemetry);
            telemetry.reset();
            setLatchedSession(serverSession);
        } else if (
            serverSession.activitySessionStatus !==
                latchedSession.activitySessionStatus ||
            serverSession.enableLearnerControls !==
                latchedSession.enableLearnerControls ||
            serverSession.isHandsFree !== latchedSession.isHandsFree
        ) {
            setLatchedSession(serverSession);
        }
    }, [
        activeSessions,
        latchedSession,
        isSaving,
        isLocalToggling,
        telemetry,
        score,
        rawTelemetry,
        flushData,
    ]);

    // --- SYNC TELEMETRY WITH LATCHED SESSION ---
    useEffect(() => {
        if (!latchedSession || isLocalToggling || isSaving) return;
        const currentStatus = latchedSession.activitySessionStatus;
        if (
            currentStatus === ActivitySessionStatus.Paused &&
            status === 'playing'
        )
            pause();
        else if (
            currentStatus === ActivitySessionStatus.InProgress &&
            status === 'paused'
        )
            resume();
    }, [latchedSession, status, isLocalToggling, isSaving, pause, resume]);

    // --- ALWAYS AUTO-SAVE TELEMETRY ON NATIVE FINISH ---
    useEffect(() => {
        // Whether hands-free is on or off, if a game natively reports 'completed',
        // we must securely trigger the full save sequence exactly once.
        if (status === 'completed' && latchedSession) {
            if (
                latchedSession.activitySessionStatus !==
                    ActivitySessionStatus.Completed &&
                !isSaving &&
                !isDraining.current
            ) {
                handleFinish(latchedSession);
            }
        }
    }, [status, latchedSession, handleFinish, isSaving]);

    if (latchedSession) {
        return (
            <GameShellView
                key={latchedSession.documentId}
                session={latchedSession}
                telemetry={telemetry}
                isSaving={isSaving}
                onStart={handleStart}
                onPause={handlePause}
                onResume={handleResume}
                onFinish={() => handleFinish(latchedSession)}
                onClose={() => {
                    setLatchedSession(undefined);
                    telemetry.reset();
                }}
            />
        );
    }

    return <StudentDashboard />;
}
