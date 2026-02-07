'use client';

import { useState, useMemo, useCallback } from 'react';

export const useSessionPlan = (
    startDate: string,
    startTimeStr: string,
    student: any,
) => {
    const [rawPlan, setRawPlan] = useState<any[]>([]);
    const [dragState, setDragState] = useState({
        isLibraryDrag: false,
        dragOverIndex: null as number | null,
    });

    const resetDrag = useCallback(() => {
        setDragState({ isLibraryDrag: false, dragOverIndex: null });
    }, []);

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

            const bannerPath =
                item?.attributes?.banner?.data?.attributes?.formats?.thumbnail
                    ?.url ??
                item?.banner?.formats?.thumbnail?.url ??
                item?.attributes?.banner?.data?.attributes?.url ??
                item?.banner?.url;

            const imageUrl = bannerPath
                ? bannerPath.startsWith('http')
                    ? bannerPath
                    : `${baseUrl}${bannerPath}`
                : null;

            const session = {
                sessionId: item.sessionId || `sess-${crypto.randomUUID()}`,
                activity: item.isBreak ? null : item.id || item.documentId,
                student: student?.id,
                activitySessionStatus: 'started',
                startTime: startTimeISO,
                endTime: endTimeDate.toISOString(),
                durationSeconds: durationMinutes * 60,
                instanceId: item.instanceId,
                imageUrl: imageUrl,
                name: item.name,
                isBreak: !!item.isBreak,
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
    }, [rawPlan, startDate, startTimeStr, student]);

    const capacityMetrics = useMemo(() => {
        const totalSec = plan.reduce(
            (acc, s) => acc + (s.durationSeconds || 0),
            0,
        );
        return { percentUsed: Math.min((totalSec / 32400) * 100, 100) };
    }, [plan]);

    return {
        plan,
        setPlan: setRawPlan,
        capacityMetrics,
        dragState,
        setDragState,
        resetDrag,
    };
};
