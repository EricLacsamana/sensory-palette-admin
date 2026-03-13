export const USER_COLORS = [
    {
        name: 'Indigo',
        bg: 'bg-indigo-50',
        border: 'border-indigo-200',
        text: 'text-indigo-700',
        dot: 'bg-indigo-500',
        line: 'bg-indigo-300',
    },
    {
        name: 'Emerald',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-700',
        dot: 'bg-emerald-500',
        line: 'bg-emerald-300',
    },
    {
        name: 'Amber',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-700',
        dot: 'bg-amber-500',
        line: 'bg-amber-300',
    },
    {
        name: 'Rose',
        bg: 'bg-rose-50',
        border: 'border-rose-200',
        text: 'text-rose-700',
        dot: 'bg-rose-500',
        line: 'bg-rose-300',
    },
    {
        name: 'Violet',
        bg: 'bg-violet-50',
        border: 'border-violet-200',
        text: 'text-violet-700',
        dot: 'bg-violet-500',
        line: 'bg-violet-300',
    },
    {
        name: 'Cyan',
        bg: 'bg-cyan-50',
        border: 'border-cyan-200',
        text: 'text-cyan-700',
        dot: 'bg-cyan-500',
        line: 'bg-cyan-300',
    },
    {
        name: 'Fuchsia',
        bg: 'bg-fuchsia-50',
        border: 'border-fuchsia-200',
        text: 'text-fuchsia-700',
        dot: 'bg-fuchsia-500',
        line: 'bg-fuchsia-300',
    },
    {
        name: 'Lime',
        bg: 'bg-lime-50',
        border: 'border-lime-200',
        text: 'text-lime-700',
        dot: 'bg-lime-500',
        line: 'bg-lime-300',
    },
];

export const getUserColor = (id: number | string = 0) => {
    // Robust ID handling (string or number)
    const numId =
        typeof id === 'string'
            ? id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
            : Number(id);
    const index = Math.abs(numId || 0) % USER_COLORS.length;
    return USER_COLORS[index];
};
