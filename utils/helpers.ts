import { format, parseISO, isDate, startOfDay, endOfDay } from 'date-fns';
import { StrapiMedia, StrapiResponse } from '@/types';

/* -------------------- */
/* Date/Time Types      */
/* -------------------- */

export type DateInput = Date | string;

export type TimeFormatType =
    | '24h'
    | '12h'
    | '12h-uppercase'
    | 'hours-minutes'
    | 'hours-minutes-ampm'
    | '12h-simple';

export type DateFormatType = 'iso' | 'short' | 'long';

export type DateTimeFormatType = 'iso' | 'readable';

/* -------------------- */
/* Strapi Media Types   */
/* -------------------- */

export type MediaFormat = 'thumbnail' | 'small' | 'medium' | 'large';

/* -------------------- */
/* Helpers              */
/* -------------------- */

function normalizeDate(input: DateInput | null | undefined): Date | null {
    if (!input) return null;

    if (isDate(input)) return input;

    if (typeof input === 'string') {
        const parsed = parseISO(input);
        return isNaN(parsed.getTime()) ? null : parsed;
    }

    return null;
}

/* -------------------- */
/* Format Service       */
/* -------------------- */

export class FormatService {
    /* ---------- TIME ---------- */
    static formatTime(
        input: DateInput,
        formatType: TimeFormatType = '24h',
    ): string {
        const date = normalizeDate(input);
        if (!date) return '';

        const formats: Record<TimeFormatType, string> = {
            '24h': 'HH:mm:ss',
            '12h': 'hh:mm:ss a',
            '12h-uppercase': 'hh:mm:ss aaa',
            'hours-minutes': 'HH:mm',
            'hours-minutes-ampm': 'hh:mm a',
            '12h-simple': 'h:mm a',
        };

        return format(date, formats[formatType]);
    }

    /* ---------- DATE ---------- */
    static formatDate(
        input: DateInput,
        formatType: DateFormatType = 'iso',
    ): string {
        const date = normalizeDate(input);
        if (!date) return '';

        const formats: Record<DateFormatType, string> = {
            iso: 'yyyy-MM-dd',
            short: 'dd MMM yyyy',
            long: 'EEEE, dd MMMM yyyy',
        };

        return format(date, formats[formatType]);
    }

    /* ---------- DATETIME ---------- */
    static formatDateTime(
        input: DateInput,
        formatType: DateTimeFormatType = 'iso',
    ): string {
        const date = normalizeDate(input);
        if (!date) return '';

        const formats: Record<DateTimeFormatType, string> = {
            iso: 'yyyy-MM-dd HH:mm:ss',
            readable: 'dd MMM yyyy, hh:mm a',
        };

        return format(date, formats[formatType]);
    }

    /**
     * Returns ISO string for the start of the day (00:00:00.000)
     * Ideal for Strapi DateTime filtering
     */
    static formatStartOfDay(input: DateInput): string {
        const date = normalizeDate(input);
        if (!date) return '';
        return startOfDay(date).toISOString();
    }

    /**
     * Returns ISO string for the end of the day (23:59:59.999)
     * Ideal for Strapi DateTime filtering
     */
    static formatEndOfDay(input: DateInput): string {
        const date = normalizeDate(input);
        if (!date) return '';
        return endOfDay(date).toISOString();
    }

    /* ---------- STRAPI MEDIA ---------- */
    static formatStrapiMedia(
        media: StrapiResponse<StrapiMedia> | StrapiMedia | null | undefined,
        format: MediaFormat = 'thumbnail',
        fallbackUrl?: string,
    ): string {
        if (!media) return fallbackUrl || '';

        let resource: StrapiMedia;

        if ('data' in media && media.data) {
            resource =
                'attributes' in media.data
                    ? (media.data.attributes as StrapiMedia)
                    : (media.data as StrapiMedia);
        } else {
            resource = media as StrapiMedia;
        }

        if (!resource || !resource.url) return fallbackUrl || '';

        const formatUrl = resource.formats?.[format]?.url;
        const path = formatUrl || resource.url;

        if (path.startsWith('/')) {
            const baseUrl =
                process.env.NEXT_PUBLIC_STRAPI_API_URL ||
                'http://127.0.0.1:1337';
            return `${baseUrl}${path}`;
        }

        return path;
    }

    /* ---------- STRAPI FILTER HELPERS ---------- */

    /**
     * Creates a UTC start of day without local timezone shifting.
     * Input: "2026-01-27" -> Output: "2026-01-27T00:00:00.000Z"
     */
    static formatStartOfDayUTC(dateString: string): string {
        if (!dateString) return '';
        // We split to ensure we only take the YYYY-MM-DD part if a full string is passed
        const dateOnly = dateString.split('T')[0];
        return `${dateOnly}T00:00:00.000Z`;
    }

    /**
     * Creates a UTC end of day without local timezone shifting.
     * Input: "2026-01-27" -> Output: "2026-01-27T23:59:59.999Z"
     */
    static formatEndOfDayUTC(dateString: string): string {
        if (!dateString) return '';
        const dateOnly = dateString.split('T')[0];
        return `${dateOnly}T23:59:59.999Z`;
    }

    static formatDuration(totalMinutes: number): string {
        if (!totalMinutes || totalMinutes <= 0) return '0 min';

        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        const hLabel = hours === 1 ? 'hr' : 'hrs'; // Optional: handle plural
        const mLabel = 'min';

        if (hours > 0) {
            return `${hours} ${hLabel}${minutes > 0 ? ` ${minutes} ${mLabel}` : ''}`;
        }
        return `${minutes} ${mLabel}`;
    }
}
