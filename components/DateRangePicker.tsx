import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
    CalendarDays,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import {
    format,
    subDays,
    startOfYear,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    isWithinInterval,
    isBefore,
    isAfter,
    parseISO,
} from 'date-fns';
import { cn } from '@/lib/utils';

interface DateRange {
    from: string;
    to: string;
}

interface DateRangePickerProps {
    value: DateRange;
    onChange: (range: DateRange) => void;
    className?: string;
}

interface Preset {
    label: string;
    value: number | 'ytd';
}

const presets: Preset[] = [
    { label: 'Today', value: 0 },
    { label: 'Last 7 Days', value: 7 },
    { label: 'Last 30 Days', value: 30 },
    { label: 'Last 90 Days', value: 90 },
    { label: 'Year to Date', value: 'ytd' },
    { label: 'Last 12 Months', value: 365 },
];

export function DateRangePicker({
    value,
    onChange,
    className,
}: DateRangePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [alignment, setAlignment] = useState<'left' | 'right'>('left');
    const popoverRef = useRef<HTMLDivElement>(null);

    const initialFrom = value.from ? parseISO(value.from) : new Date();
    const initialTo = value.to ? parseISO(value.to) : new Date();

    const [currentMonth, setCurrentMonth] = useState(startOfMonth(initialTo));
    const [selection, setSelection] = useState<{
        from: Date | null;
        to: Date | null;
    }>({
        from: initialFrom,
        to: initialTo,
    });
    const [hoverDate, setHoverDate] = useState<Date | null>(null);

    useEffect(() => {
        if (value.from && value.to && !isOpen) {
            setSelection({
                from: parseISO(value.from),
                to: parseISO(value.to),
            });
            setCurrentMonth(startOfMonth(parseISO(value.to)));
        }
    }, [value, isOpen]);

    // Handle clicking outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                popoverRef.current &&
                !popoverRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // ✨ SMART EDGE DETECTION ✨
    // Checks if the dropdown will overflow the screen and flips alignment if necessary
    useEffect(() => {
        if (isOpen && popoverRef.current) {
            const rect = popoverRef.current.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const dropdownWidth = viewportWidth < 640 ? 320 : 540;

            // If expanding to the right pushes it past the edge (minus 20px padding)
            if (rect.left + dropdownWidth > viewportWidth - 20) {
                setAlignment('right');
            } else {
                setAlignment('left');
            }
        }
    }, [isOpen]);

    const calendarDays = useMemo(() => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);
        return eachDayOfInterval({ start: startDate, end: endDate });
    }, [currentMonth]);

    const handleDayClick = (day: Date) => {
        if (isAfter(day, new Date())) return;

        if (selection.from && !selection.to) {
            if (isBefore(day, selection.from)) {
                setSelection({ from: day, to: selection.from });
                applyDateChange(day, selection.from);
            } else {
                setSelection({ ...selection, to: day });
                applyDateChange(selection.from, day);
            }
            setHoverDate(null);
            setIsOpen(false);
        } else {
            setSelection({ from: day, to: null });
        }
    };

    const handleDayMouseEnter = (day: Date) => {
        if (selection.from && !selection.to && !isAfter(day, new Date())) {
            setHoverDate(day);
        }
    };

    const applyDateChange = (from: Date, to: Date) => {
        onChange({
            from: format(from, 'yyyy-MM-dd'),
            to: format(to, 'yyyy-MM-dd'),
        });
    };

    const applyPreset = (days: number | 'ytd') => {
        const end = new Date();
        let start = new Date();

        if (days === 'ytd') {
            start = startOfYear(end);
        } else {
            start = subDays(end, days as number);
        }

        setSelection({ from: start, to: end });
        setCurrentMonth(startOfMonth(end));
        applyDateChange(start, end);
        setIsOpen(false);
    };

    const formatDateDisplay = (dateString: string) => {
        if (!dateString) return 'Select Date';
        return format(new Date(dateString), 'MMM dd, yyyy');
    };

    const isDateInRange = (day: Date) => {
        if (selection.from && selection.to) {
            return isWithinInterval(day, {
                start: selection.from,
                end: selection.to,
            });
        }
        if (selection.from && hoverDate) {
            const start = isBefore(selection.from, hoverDate)
                ? selection.from
                : hoverDate;
            const end = isAfter(selection.from, hoverDate)
                ? selection.from
                : hoverDate;
            return isWithinInterval(day, { start, end });
        }
        return false;
    };

    return (
        <div
            className={cn('relative inline-block text-left z-[100]', className)}
            ref={popoverRef}
        >
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 bg-white border border-slate-200 px-4 h-12 rounded-2xl w-full md:w-auto shadow-sm hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
                <CalendarDays size={16} className="text-indigo-500" />
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-widest whitespace-nowrap">
                    {formatDateDisplay(value.from)}{' '}
                    <span className="text-slate-300 mx-1">—</span>{' '}
                    {formatDateDisplay(value.to)}
                </span>
                <ChevronDown
                    size={14}
                    className={cn(
                        'text-slate-400 transition-transform duration-200 shrink-0',
                        isOpen && 'rotate-180',
                    )}
                />
            </button>

            {isOpen && (
                <div
                    className={cn(
                        'absolute z-[100] top-[calc(100%+8px)] sm:w-[540px] bg-white border border-slate-200 rounded-[24px] shadow-2xl overflow-hidden flex flex-col sm:flex-row animate-in fade-in slide-in-from-top-2 duration-200',
                        alignment === 'right' ? 'right-0' : 'left-0',
                        'w-[calc(100vw-2rem)] max-w-[320px] sm:max-w-none', // Mobile-safe width
                    )}
                >
                    <div className="w-full sm:w-[160px] bg-slate-50/80 border-b sm:border-b-0 sm:border-r border-slate-100 p-3 flex flex-col gap-1 shrink-0">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 py-1 mb-1">
                            Quick Select
                        </span>
                        {presets.map((preset) => (
                            <button
                                key={preset.label}
                                onClick={() => applyPreset(preset.value)}
                                className="w-full text-left px-3 py-2 text-[11px] font-bold text-slate-600 hover:bg-white hover:text-indigo-600 hover:shadow-sm rounded-xl transition-all"
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 p-5 flex flex-col select-none bg-white">
                        <div className="flex items-center justify-between mb-4">
                            <button
                                onClick={() =>
                                    setCurrentMonth(subMonths(currentMonth, 1))
                                }
                                className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-500 transition-colors"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span className="text-sm font-black text-slate-800">
                                {format(currentMonth, 'MMMM yyyy')}
                            </span>
                            <button
                                onClick={() =>
                                    setCurrentMonth(addMonths(currentMonth, 1))
                                }
                                disabled={isAfter(currentMonth, new Date())}
                                className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-500 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>

                        <div className="grid grid-cols-7 mb-2">
                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(
                                (day) => (
                                    <div
                                        key={day}
                                        className="text-center text-[10px] font-black text-slate-400 uppercase tracking-wider py-1"
                                    >
                                        {day}
                                    </div>
                                ),
                            )}
                        </div>

                        <div className="grid grid-cols-7 gap-y-1">
                            {calendarDays.map((day) => {
                                const isCurrentMonth = isSameMonth(
                                    day,
                                    currentMonth,
                                );
                                const isFuture = isAfter(day, new Date());
                                const isStart =
                                    selection.from &&
                                    isSameDay(day, selection.from);
                                const isEnd =
                                    selection.to &&
                                    isSameDay(day, selection.to);
                                const inRange = isDateInRange(day);
                                const isHoveringEnd =
                                    hoverDate && isSameDay(day, hoverDate);

                                return (
                                    <div
                                        key={day.toISOString()}
                                        className="relative flex items-center justify-center h-9"
                                        onMouseEnter={() =>
                                            handleDayMouseEnter(day)
                                        }
                                    >
                                        {inRange && (
                                            <div
                                                className={cn(
                                                    'absolute inset-0 bg-indigo-50',
                                                    isStart &&
                                                        !isEnd &&
                                                        'rounded-l-full',
                                                    isEnd &&
                                                        !isStart &&
                                                        'rounded-r-full',
                                                    isHoveringEnd &&
                                                        !selection.to &&
                                                        isAfter(
                                                            hoverDate,
                                                            selection.from!,
                                                        ) &&
                                                        'rounded-r-full',
                                                    isHoveringEnd &&
                                                        !selection.to &&
                                                        isBefore(
                                                            hoverDate,
                                                            selection.from!,
                                                        ) &&
                                                        'rounded-l-full',
                                                )}
                                            />
                                        )}

                                        <button
                                            onClick={() => handleDayClick(day)}
                                            disabled={isFuture}
                                            className={cn(
                                                'relative z-10 h-8 w-8 flex items-center justify-center rounded-full text-xs font-semibold transition-all',
                                                !isCurrentMonth && 'opacity-30',
                                                isFuture &&
                                                    'opacity-20 cursor-not-allowed',
                                                !isStart &&
                                                    !isEnd &&
                                                    !isFuture &&
                                                    'hover:bg-indigo-100 hover:text-indigo-900',
                                                (isStart || isEnd) &&
                                                    'bg-indigo-600 text-white shadow-md font-black scale-105',
                                                inRange &&
                                                    !isStart &&
                                                    !isEnd &&
                                                    'text-indigo-700 font-bold',
                                            )}
                                        >
                                            {format(day, 'd')}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
