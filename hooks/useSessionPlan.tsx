import { useState, useMemo } from 'react';

export interface SessionActivity {
    id: string | number;
    name?: string;
    duration?: number; // Integer from backend (e.g., 15)
    attributes?: {
        name?: string;
        duration?: number;
        banner?: {
            data?: {
                attributes: {
                    url: string;
                };
            };
        };
    };
    [key: string]: any;
}

export interface DragState {
    draggedIndex: number | null;
    dragOverIndex: number | null;
    isLibraryDrag: boolean;
}

export interface CapacityMetrics {
    remainingSec: number;
    percentUsed: number;
}

export interface TimelineItem extends SessionActivity {
    start: string;
    end: string;
}

export const useSessionPlan = (
    initialDate: string,
    startTimeStr: string,
    operatingEndHour: number = 18,
) => {
    const [plan, setPlan] = useState<SessionActivity[]>([]);

    const [dragState, setDragState] = useState<DragState>({
        draggedIndex: null,
        dragOverIndex: null,
        isLibraryDrag: false,
    });

    // Default duration constant (15 minutes)
    const DEFAULT_MIN = 15;

    // Helper to get duration integer safely from nested or flat structure
    const getDuration = (item: SessionActivity) => {
        return item.duration ?? item.attributes?.duration ?? DEFAULT_MIN;
    };

    // 1. Total duration in seconds for progress/metrics
    const totalDurationSeconds = useMemo(() => {
        return plan.reduce((acc, curr) => {
            const mins = getDuration(curr);
            return acc + mins * 60; // Convert 15 to 900 seconds
        }, 0);
    }, [plan]);

    // 2. Capacity Metrics (Used vs Available time)
    const capacityMetrics = useMemo((): CapacityMetrics => {
        const [h, m] = startTimeStr.split(':').map(Number);
        const startInSec = h * 3600 + m * 60;
        const limitInSec = operatingEndHour * 3600;
        const totalAvailableSec = Math.max(0, limitInSec - startInSec);

        const remainingSec = Math.max(
            0,
            totalAvailableSec - totalDurationSeconds,
        );
        const percentUsed =
            totalAvailableSec > 0
                ? Math.min(
                      100,
                      (totalDurationSeconds / totalAvailableSec) * 100,
                  )
                : 100;

        return { remainingSec, percentUsed };
    }, [startTimeStr, totalDurationSeconds, operatingEndHour]);

    // 3. Timeline Generation (Calculating start/end strings)
    const timeline = useMemo((): TimelineItem[] => {
        const startDateTime = new Date(`${initialDate}T${startTimeStr}`);
        if (isNaN(startDateTime.getTime())) return [];

        let currentPos = startDateTime.getTime();

        return plan.map((item) => {
            const mins = getDuration(item);

            const startStr = new Date(currentPos).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
            });

            // Increment: Minutes * 60 seconds * 1000 milliseconds
            currentPos += mins * 60 * 1000;

            const endStr = new Date(currentPos).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
            });

            return {
                ...item,
                start: startStr,
                end: endStr,
            };
        });
    }, [plan, initialDate, startTimeStr]);

    const resetDrag = () =>
        setDragState({
            draggedIndex: null,
            dragOverIndex: null,
            isLibraryDrag: false,
        });

    return {
        plan,
        setPlan,
        timeline,
        capacityMetrics,
        dragState,
        setDragState,
        resetDrag,
    };
};
