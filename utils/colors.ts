import React from 'react';

// We have exactly 250 degrees of safe hues (70 to 320, avoiding reds and yellows).
// The human eye can only distinguish about 20 distinct colors in this specific range.
// We perfectly slice those 20 hues, and explicitly scramble them so sequential IDs never get similar colors.
const SCATTERED_HUES = [
    200, // Light Blue
    70, // Lime
    265, // Purple
    122, // Green
    304, // Pink/Fuchsia
    161, // Cyan/Teal
    226, // Indigo
    83, // Kelly Green
    278, // Violet
    135, // Mint
    317, // Hot Pink
    187, // Sky Blue
    96, // Forest Green
    252, // Deep Purple
    109, // Emerald
    239, // Royal Blue
    148, // Aquamarine
    291, // Magenta
    174, // Light Teal
    213, // Ocean Blue
];

export const getInfiniteUserColorVars = (
    id: number | string | null | undefined,
) => {
    // 1. Create a highly reliable numeric hash from the ID (whether it's a string or number)
    const strId = String(id || '1');
    let hash = 0;
    for (let i = 0; i < strId.length; i++) {
        hash = hash * 31 + strId.charCodeAt(i);
    }

    // 2. Pick one of our 20 perfectly distinct, scrambled hues
    const index = Math.abs(hash) % SCATTERED_HUES.length;
    const hue = SCATTERED_HUES[index];

    return {
        '--user-bg': `hsl(${hue}, 85%, 95%)`, // Light Background
        '--user-border': `hsl(${hue}, 60%, 80%)`, // Soft Border
        '--user-text': `hsl(${hue}, 70%, 30%)`, // Dark Text
        '--user-line': `hsl(${hue}, 60%, 75%)`, // Connecting Line
        '--user-dot': `hsl(${hue}, 60%, 50%)`, // Solid Dot
    } as React.CSSProperties;
};

// Pass these arbitrary Tailwind classes to your components.
export const DYNAMIC_COLOR_CLASSES = {
    bg: 'bg-[var(--user-bg)]',
    border: 'border-[var(--user-border)]',
    text: 'text-[var(--user-text)]',
    line: 'bg-[var(--user-line)]',
    dot: 'bg-[var(--user-dot)]',
    dotBorder: 'border-[var(--user-dot)]',
};
