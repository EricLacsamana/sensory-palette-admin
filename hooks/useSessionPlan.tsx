'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getActivitySessionsNew } from '@/api/acitivity-session';
import { ActivitySessionEntry } from '@/types/activitiy-session';
import { Activity } from '@/types/actitivity';
import { calculateSchedule } from '@/components/SessionPlanningModal/utils/scheduler';
import { toast } from 'sonner';

interface SessionPlanProps {
    startAt: string;
    endAt: string;
}

export const useSessionPlan = ({ startAt, endAt }: SessionPlanProps) => {
    // --- STATE ---
    const [localDraft, setLocalDraft] = useState<ActivitySessionEntry[] | null>(
        null,
    );
    const [deletedDocumentIds, setDeletedDocumentIds] = useState<string[]>([]);

    // --- HISTORY ---
    const [past, setPast] = useState<ActivitySessionEntry[][]>([]);
    const [future, setFuture] = useState<ActivitySessionEntry[][]>([]);

    // --- RENDER-PHASE RESET ---
    // We store the 'last seen' startAt to detect when the date changes.
    // This avoids the "setState in useEffect" warning and is more performant.
    const [prevStartAt, setPrevStartAt] = useState(startAt);

    if (startAt !== prevStartAt) {
        setPrevStartAt(startAt);
        setLocalDraft(null);
        setDeletedDocumentIds([]);
        setPast([]);
        setFuture([]);
    }

    // --- QUERY SETUP ---
    const startOfDay = new Date(startAt);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startAt);
    endOfDay.setHours(23, 59, 59, 999);

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
                        $gte: startOfDay.toISOString(),
                        $lte: endOfDay.toISOString(),
                    },
                },
            },
        ],
        queryFn: getActivitySessionsNew,
        enabled: !!startAt,
        staleTime: 0,
    });

    // 1. Base Entries
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
                student: s.student,
            }));
    }, [localDraft, activitySessions]);

    // --- HISTORY HELPERS ---
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

    // 2. Scheduler & Validation
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

            // Check 1: Session Boundary
            if (itemEnd > sessionEndMs) {
                hasConflict = true;
                conflictReason = 'Exceeds session time';
            }

            // Check 2: Collision with LOCKED items
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

        const validatedDraft = validatedItems.filter(
            (i) => i.type === 'activity',
        );

        return {
            timelineItems: validatedItems,
            draftWithTimes: validatedDraft,
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

    // --- ACTIONS ---

    const toggleLock = useCallback(
        (id: string) => {
            const itemIndex = currentBaseEntries.findIndex(
                (i) => i.instanceId === id,
            );
            const item = currentBaseEntries[itemIndex];
            if (!item) return;

            // Prevent Unlocking if it causes overlap
            if (item.isLocked) {
                const prevItemEntry = currentBaseEntries[itemIndex - 1];
                const prevItemRendered = prevItemEntry
                    ? timelineItems.find(
                          (t) => t.instanceId === prevItemEntry.instanceId,
                      )
                    : null;

                const snapStartMs = prevItemRendered
                    ? new Date(prevItemRendered.endAt).getTime()
                    : new Date(startAt).getTime();

                const durationMs = (item.durationMinutes || 30) * 60000;
                const snapEndMs = snapStartMs + durationMs;

                const hasConflict = currentBaseEntries.some((other) => {
                    if (other.instanceId === id) return false;
                    if (!other.isLocked) return false;

                    const otherStart = new Date(other.startAt).getTime();
                    const otherEnd = other.endAt
                        ? new Date(other.endAt).getTime()
                        : otherStart + (other.durationMinutes || 30) * 60000;

                    return snapStartMs < otherEnd && snapEndMs > otherStart;
                });

                if (hasConflict) {
                    toast.error(
                        "Cannot unlock: Activity doesn't fit in the available gap.",
                    );
                    return;
                }
            }

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
        [currentBaseEntries, timelineItems, startAt, commitChange],
    );

    const updateActivityStartTime = useCallback(
        (id: string, timeStr: string) => {
            const base = currentBaseEntries;
            const [hours, minutes] = timeStr.split(':').map(Number);
            const baseDate = new Date(startAt);
            baseDate.setHours(hours, minutes, 0, 0);
            const newIsoStart = baseDate.toISOString();

            const newDraft = base.map((item) => {
                if (item.instanceId !== id) return item;
                const endDate = new Date(baseDate);
                endDate.setMinutes(
                    endDate.getMinutes() + (item.durationMinutes || 30),
                );
                return {
                    ...item,
                    isLocked: true,
                    startAt: newIsoStart,
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

                const isItemLocked = item.isLocked;

                if (isItemLocked && item.startAt) {
                    const lockedStartTime = new Date(item.startAt).getTime();
                    if (lockedStartTime > currentCursor) {
                        currentCursor = lockedStartTime;
                    }
                }

                if (isItemLocked && item.startAt) {
                    newStartIso = item.startAt;
                    const existingEndMs = item.endAt
                        ? new Date(item.endAt).getTime()
                        : 0;
                    const computedEndMs =
                        new Date(item.startAt).getTime() + durationMs;
                    const finalEndMs =
                        existingEndMs > new Date(item.startAt).getTime()
                            ? existingEndMs
                            : computedEndMs;

                    newEndIso = new Date(finalEndMs).toISOString();
                    currentCursor = finalEndMs;
                } else {
                    newStartIso = new Date(currentCursor).toISOString();
                    currentCursor += durationMs;
                    newEndIso = new Date(currentCursor).toISOString();
                }
                return {
                    ...item,
                    isLocked: isItemLocked,
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
            const entry: ActivitySessionEntry = {
                instanceId: crypto.randomUUID(),
                activity,
                durationMinutes: activity.durationMinutes,
                isLocked: false,
                type: 'activity',
                startAt: '',
                endAt: '',
                documentId: '',
            };
            commitChange([...currentBaseEntries, entry]);
        },
        [currentBaseEntries, commitChange],
    );

    const insertAtGap = useCallback(
        (gapInstanceId: string, activity: Activity) => {
            const targetId = gapInstanceId.replace('gap-before-', '');
            const idx = currentBaseEntries.findIndex(
                (i) => i.instanceId === targetId,
            );
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
            const copy = [...currentBaseEntries];
            if (idx !== -1) copy.splice(idx, 0, entry);
            else copy.push(entry);
            commitChange(copy);
        },
        [currentBaseEntries, commitChange],
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
