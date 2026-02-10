import { ActivitySessionEntry } from '@/types/activitiy-session';

export interface ScheduledItem extends ActivitySessionEntry {
    hasConflict: boolean;
    conflictReason?: string;
}

export interface ScheduleGap {
    afterIndex: number;
    durationMinutes: number;
    startAt: string; // ISO String - Aligned with component
    endAt: string; // ISO String - Aligned with component
    isNegative: boolean;
}

export interface ScheduleResult {
    items: ScheduledItem[];
    gaps: ScheduleGap[];
}

const toTimestamp = (iso: string | undefined): number => {
    if (!iso) return 0;
    return new Date(iso).getTime();
};

const addMinutes = (iso: string, minutes: number): string => {
    const date = new Date(iso);
    date.setMinutes(date.getMinutes() + minutes);
    return date.toISOString();
};

const diffInMin = (startIso: string, endIso: string): number => {
    const start = new Date(startIso).getTime();
    const end = new Date(endIso).getTime();
    return Math.floor((end - start) / (1000 * 60));
};

export const calculateSchedule = (
    entries: ActivitySessionEntry[],
    globalStartDateTime: string,
): ScheduleResult => {
    const items: ScheduledItem[] = [];
    const gaps: ScheduleGap[] = [];

    let currentCursor = globalStartDateTime;

    const lockedItems = entries
        .map((item, idx) => ({ ...item, originalIndex: idx }))
        .filter((i) => i.isLocked && i.startAt)
        .sort((a, b) => toTimestamp(a.startAt) - toTimestamp(b.startAt));

    entries.forEach((entry, index) => {
        const duration = entry.durationMinutes || 30;
        let start = currentCursor;
        let end = addMinutes(start, duration);
        let hasConflict = false;
        let conflictReason = '';

        // --- A. LOCKED ITEM LOGIC ---
        if (entry.isLocked && entry.startAt && entry.endAt) {
            const lockedStart = entry.startAt;
            const lockedEnd = entry.endAt;

            // Gap Check: If cursor is behind the locked start, we found a gap
            if (toTimestamp(currentCursor) < toTimestamp(lockedStart)) {
                gaps.push({
                    afterIndex: index - 1,
                    durationMinutes: diffInMin(currentCursor, lockedStart),
                    startAt: currentCursor,
                    endAt: lockedStart,
                    isNegative: false,
                });
            }

            // Conflict Check: If cursor pushed past the locked start
            if (toTimestamp(currentCursor) > toTimestamp(lockedStart)) {
                hasConflict = true;
                const overlap = diffInMin(lockedStart, currentCursor);
                conflictReason = `Overlaps with previous items by ${overlap}m`;
            }

            start = lockedStart;
            end = lockedEnd;
            currentCursor = lockedEnd;
        }

        // --- B. UNLOCKED ITEM LOGIC ---
        else {
            const nextLocked = lockedItems.find(
                (l) =>
                    toTimestamp(l.startAt) < toTimestamp(end) &&
                    l.originalIndex > index,
            );

            if (nextLocked && nextLocked.startAt) {
                if (toTimestamp(end) > toTimestamp(nextLocked.startAt)) {
                    hasConflict = true;
                    const timeStr = new Date(
                        nextLocked.startAt,
                    ).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                    });
                    conflictReason = `Extends into locked item starting at ${timeStr}`;
                }
            }

            start = currentCursor;
            end = addMinutes(start, duration);
            currentCursor = end;
        }

        items.push({
            ...entry,
            startAt: start,
            endAt: end,
            hasConflict: hasConflict || !!entry.hasConflict,
            conflictReason,
        });
    });

    return { items, gaps };
};
