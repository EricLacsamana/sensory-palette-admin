/**
 * Extracts a specific image format URL from a Strapi media object.
 */
import { StrapiMedia, StrapiResponse } from '@/types';

type MediaFormat = 'thumbnail' | 'small' | 'medium' | 'large';

export function getStrapiMedia(
    media: StrapiResponse<StrapiMedia> | StrapiMedia | null | undefined,
    format: MediaFormat = 'thumbnail',
): string | null {
    if (!media) return null;

    // 1. Extract the raw media object (Handling Strapi v4/v5 nesting)
    let resource: StrapiMedia;

    if ('data' in media && media.data) {
        // If it has a .data property, it's a StrapiResponse
        resource =
            'attributes' in media.data
                ? (media.data.attributes as StrapiMedia)
                : (media.data as StrapiMedia);
    } else {
        // Otherwise, assume it's the direct StrapiMedia object
        resource = media as StrapiMedia;
    }

    // 2. Safety check for the URL
    if (!resource || !resource.url) return null;

    // 3. Determine which URL to use
    const formatUrl = resource.formats?.[format]?.url;
    const path = formatUrl || resource.url;

    // 4. Handle relative vs absolute paths
    if (path.startsWith('/')) {
        const baseUrl =
            process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://127.0.0.1:1337';
        return `${baseUrl}${path}`;
    }

    return path;
}
