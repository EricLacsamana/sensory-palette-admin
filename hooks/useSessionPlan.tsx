'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getActivitySessions } from '@/api/acitivity-session';
import { ActivitySessionEntry } from '@/types/activitiy-session';
import { Activity } from '@/types/actitivity';

import { TimelineGapEntry } from '@/components/SessionPlanningModal/components/TimelineItem';
import {
    calculateSchedule,
    ScheduledItem,
} from '@/components/SessionPlanningModal/utils/scheduler';

interface SessionPlanProps {
    startDate: string;
    startTimeStr: string;
    studentId: number;
}

export type TimelineItemUnion =
    | (ScheduledItem & { type: 'activity' })
    | TimelineGapEntry;

export const useSessionPlan = ({
    startDate,
    startTimeStr,
    studentId,
}: SessionPlanProps) => {
    // --- 1. FETCH ---
    const {
        data: apiResponse,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ['activity-sessions', startDate, studentId],
        queryFn: () => getActivitySessions({ startDate, studentId }),
        staleTime: 5 * 60 * 1000,
        enabled: !!startDate && !!studentId,
    });

    // --- 2. NORMALIZE SERVER DATA ---
    const serverData = useMemo(() => {
        const rawData = Array.isArray(apiResponse)
            ? apiResponse
            : apiResponse?.data && Array.isArray(apiResponse.data)
              ? apiResponse.data
              : [];

        return rawData
            .filter((s: any) => s.startTime === startTimeStr)
            .map((s: any) => ({
                ...s,
                documentId: s.documentId ?? null,
                instanceId: s.instanceId || s.documentId || crypto.randomUUID(),
                isLocked: !!s.id,
                durationMinutes: s.durationMinutes,
                isBreak: s.isBreak || false,
                type: 'activity',
            })) as ActivitySessionEntry[];
    }, [apiResponse, startTimeStr]);

    // --- 3. LOCAL STATE OVERRIDE ---
    const [localOverride, setLocalOverride] = useState<
        ActivitySessionEntry[] | null
    >(null);

    // NEW: Track the ID of the most recently added item for auto-scrolling
    const [lastAddedId, setLastAddedId] = useState<string | null>(null);

    // Reset override if date changes
    const currentViewKey = `${startDate}-${startTimeStr}-${studentId}`;
    const [lastViewKey, setLastViewKey] = useState(currentViewKey);
    if (currentViewKey !== lastViewKey) {
        setLastViewKey(currentViewKey);
        setLocalOverride(null);
        setLastAddedId(null);
    }

    // --- 4. CALCULATE SCHEDULE & FLATTEN LIST ---
    const activeEntries = localOverride ?? serverData;

    const { timelineItems, capacityMetrics } = useMemo(() => {
        const { items, gaps } = calculateSchedule(activeEntries, startTimeStr);
        const flatList: TimelineItemUnion[] = [];

        // 1. Initial Gap
        const startGap = gaps.find((g) => g.afterIndex === -1);
        if (startGap) {
            flatList.push({
                type: 'gap',
                instanceId: `gap-start-${startGap.startTime}`,
                startTime: startGap.startTime,
                endTime: startGap.endTime,
                durationMinutes: startGap.durationMinutes,
            });
        }

        // 2. Interleave
        items.forEach((item, index) => {
            flatList.push({ ...item, type: 'activity' });

            const gap = gaps.find((g) => g.afterIndex === index);
            if (gap) {
                flatList.push({
                    type: 'gap',
                    instanceId: `gap-${index}-${gap.startTime}`,
                    startTime: gap.startTime,
                    endTime: gap.endTime,
                    durationMinutes: gap.durationMinutes,
                });
            }
        });

        // Metrics
        const totalDuration = items.reduce(
            (acc, curr) => acc + (curr.durationMinutes || 0),
            0,
        );
        const MAX_MINUTES = 240;

        return {
            timelineItems: flatList,
            capacityMetrics: {
                percentUsed: Math.min((totalDuration / MAX_MINUTES) * 100, 100),
                totalDuration,
                count: items.length,
            },
        };
    }, [activeEntries, startTimeStr]);

    // --- 5. HANDLERS ---

    const addActivity = useCallback(
        (activity: Activity, insertIndex?: number) => {
            // Generate ID upfront so we can track it
            const newInstanceId = crypto.randomUUID();

            setLocalOverride((prev) => {
                const current = prev ?? [...serverData];
                const newEntry: ActivitySessionEntry = {
                    instanceId: newInstanceId,
                    isLocked: false,
                    isBreak: false,
                    activity: activity,
                    startTime: '--:--',
                    endTime: '--:--',
                    durationMinutes: activity.durationMinutes,
                    id: undefined,
                    documentId: '',
                    hasConflict: false,
                };

                if (insertIndex !== undefined && insertIndex >= 0) {
                    const newArr = [...current];
                    newArr.splice(insertIndex, 0, newEntry);
                    return newArr;
                }
                return [...current, newEntry];
            });

            // Trigger scroll to this ID
            setLastAddedId(newInstanceId);
        },
        [serverData],
    );

    const removeActivity = useCallback(
        (instanceId: string) => {
            setLocalOverride((prev) => {
                const current = prev ?? [...serverData];
                return current.filter((item) => item.instanceId !== instanceId);
            });
        },
        [serverData],
    );

    const toggleLock = useCallback(
        (
            instanceId: string,
            currentScheduledStartTime: string,
            currentScheduledEndTime: string,
        ) => {
            setLocalOverride((prev) => {
                const current = prev ?? [...serverData];
                return current.map((item) => {
                    if (item.instanceId !== instanceId) return item;
                    const willLock = !item.isLocked;
                    return {
                        ...item,
                        isLocked: willLock,
                        startTime: willLock
                            ? currentScheduledStartTime
                            : item.startTime,
                        endTime: willLock
                            ? currentScheduledEndTime
                            : item.endTime,
                    };
                });
            });
        },
        [serverData],
    );

    const reorderActivities = useCallback(
        (newFlatOrder: TimelineItemUnion[]) => {
            const onlyActivities = newFlatOrder.filter(
                (item): item is ScheduledItem & { type: 'activity' } =>
                    item.type === 'activity',
            );

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const cleanActivities = onlyActivities.map(
                ({ type, startMin, endMin, conflictReason, ...rest }) => {
                    return rest as ActivitySessionEntry;
                },
            );

            setLocalOverride(cleanActivities);
        },
        [],
    );

    const clearPlan = useCallback(() => setLocalOverride([]), []);

    return {
        timelineItems,
        capacityMetrics,
        isLoading,
        isError,
        addActivity,
        removeActivity,
        toggleLock,
        reorderActivities,
        clearPlan,
        rawActivities: activeEntries,
        lastAddedId, // EXPORTED
    };
};
