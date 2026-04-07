import React from 'react';
import { User } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export interface UserAvatarProps {
    src?: string | null;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showStatus?: boolean;
    className?: string; // Allows passing parent hover effects (like group-hover)
    name?: string;
}

export function UserAvatar({
    src,
    size = 'md',
    showStatus = false,
    className,
    name = '',
}: UserAvatarProps) {
    // Map sizes to Tailwind dimensions and border radii
    const sizeStyles = {
        sm: 'h-10 w-10 rounded-xl',
        md: 'h-14 w-14 rounded-2xl',
        lg: 'h-20 w-20 rounded-2xl',
        xl: 'h-24 w-24 rounded-3xl',
    };

    // Keep the fallback icon proportional
    const iconSizes = { sm: 18, md: 24, lg: 32, xl: 40 };

    // Adjust the status dot placement so it perfectly hugs the corners at any size
    const statusStyles = {
        sm: '-top-1 -right-1 h-3 w-3',
        md: '-top-1.5 -right-1.5 h-4 w-4 p-0.5',
        lg: '-top-2 -right-2 h-5 w-5 p-0.5 border-[3px]',
        xl: '-top-2 -right-2 h-6 w-6 p-1 border-[3px]',
    };

    return (
        <div className="relative inline-block">
            <Avatar
                className={cn(
                    sizeStyles[size],
                    'border border-slate-100 bg-slate-50 flex items-center justify-center shadow-sm transition-all duration-500',
                    className,
                )}
            >
                <AvatarImage
                    src={src || undefined}
                    // Force the image tag to inherit the exact same rounded corners
                    className={cn('object-cover', sizeStyles[size])}
                />
                <AvatarFallback
                    className={cn(
                        'bg-transparent hover:text-slate-500 text-indigo-600 flex items-center justify-center w-full h-full transition-colors duration-500',
                        sizeStyles[size],
                    )}
                >
                    {name?.charAt(0) || (
                        <User size={iconSizes[size]} strokeWidth={1.5} />
                    )}
                </AvatarFallback>
            </Avatar>

            {showStatus && (
                <div
                    className={cn(
                        'absolute rounded-full bg-white shadow-sm z-10',
                        statusStyles[size],
                    )}
                >
                    <div className="h-full w-full rounded-full bg-emerald-500 border-2 border-white" />
                </div>
            )}
        </div>
    );
}
