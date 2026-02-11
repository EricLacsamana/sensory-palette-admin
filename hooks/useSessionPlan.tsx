'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getActivitySessionsNew } from '@/api/acitivity-session';
import { ActivitySessionEntry } from '@/types/activitiy-session';
import { Activity } from '@/types/actitivity';
import { calculateSchedule } from '@/components/SessionPlanningModal/utils/scheduler';

interface SessionPlanProps {
    startAt: string;
    endAt: string;
    studentId?: number | null;
}

export const useSessionPlan = ({
    startAt,
    endAt,
    studentId,
}: SessionPlanProps) => {
    const [localDraft, setLocalDraft] = useState<ActivitySessionEntry[] | null>(
        null,
    );
    const [deletedDocumentIds, setDeletedDocumentIds] = useState<string[]>([]);

    const startOfDay = new Date(startAt);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startAt);
    endOfDay.setHours(23, 59, 59, 999);

    const { data: activitySessions, isLoading: isQueryLoading } = useQuery({
        queryKey: [
            'activity-sessions',
            {
                populate: { activity: { populate: '*' } },
                filters: {
                    student: { id: { $eq: studentId } },
                    startAt: {
                        $gte: startOfDay.toISOString(),
                        $lte: endOfDay.toISOString(),
                    },
                },
            },
        ],
        queryFn: getActivitySessionsNew,
        enabled: !!startAt && !!studentId,
        staleTime: Infinity,
    });

    // 3. Sync base entries
    const currentBaseEntries = useMemo((): ActivitySessionEntry[] => {
        if (localDraft !== null) return localDraft;
        const rawData = Array.isArray(activitySessions)
            ? activitySessions
            : activitySessions?.data || [];

        return [...rawData]
            .sort(
                (a, b) =>
                    new Date(a.startAt).getTime() -
                    new Date(b.startAt).getTime(),
            )
            .map((s: any) => ({
                ...s,
                isLocked: true,
                type: 'activity',
                instanceId:
                    s.documentId || s.id?.toString() || crypto.randomUUID(),
            }));
    }, [localDraft, activitySessions]);

    // 4. Calculate Visual Timeline
    const { timelineItems, draftWithTimes, capacityMetrics } = useMemo(() => {
        const { items, totalDuration } = calculateSchedule(
            currentBaseEntries,
            startAt,
        );
        const activitiesOnly = items.filter((i) => i.type === 'activity');
        const totalAvailable = Math.max(
            0,
            (new Date(endAt).getTime() - new Date(startAt).getTime()) / 60000,
        );

        return {
            timelineItems: items,
            draftWithTimes: activitiesOnly,
            capacityMetrics: {
                percentUsed:
                    totalAvailable > 0
                        ? Math.min((totalDuration / totalAvailable) * 100, 100)
                        : 0,
                totalDuration,
                remainingMinutes: totalAvailable - totalDuration,
                count: activitiesOnly.length,
            },
        };
    }, [currentBaseEntries, startAt, endAt]);

    // 5. Action: REORDER (Conflict Nuke)
    const reorderActivities = useCallback(
        (newOrder: ActivitySessionEntry[]) => {
            // Filter out gaps to focus on real activities
            const activitiesOnly = newOrder.filter(
                (i) => i.type === 'activity',
            );

            // Set of IDs that must be unlocked
            const toUnlock = new Set<string>();
            const globalStartTime = new Date(startAt).getTime();

            // --- 1. Forward Scan (Past Collision) ---
            // If an item is locked to 9:00, but sits AFTER an item that ends at 10:00.
            let lastValidEndTime = globalStartTime;

            activitiesOnly.forEach((item) => {
                if (item.isLocked && item.startAt) {
                    const currentStart = new Date(item.startAt).getTime();
                    // Allow 1 min buffer
                    if (currentStart < lastValidEndTime - 60000) {
                        toUnlock.add(item.instanceId);
                        // Since we are unlocking it, it will technically flow immediately after previous
                        lastValidEndTime +=
                            (item.durationMinutes || 30) * 60000;
                    } else {
                        // It is valid, so it sets the new floor
                        const duration = (item.durationMinutes || 30) * 60000;
                        const currentEnd = item.endAt
                            ? new Date(item.endAt).getTime()
                            : currentStart + duration;
                        lastValidEndTime = Math.max(
                            lastValidEndTime,
                            currentEnd,
                        );
                    }
                } else {
                    // Unlocked items just push the cursor forward
                    lastValidEndTime += (item.durationMinutes || 30) * 60000;
                }
            });

            // --- 2. Backward Scan (Future Collision) ---
            // If an item is locked to 11:00, but sits BEFORE an item locked to 10:00.
            let nextLockedStartTime = Number.MAX_SAFE_INTEGER;

            for (let i = activitiesOnly.length - 1; i >= 0; i--) {
                const item = activitiesOnly[i];
                if (item.isLocked && item.startAt) {
                    const currentStart = new Date(item.startAt).getTime();
                    if (currentStart > nextLockedStartTime) {
                        toUnlock.add(item.instanceId);
                    } else {
                        nextLockedStartTime = currentStart;
                    }
                }
            }

            // --- Apply Changes ---
            const finalDraft = activitiesOnly.map((item) => {
                if (toUnlock.has(item.instanceId)) {
                    return {
                        ...item,
                        isLocked: false,
                        // CRITICAL FIX: Wipe the old times.
                        // If we leave "09:00" here, the scheduler calculates a conflict
                        // before it realizes it should float.
                        startAt: '',
                        endAt: '',
                    };
                }
                return item;
            });

            setLocalDraft(finalDraft);
        },
        [startAt],
    );

    const addActivity = useCallback(
        (activity: Activity) => {
            const entry: ActivitySessionEntry = {
                instanceId: crypto.randomUUID(),
                activity,
                durationMinutes: activity.durationMinutes || 30,
                isLocked: false,
                type: 'activity',
                startAt: '',
                endAt: '',
                documentId: '',
            };
            setLocalDraft((prev) => [...(prev ?? currentBaseEntries), entry]);
        },
        [currentBaseEntries],
    );

    const insertAtGap = useCallback(
        (gapInstanceId: string, activity: Activity) => {
            const targetId = gapInstanceId.replace('gap-before-', '');
            setLocalDraft((prev) => {
                const base = prev ?? currentBaseEntries;
                const idx = base.findIndex((i) => i.instanceId === targetId);
                const entry: ActivitySessionEntry = {
                    instanceId: crypto.randomUUID(),
                    activity,
                    durationMinutes: activity.durationMinutes || 0,
                    isLocked: false,
                    type: 'activity',
                    startAt: '',
                    endAt: '',
                    documentId: '',
                };
                const copy = [...base];
                if (idx !== -1) copy.splice(idx, 0, entry);
                else copy.push(entry);
                return copy;
            });
        },
        [currentBaseEntries],
    );

    const removeActivity = useCallback(
        (id: string) => {
            setLocalDraft((prev) => {
                const base = prev ?? currentBaseEntries;
                const item = base.find((i) => i.instanceId === id);
                if (item?.isLocked) return base;
                if (item?.documentId)
                    setDeletedDocumentIds((d) => [...d, item.documentId!]);
                return base.filter((i) => i.instanceId !== id);
            });
        },
        [currentBaseEntries],
    );

    const toggleLock = useCallback(
        (id: string) => {
            setLocalDraft((prev) => {
                const base = prev ?? currentBaseEntries;
                return base.map((item) => {
                    if (item.instanceId !== id) return item;
                    const rendered = timelineItems.find(
                        (t) => t.instanceId === id,
                    );
                    return {
                        ...item,
                        isLocked: !item.isLocked,
                        // If locking, snap to current calculated time. If unlocking, wipe time.
                        startAt: !item.isLocked
                            ? rendered?.startAt || item.startAt
                            : '',
                        endAt: !item.isLocked
                            ? rendered?.endAt || item.endAt
                            : '',
                    };
                });
            });
        },
        [currentBaseEntries, timelineItems],
    );

    return {
        timelineItems,
        draft: draftWithTimes,
        capacityMetrics,
        isDirty: localDraft !== null,
        addActivity,
        insertAtGap,
        removeActivity,
        toggleLock,
        reorderActivities,
        reset: () => {
            setLocalDraft(null);
            setDeletedDocumentIds([]);
        },
        deletedDocumentIds: deletedDocumentIds || [],
        isLoading: isQueryLoading,
    };
};
