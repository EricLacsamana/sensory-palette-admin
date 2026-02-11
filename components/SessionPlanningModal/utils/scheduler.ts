import { ActivitySessionEntry } from '@/types/activitiy-session';

export const calculateSchedule = (
    entries: ActivitySessionEntry[],
    globalStart: string,
): { items: ActivitySessionEntry[]; totalDuration: number } => {
    const finalTimeline: ActivitySessionEntry[] = [];
    let cursor = new Date(globalStart).getTime();
    let totalActivityMinutes = 0;

    // Process only real activities; gaps are UI-only and generated on the fly
    const activities = entries.filter((e) => e.type === 'activity');

    activities.forEach((item) => {
        const durationMs = (item.durationMinutes || 0) * 60000;
        let itemStart = cursor;
        let itemEnd = cursor + durationMs;
        let hasConflict = false;
        let conflictReason = '';

        if (item.isLocked && item.startAt) {
            const lockedStart = new Date(item.startAt).getTime();
            const lockedEnd = item.endAt
                ? new Date(item.endAt).getTime()
                : lockedStart + durationMs;

            // 1. GAP DETECTION: Insert a gap if there's > 1 min of free time
            if (lockedStart > cursor + 59000) {
                const gapDuration = Math.floor((lockedStart - cursor) / 60000);
                finalTimeline.push({
                    type: 'gap',
                    instanceId: `gap-before-${item.instanceId}`,
                    durationMinutes: gapDuration,
                    startAt: new Date(cursor).toISOString(),
                    endAt: new Date(lockedStart).toISOString(),
                    isLocked: true,
                    activity: {} as any,
                } as any);
            }

            // 2. CONFLICT DETECTION: Overlap check with a 1-minute buffer
            if (cursor > lockedStart + 60000) {
                hasConflict = true;
                const overlap = Math.ceil((cursor - lockedStart) / 60000);
                conflictReason = `Overlaps by ${overlap}m`;
            }

            itemStart = lockedStart;
            itemEnd = lockedEnd;
        }

        finalTimeline.push({
            ...item,
            type: 'activity',
            startAt: new Date(itemStart).toISOString(),
            endAt: new Date(itemEnd).toISOString(),
            hasConflict,
            conflictReason,
        });

        cursor = itemEnd;
        totalActivityMinutes += item.durationMinutes || 0;
    });

    return { items: finalTimeline, totalDuration: totalActivityMinutes };
};
