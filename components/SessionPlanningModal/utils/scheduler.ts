import { ActivitySessionEntry } from '@/types/activitiy-session';

export interface ScheduledItem extends ActivitySessionEntry {
    startMin: number;
    endMin: number;
    hasConflict: boolean;
    conflictReason?: string;
}

export interface ScheduleGap {
    afterIndex: number; // The index of the item BEFORE this gap
    durationMinutes: number;
    startTime: string;
    endTime: string;
    isNegative: boolean; // True if overlap
}

export interface ScheduleResult {
    items: ScheduledItem[];
    gaps: ScheduleGap[];
}

// Helper: "09:30" -> 570
const timeToMin = (time: string | undefined): number => {
    if (!time || time === '--:--') return 0;
    const [h, m] = time.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
};

// Helper: 570 -> "09:30"
const minToTime = (min: number): string => {
    const safeMin = Math.max(0, min);
    const h = Math.floor(safeMin / 60);
    const m = safeMin % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

export const calculateSchedule = (
    entries: ActivitySessionEntry[],
    globalStartTime: string,
): ScheduleResult => {
    const items: ScheduledItem[] = [];
    const gaps: ScheduleGap[] = [];

    // 1. Convert start time to minutes
    let currentCursor = timeToMin(globalStartTime);

    // 2. Identify Locked Items (Anchors) ahead of time for lookups
    const lockedItems = entries
        .map((item, idx) => ({ ...item, originalIndex: idx }))
        .filter((i) => i.isLocked && i.startTime && i.startTime !== '--:--')
        .map((i) => ({
            ...i,
            startMin: timeToMin(i.startTime),
            endMin: timeToMin(i.endTime),
        }))
        .sort((a, b) => a.startMin - b.startMin);

    // 3. Main Loop
    entries.forEach((entry, index) => {
        const duration = entry.durationMinutes || 30;
        let start = currentCursor;
        let end = start + duration;
        let hasConflict = false;
        let conflictReason = '';

        // --- A. LOCKED ITEM LOGIC ---
        if (entry.isLocked && entry.startTime && entry.startTime !== '--:--') {
            const lockedStart = timeToMin(entry.startTime);
            const lockedEnd = timeToMin(entry.endTime);

            // Check for Gaps (Space available before this locked item)
            if (currentCursor < lockedStart) {
                gaps.push({
                    afterIndex: index - 1, // Correctly identifies position
                    durationMinutes: lockedStart - currentCursor,
                    startTime: minToTime(currentCursor),
                    endTime: minToTime(lockedStart),
                    isNegative: false,
                });
            }

            // Check for Overlap (Previous items pushed past this start time)
            if (currentCursor > lockedStart) {
                hasConflict = true;
                conflictReason = `Overlaps with previous items by ${currentCursor - lockedStart}m`;
            }

            start = lockedStart;
            end = lockedEnd;
            currentCursor = lockedEnd; // Jump cursor to end of locked item
        }

        // --- B. UNLOCKED ITEM LOGIC ---
        else {
            // Check Collision with FUTURE locked items
            // Find the earliest locked item that starts AFTER our current cursor
            const nextLocked = lockedItems.find(
                (l) => l.startMin < end && l.originalIndex > index,
            );

            if (nextLocked) {
                // Determine if we fit
                if (end > nextLocked.startMin) {
                    hasConflict = true;
                    conflictReason = `Extends into locked item starting at ${nextLocked.startTime}`;
                }
            }

            start = currentCursor;
            end = start + duration;
            currentCursor = end;
        }

        items.push({
            ...entry,
            startMin: start,
            endMin: end,
            startTime: minToTime(start),
            endTime: minToTime(end),
            hasConflict: hasConflict || !!entry.hasConlflict,
            conflictReason,
        });
    });

    return { items, gaps };
};
