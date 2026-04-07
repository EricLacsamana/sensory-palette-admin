export const getOperatingHoursForDate = (targetDate: Date | string) => {
    const base = new Date(targetDate);
    const startStr = process.env.NEXT_PUBLIC_OPERATING_START || '08:00';
    const endStr = process.env.NEXT_PUBLIC_OPERATING_END || '18:00';

    const [startHour, startMin] = startStr.split(':').map(Number);
    const [endHour, endMin] = endStr.split(':').map(Number);

    const s = new Date(base);
    s.setHours(startHour, startMin, 0, 0);

    const e = new Date(base);
    e.setHours(endHour, endMin, 0, 0);

    const now = new Date();
    const isToday =
        s.getFullYear() === now.getFullYear() &&
        s.getMonth() === now.getMonth() &&
        s.getDate() === now.getDate();

    if (isToday) {
        const coeff = 1000 * 60 * 5;
        const roundedNow = new Date(Math.ceil(now.getTime() / coeff) * coeff);
        if (roundedNow > s) {
            s.setTime(roundedNow.getTime());
        }
    }

    const finalEnd = new Date(e);
    if (s > e) s.setTime(e.getTime());

    return { start: s.toISOString(), end: finalEnd.toISOString() };
};
