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

    // BACKGROUND DATA FLUSH
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

            const isRestarting = !!latchedSession.actualStartAt;
            const correctStartAt = latchedSession.actualStartAt || now;

            const payload = {
                actualStartAt: correctStartAt,
                activitySessionStatus: ActivitySessionStatus.InProgress,
                timeLogs: isRestarting
                    ? [
                          ...(latchedSession.timeLogs || []),
                          { status: 'resume' as const, timestamp: now },
                      ]
                    : [
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

    // --- 📡 THE LIVE TELEMETRY PULSE ---
    useEffect(() => {
        if (status !== 'playing' || !latchedSession || isSaving) return;
        if (
            rawTelemetry.length === 0 &&
            latchedSession.rawTelemetry?.length > 0
        )
            return;
        if (rawTelemetry.length === 0) return;

        const pulseInterval = setInterval(() => {
            updateActivitySession(latchedSession.documentId, {
                score: score,
                rawTelemetry: rawTelemetry,
            }).catch((err) => console.error('Live pulse failed', err));
        }, 3000);

        return () => clearInterval(pulseInterval);
    }, [status, latchedSession, score, rawTelemetry, isSaving]);

    // --- SYNC LIVE SETTINGS FROM THERAPIST ---
    useEffect(() => {
        if (isDraining.current || isSaving || isLocalToggling) return;

        if (activeSessions.length === 0) {
            if (
                latchedSession &&
                latchedSession.activitySessionStatus !==
                    ActivitySessionStatus.Completed
            ) {
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
            flushData(latchedSession.documentId, score, rawTelemetry);
            telemetry.reset();
            setLatchedSession(serverSession);
        } else if (
            serverSession.activitySessionStatus !==
                latchedSession.activitySessionStatus ||
            serverSession.enableLearnerControls !==
                latchedSession.enableLearnerControls ||
            serverSession.isHandsFree !== latchedSession.isHandsFree ||
            serverSession.extraTimeSeconds !==
                latchedSession.extraTimeSeconds ||
            serverSession.enableAdaptiveDifficulty !==
                latchedSession.enableAdaptiveDifficulty
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

    // --- ✨ THE FIX: SYNC STATUS WITH LATCHED SESSION (Handles Reloads) ✨ ---
    useEffect(() => {
        if (!latchedSession || isLocalToggling || isSaving) return;
        const currentStatus = latchedSession.activitySessionStatus;

        if (
            currentStatus === ActivitySessionStatus.Paused &&
            status === 'playing'
        ) {
            pause();
        } else if (
            currentStatus === ActivitySessionStatus.InProgress &&
            status === 'paused'
        ) {
            resume();
        } else if (
            currentStatus === ActivitySessionStatus.InProgress &&
            status === 'idle' &&
            latchedSession.actualStartAt
        ) {
            // ✨ IF THE STUDENT REFRESHES WHILE THE TIME IS TICKING, JUMP STRAIGHT IN ✨
            begin();
        }
    }, [
        latchedSession,
        status,
        isLocalToggling,
        isSaving,
        pause,
        resume,
        begin,
    ]); // <--- 7 dependencies here
    useEffect(() => {
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

    return null;
}
