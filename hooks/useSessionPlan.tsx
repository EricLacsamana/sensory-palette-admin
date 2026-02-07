'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';

export const useSessionPlan = (
    startDate: string,
    startTimeStr: string,
    student: any,
    initialSessions?: any[],
) => {
    const [rawPlan, setRawPlan] = useState<any[]>([]);
    const [dragState, setDragState] = useState({
        isLibraryDrag: false,
        dragOverIndex: null as number | null,
    });

    useEffect(() => {
        if (
            initialSessions &&
            initialSessions.length > 0 &&
            rawPlan.length === 0
        ) {
            const mappedSessions = initialSessions.map((sess) => ({
                ...sess,
                instanceId: sess.instanceId || sess.id || crypto.randomUUID(),
                duration:
                    sess.durationMinutes ||
                    (sess.durationSeconds ? sess.durationSeconds / 60 : 30),
                name:
                    sess.name ||
                    sess.attributes?.name ||
                    sess.activity?.name ||
                    (sess.isBreak ? 'Rest Break' : 'Activity'),
                isBreak: !!sess.isBreak,
            }));
            setRawPlan(mappedSessions);
        }
    }, [initialSessions]);

    const plan = useMemo(() => {
        const startDateTime = new Date(`${startDate}T${startTimeStr}`);
        if (isNaN(startDateTime.getTime())) return [];
        let currentStartTime = new Date(startDateTime);

        return rawPlan.map((item) => {
            const durationMinutes = item.duration || 30;
            const startTimeISO = currentStartTime.toISOString();
            const endTimeDate = new Date(
                currentStartTime.getTime() + durationMinutes * 60000,
            );
            const baseUrl =
                process.env.NEXT_PUBLIC_STRAPI_URL?.replace(/\/$/, '') ||
                'http://localhost:1337';

            const bannerData =
                item?.attributes?.banner?.data?.attributes ||
                item?.banner ||
                item?.activity?.banner ||
                item?.activity?.attributes?.banner?.data?.attributes;
            const bannerPath =
                bannerData?.formats?.thumbnail?.url ||
                bannerData?.url ||
                item.imageUrl;

            const session = {
                ...item,
                sessionId:
                    item.sessionId || item.id || `sess-${crypto.randomUUID()}`,
                activity: item.isBreak
                    ? null
                    : item.activity?.id || item.id || item.documentId,
                startTime: startTimeISO,
                endTime: endTimeDate.toISOString(),
                durationSeconds: durationMinutes * 60,
                imageUrl: bannerPath
                    ? bannerPath.startsWith('http')
                        ? bannerPath
                        : `${baseUrl}${bannerPath}`
                    : null,
                displayStart: currentStartTime.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                }),
                displayEnd: endTimeDate.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                }),
            };
            currentStartTime = new Date(endTimeDate);
            return session;
        });
    }, [rawPlan, startDate, startTimeStr]);

    return {
        plan,
        setPlan: setRawPlan,
        dragState,
        setDragState,
        capacityMetrics: {
            percentUsed: Math.min(
                (plan.reduce((acc, s) => acc + (s.durationSeconds || 0), 0) /
                    32400) *
                    100,
                100,
            ),
        },
    };
};
