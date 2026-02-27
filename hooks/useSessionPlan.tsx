'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getActivitySessionsNew } from '@/api/acitivity-session';
import { ActivitySessionEntry } from '@/types/activitiy-session';
import { Activity } from '@/types/actitivity';
import { calculateSchedule } from '@/components/SessionPlanningModal/utils/scheduler';
import { UserResponse } from '@/types';

interface SessionPlanProps {
    startAt: string;
    endAt: string;
    student?: UserResponse;
}

export const useSessionPlan = ({
    startAt,
    endAt,
    student,
}: SessionPlanProps) => {
    const [localDraft, setLocalDraft] = useState<ActivitySessionEntry[] | null>(
        null,
    );
    const [deletedDocumentIds, setDeletedDocumentIds] = useState<string[]>([]);
    const [past, setPast] = useState<ActivitySessionEntry[][]>([]);
    const [future, setFuture] = useState<ActivitySessionEntry[][]>([]);
    const [prevStartAt, setPrevStartAt] = useState(startAt);

    if (startAt !== prevStartAt) {
        setPrevStartAt(startAt);
        setLocalDraft(null);
        setDeletedDocumentIds([]);
        setPast([]);
        setFuture([]);
    }

    // --- UPDATED: Date boundaries for fetching ---
    const startOfDay = new Date(startAt);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(startAt);
    endOfDay.setHours(23, 59, 59, 999);

    const now = new Date();
    const isToday =
        startOfDay.getFullYear() === now.getFullYear() &&
        startOfDay.getMonth() === now.getMonth() &&
        startOfDay.getDate() === now.getDate();

    // If viewing today, only fetch from this exact moment onward.
    // If viewing a future date, fetch the whole day.
    const queryStartBound = isToday
        ? now.toISOString()
        : startOfDay.toISOString();
    // ----------------------------------------------

    const { data: activitySessions, isLoading: isQueryLoading } = useQuery({
        queryKey: [
            'activity-sessions',
            {
                populate: {
                    activity: { populate: '*' },
                    student: { populate: '*' },
                },
                filters: {
                    startAt: {
                        $gte: queryStartBound, // <-- Applied dynamic boundary here
                        $lte: endOfDay.toISOString(),
                    },
                    actualStartAt: { $null: true },
                    activitySessionStatus: {
                        $in: ['pending', 'reschedule'],
                    },
                },
            },
        ],
        queryFn: getActivitySessionsNew,
        enabled: true,
        staleTime: 0,
    });

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
            .map((s: any) => {
                const sTime = new Date(s.startAt).getTime();
                const eTime = new Date(s.endAt).getTime();
                const duration = Math.max(
                    Math.round((eTime - sTime) / 60000),
                    0,
                );

                return {
                    ...s,
                    isLocked: true,
                    type: 'activity',
                    durationMinutes: duration,
                    instanceId:
                        s.documentId || s.id?.toString() || crypto.randomUUID(),
                    student: s.student,
                };
            });
    }, [localDraft, activitySessions]);

    const commitChange = useCallback(
        (newDraft: ActivitySessionEntry[]) => {
            setPast((prev) => [...prev, currentBaseEntries]);
            setFuture([]);
            setLocalDraft(newDraft);
        },
        [currentBaseEntries],
    );

    const undo = useCallback(() => {
        if (past.length === 0) return;
        const previous = past[past.length - 1];
        setFuture((prev) => [currentBaseEntries, ...prev]);
        setPast(past.slice(0, -1));
        setLocalDraft(previous);
    }, [past, currentBaseEntries]);

    const redo = useCallback(() => {
        if (future.length === 0) return;
        const next = future[0];
        setPast((prev) => [...prev, currentBaseEntries]);
        setFuture(future.slice(1));
        setLocalDraft(next);
    }, [future, currentBaseEntries]);

    const { timelineItems, draftWithTimes, capacityMetrics } = useMemo(() => {
        const { items, totalDuration } = calculateSchedule(
            currentBaseEntries,
            startAt,
        );
        const activitiesOnly = items.filter((i) => i.type === 'activity');
        const sessionEndMs = new Date(endAt).getTime();
        const totalAvailable = Math.max(
            0,
            (sessionEndMs - new Date(startAt).getTime()) / 60000,
        );

        const validatedItems = items.map((item) => {
            if (item.type !== 'activity') return item;
            let hasConflict = false;
            let conflictReason = '';
            const itemStart = new Date(item.startAt).getTime();
            const itemEnd = new Date(item.endAt).getTime();

            if (itemEnd > sessionEndMs) {
                hasConflict = true;
                conflictReason = 'Exceeds session time';
            }

            if (!hasConflict) {
                const collision = activitiesOnly.find(
                    (other) =>
                        other.instanceId !== item.instanceId &&
                        other.isLocked &&
                        itemStart < new Date(other.endAt).getTime() &&
                        itemEnd > new Date(other.startAt).getTime(),
                );
                if (collision) {
                    hasConflict = true;
                    conflictReason = 'Overlaps locked activity';
                }
            }
            return { ...item, hasConflict, conflictReason };
        });

        return {
            timelineItems: validatedItems,
            draftWithTimes: validatedItems.filter((i) => i.type === 'activity'),
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

    const toggleLock = useCallback(
        (id: string) => {
            const itemIndex = currentBaseEntries.findIndex(
                (i) => i.instanceId === id,
            );
            const item = currentBaseEntries[itemIndex];
            if (!item) return;

            const newDraft = currentBaseEntries.map((currItem) => {
                if (currItem.instanceId !== id) return currItem;
                const willBeLocked = !currItem.isLocked;
                let newStart = currItem.startAt;
                let newEnd = currItem.endAt;

                if (willBeLocked) {
                    const renderedItem = timelineItems.find(
                        (t) => t.instanceId === id,
                    );
                    if (renderedItem) {
                        newStart = renderedItem.startAt;
                        newEnd = renderedItem.endAt;
                    }
                }

                return {
                    ...currItem,
                    isLocked: willBeLocked,
                    startAt: newStart,
                    endAt: newEnd,
                };
            });
            commitChange(newDraft);
        },
        [currentBaseEntries, timelineItems, commitChange],
    );

    const updateActivityStartTime = useCallback(
        (id: string, timeStr: string) => {
            const [hours, minutes] = timeStr.split(':').map(Number);
            const baseDate = new Date(startAt);
            baseDate.setHours(hours, minutes, 0, 0);

            const newDraft = currentBaseEntries.map((item) => {
                if (item.instanceId !== id) return item;
                const duration = item.durationMinutes || 30;
                const endDate = new Date(baseDate.getTime() + duration * 60000);
                return {
                    ...item,
                    isLocked: true,
                    startAt: baseDate.toISOString(),
                    endAt: endDate.toISOString(),
                };
            });
            commitChange(newDraft);
        },
        [currentBaseEntries, startAt, commitChange],
    );

    const reorderActivities = useCallback(
        (newOrder: ActivitySessionEntry[]) => {
            const activitiesOnly = newOrder.filter(
                (i) => i.type === 'activity',
            );
            let currentCursor = new Date(startAt).getTime();

            const finalDraft = activitiesOnly.map((item) => {
                const durationMs = (item.durationMinutes || 30) * 60000;
                let newStartIso = '';
                let newEndIso = '';

                if (item.isLocked && item.startAt) {
                    const lockedStartTime = new Date(item.startAt).getTime();
                    if (lockedStartTime > currentCursor)
                        currentCursor = lockedStartTime;

                    newStartIso = item.startAt;
                    const finalEndMs = item.endAt
                        ? new Date(item.endAt).getTime()
                        : lockedStartTime + durationMs;
                    newEndIso = new Date(finalEndMs).toISOString();
                    currentCursor = finalEndMs;
                } else {
                    newStartIso = new Date(currentCursor).toISOString();
                    currentCursor += durationMs;
                    newEndIso = new Date(currentCursor).toISOString();
                }

                return {
                    ...item,
                    startAt: newStartIso,
                    endAt: newEndIso,
                };
            });
            commitChange(finalDraft);
        },
        [startAt, commitChange],
    );

    const addActivity = useCallback(
        (activity: Activity) => {
            const duration = activity.durationMinutes || 30;
            let currentCursor = new Date(startAt).getTime();

            if (timelineItems && timelineItems.length > 0) {
                const latestItem = timelineItems.reduce((latest, item) => {
                    const itemEnd = item.endAt
                        ? new Date(item.endAt).getTime()
                        : 0;
                    return itemEnd > latest ? itemEnd : latest;
                }, currentCursor);
                currentCursor = latestItem;
            }

            const entry: ActivitySessionEntry = {
                instanceId: crypto.randomUUID(),
                activity,
                durationMinutes: duration,
                isLocked: true,
                type: 'activity',
                startAt: new Date(currentCursor).toISOString(),
                endAt: new Date(currentCursor + duration * 60000).toISOString(),
                documentId: '',
                ...(student ? { student } : {}),
            };
            commitChange([...currentBaseEntries, entry]);
        },
        [currentBaseEntries, commitChange, student, startAt, timelineItems],
    );

    const insertAtGap = useCallback(
        (gapInstanceId: string, activity: Activity) => {
            const targetId = gapInstanceId.replace('gap-before-', '');
            const idx = currentBaseEntries.findIndex(
                (i) => i.instanceId === targetId,
            );

            let tempStart = startAt;
            if (idx !== -1 && currentBaseEntries[idx].startAt) {
                tempStart = currentBaseEntries[idx].startAt;
            }

            const duration = activity.durationMinutes || 30;
            const entry: ActivitySessionEntry = {
                instanceId: crypto.randomUUID(),
                activity,
                durationMinutes: duration,
                isLocked: true,
                type: 'activity',
                startAt: tempStart,
                endAt: new Date(
                    new Date(tempStart).getTime() + duration * 60000,
                ).toISOString(),
                documentId: '',
            };

            const copy = [...currentBaseEntries];
            if (idx !== -1) copy.splice(idx, 0, entry);
            else copy.push(entry);
            commitChange(copy);
        },
        [currentBaseEntries, commitChange, startAt],
    );

    const removeActivity = useCallback(
        (id: string) => {
            const item = currentBaseEntries.find((i) => i.instanceId === id);
            if (item?.documentId)
                setDeletedDocumentIds((d) => [...d, item.documentId!]);
            commitChange(currentBaseEntries.filter((i) => i.instanceId !== id));
        },
        [currentBaseEntries, commitChange],
    );

    return {
        timelineItems,
        draft: draftWithTimes,
        capacityMetrics,
        isDirty: localDraft !== null || deletedDocumentIds.length > 0,
        addActivity,
        insertAtGap,
        removeActivity,
        toggleLock,
        reorderActivities,
        updateActivityStartTime,
        reset: () => {
            setLocalDraft(null);
            setDeletedDocumentIds([]);
            setPast([]);
            setFuture([]);
        },
        deletedDocumentIds,
        isLoading: isQueryLoading,
        undo,
        redo,
        canUndo: past.length > 0,
        canRedo: future.length > 0,
    };
};
