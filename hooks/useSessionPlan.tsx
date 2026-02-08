'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';

export const useSessionPlan = (
    startDate: string,
    startTimeStr: string,
    initialSessions?: any[],
) => {
    const [rawPlan, setRawPlan] = useState<any[]>([]);

    const baseStartTimestamp = useMemo(() => {
        const d = new Date(`${startDate}T${startTimeStr}`);
        return isNaN(d.getTime()) ? null : d.getTime();
    }, [startDate, startTimeStr]);

    useEffect(() => {
        if (initialSessions?.length && rawPlan.length === 0) {
            const mappedSessions = initialSessions.map((sess) => ({
                ...sess,
                instanceId: sess.instanceId || sess.id || crypto.randomUUID(),
                isLocked: !!(sess.id || sess.documentId),
                duration:
                    sess.durationMinutes ||
                    (sess.durationSeconds ? sess.durationSeconds / 60 : 30),
                name:
                    sess.name ||
                    sess.attributes?.name ||
                    sess.activity?.name ||
                    (sess.isBreak ? 'Rest Break' : 'Activity'),
                isBreak: !!sess.isBreak,
                // Store the original fixed start if it exists
                startTime: sess.startTime || sess.attributes?.startTime,
            }));
            setRawPlan(mappedSessions);
        }
    }, [initialSessions]);

    const toggleLock = (instanceId: string) => {
        setRawPlan((prev) =>
            prev.map((item) =>
                item.instanceId === instanceId
                    ? { ...item, isLocked: !item.isLocked }
                    : item,
            ),
        );
    };

    const setPlan = useCallback(
        (update: any[] | ((prev: any[]) => any[])) => {
            setRawPlan((prev) => {
                const nextOrder =
                    typeof update === 'function' ? update(prev) : update;
                if (baseStartTimestamp === null) return nextOrder;

                let currentTs = baseStartTimestamp;
                let isValid = true;

                for (let i = 0; i < nextOrder.length; i++) {
                    const item = nextOrder[i];
                    const durationMs = (item.duration || 30) * 60000;

                    if (item.isLocked && item.startTime) {
                        const lockedStart = new Date(item.startTime).getTime();

                        // POSSIBILITY 1: The "Overfill"
                        // If floating items above this lock push the time past the lock's start.
                        // We allow a 59-second "mercy" buffer for rounding.
                        if (currentTs > lockedStart + 59000) {
                            console.warn(
                                `Cannot move: "${item.name}" is pushed past its locked time.`,
                            );
                            isValid = false;
                            break;
                        }

                        // POSSIBILITY 2: The "Jump"
                        // If there is a gap (e.g., items above ended at 10:00 but this lock is at 10:30),
                        // the timeline "teleports" to the lock. This allows swapping items
                        // across the lock without breaking the flow.
                        currentTs = lockedStart + durationMs;
                    } else {
                        // POSSIBILITY 3: The "Float"
                        // Standard items just stack their duration.
                        currentTs += durationMs;
                    }

                    // POSSIBILITY 4: The "End of Day" check (Optional)
                    // You could add a check here if currentTs > 18:00 (6 PM)
                    // but usually, it's better to let the user see the overlap first.
                }

                return isValid ? nextOrder : prev;
            });
        },
        [baseStartTimestamp],
    );

    const plan = useMemo(() => {
        if (baseStartTimestamp === null) return [];
        let currentTimestamp = baseStartTimestamp;
        const baseUrl =
            process.env.NEXT_PUBLIC_STRAPI_URL?.replace(/\/$/, '') ||
            'http://localhost:1337';

        return rawPlan
            .map((item) => {
                if (!item) return null;
                const durationMs = (item.duration || 30) * 60000;

                let itemStartTs =
                    item.isLocked && item.startTime
                        ? new Date(item.startTime).getTime()
                        : currentTimestamp;

                const startDateObj = new Date(itemStartTs);
                const endDateObj = new Date(itemStartTs + durationMs);

                const bannerData =
                    item?.attributes?.banner?.data?.attributes ||
                    item?.banner?.data?.attributes ||
                    item?.banner ||
                    item?.activity?.banner?.data?.attributes ||
                    item?.activity?.banner;
                const bannerPath =
                    bannerData?.formats?.thumbnail?.url ||
                    bannerData?.url ||
                    item.imageUrl;

                const session = {
                    ...item,
                    sessionId:
                        item.sessionId ||
                        item.id ||
                        `sess-${crypto.randomUUID()}`,
                    startTime: startDateObj.toISOString(),
                    endTime: endDateObj.toISOString(),
                    durationSeconds: (item.duration || 30) * 60,
                    imageUrl: bannerPath
                        ? bannerPath.startsWith('http')
                            ? bannerPath
                            : `${baseUrl}${bannerPath}`
                        : null,
                    displayStart: startDateObj.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                    }),
                    displayEnd: endDateObj.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                    }),
                };

                currentTimestamp = itemStartTs + durationMs;
                return session;
            })
            .filter(Boolean);
    }, [rawPlan, baseStartTimestamp]);

    return {
        plan,
        rawPlan,
        setPlan,
        toggleLock,
        capacityMetrics: { percentUsed: 0 },
    };
};
