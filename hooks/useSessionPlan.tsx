'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getActivitySessionsNew } from '@/api/acitivity-session';
import { ActivitySessionEntry } from '@/types/activitiy-session';
import { Activity } from '@/types/actitivity';
import {
    calculateSchedule,
    ScheduledItem,
    ScheduleGap,
} from '@/components/SessionPlanningModal/utils/scheduler';

interface SessionPlanProps {
    startAt: string; // ISO String
    endAt: string; // ISO String
    studentId?: number;
}

export type TimelineItemUnion =
    | (ScheduledItem & { type: 'activity' })
    | (ScheduleGap & { type: 'gap'; instanceId: string });

export const useSessionPlan = ({
    startAt,
    endAt,
    studentId,
}: SessionPlanProps) => {
    const [localOverride, setLocalOverride] = useState<
        ActivitySessionEntry[] | null
    >(null);
    const [lastAddedId, setLastAddedId] = useState<string | null>(null);
    const [activeContext, setActiveContext] = useState(
        `${studentId}-${startAt}`,
    );

    const currentContext = `${studentId}-${startAt}`;

    if (activeContext !== currentContext) {
        setLocalOverride(null);
        setActiveContext(currentContext);
    }

    const {
        data: activitySessions,
        isLoading,
        isError,
    } = useQuery({
        queryKey: [
            'activity-sessions',
            {
                populate: { activity: { populate: '*' } },
                filters: { student: { id: { $eq: studentId } } },
                pagination: { limit: -1 },
            },
        ],
        queryFn: getActivitySessionsNew,
        enabled: !!startAt && !!studentId,
    });

    const serverData = useMemo(() => {
        const rawData = Array.isArray(activitySessions)
            ? activitySessions
            : activitySessions?.data || [];
        return rawData.map((s: ActivitySessionEntry) => ({
            ...s,
            documentId: s.documentId ?? null,
            activity: s.activity,
            isLocked: true,
            durationMinutes: s.durationMinutes || 30,
            startAt: s.startAt,
            endAt: s.endAt,
            instanceId: s.instanceId || s.documentId || crypto.randomUUID(),
        })) as ActivitySessionEntry[];
    }, [activitySessions]);

    const activeEntries = localOverride ?? serverData;

    const { timelineItems, capacityMetrics } = useMemo(() => {
        const { items, gaps } = calculateSchedule(activeEntries, startAt);
        const flatList: TimelineItemUnion[] = [];

        const startGap = gaps.find((g) => g.afterIndex === -1);
        if (startGap) {
            flatList.push({
                ...startGap,
                type: 'gap',
                instanceId: `gap-start-${startGap.startAt}`,
            });
        }

        items.forEach((item, index) => {
            flatList.push({ ...item, type: 'activity' });
            const gap = gaps.find((g) => g.afterIndex === index);
            if (gap) {
                flatList.push({
                    ...gap,
                    type: 'gap',
                    instanceId: `gap-${index}-${gap.startAt}`,
                });
            }
        });

        const totalDuration = items.reduce(
            (acc, curr) => acc + (curr.durationMinutes || 0),
            0,
        );
        const startTs = new Date(startAt).getTime();
        const endTs = new Date(endAt).getTime();
        const totalAvailableMinutes =
            isNaN(startTs) || isNaN(endTs)
                ? 0
                : Math.max(0, (endTs - startTs) / 60000);

        return {
            timelineItems: flatList,
            capacityMetrics: {
                percentUsed:
                    totalAvailableMinutes > 0
                        ? Math.min(
                              (totalDuration / totalAvailableMinutes) * 100,
                              100,
                          )
                        : 0,
                totalDuration,
                remainingMinutes: totalAvailableMinutes - totalDuration,
                count: items.length,
            },
        };
    }, [activeEntries, startAt, endAt]);

    const addActivity = useCallback(
        (activity: Activity, insertIndex?: number) => {
            const newId = crypto.randomUUID();
            setLocalOverride((prev) => {
                const current = prev ?? [...serverData];
                const entry: ActivitySessionEntry = {
                    instanceId: newId,
                    activity,
                    durationMinutes: activity.durationMinutes || 30,
                    isLocked: false,
                    isBreak: false,
                    startAt: '',
                    endAt: '',
                    documentId: '',
                    hasConflict: false,
                };
                const newArr = [...current];
                if (insertIndex !== undefined)
                    newArr.splice(insertIndex, 0, entry);
                else newArr.push(entry);
                return newArr;
            });
            setLastAddedId(newId);
            return { success: true };
        },
        [serverData],
    );

    const removeActivity = useCallback(
        (id: string) => {
            setLocalOverride((prev) =>
                (prev ?? [...serverData]).filter((i) => i.instanceId !== id),
            );
        },
        [serverData],
    );

    const toggleLock = useCallback(
        (id: string, s: string, e: string) => {
            setLocalOverride((prev) =>
                (prev ?? [...serverData]).map((item) =>
                    item.instanceId === id
                        ? {
                              ...item,
                              isLocked: !item.isLocked,
                              startAt: s,
                              endAt: e,
                          }
                        : item,
                ),
            );
        },
        [serverData],
    );

    // NEW: Function to handle dragging an activity into a specific gap
    const moveActivityToGap = useCallback(
        (instanceId: string, targetStartAt: string) => {
            setLocalOverride((prev) => {
                const current = prev ?? [...serverData];
                return current.map((item) => {
                    if (item.instanceId === instanceId) {
                        const duration = item.durationMinutes || 30;
                        const endAt = new Date(
                            new Date(targetStartAt).getTime() +
                                duration * 60000,
                        ).toISOString();
                        return {
                            ...item,
                            isLocked: true, // Must lock it to keep it in the gap
                            startAt: targetStartAt,
                            endAt,
                        };
                    }
                    return item;
                });
            });
        },
        [serverData],
    );

    const reorderActivities = useCallback((newOrder: TimelineItemUnion[]) => {
        const clean = newOrder
            .filter(
                (i): i is ScheduledItem & { type: 'activity' } =>
                    i.type === 'activity',
            )
            .map(
                ({ type, hasConflict, conflictReason, ...rest }: any) =>
                    rest as ActivitySessionEntry,
            );
        setLocalOverride(clean);
    }, []);

    return {
        timelineItems,
        capacityMetrics,
        isLoading,
        isError,
        addActivity,
        removeActivity,
        toggleLock,
        reorderActivities,
        moveActivityToGap,
        clearPlan: useCallback(() => setLocalOverride([]), []),
        rawActivitySessions: activeEntries,
        lastAddedId,
        startAt,
        endAt,
    };
};
