'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { cn } from '@/lib/utils';

export default function LayoutWrapper({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const pathname = usePathname();

    // Remove sidebar and layout spacing for Auth pages
    const isAuthPage = pathname === '/login' || pathname === '/register';

    if (isAuthPage) {
        return <main className="min-h-screen bg-white">{children}</main>;
    }

    return (
        <div className="flex min-h-screen bg-[#F8FAFC] selection:bg-indigo-100">
            {/* Sidebar receives state as props to sync with Main */}
            <Sidebar
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
            />

            <main
                className={cn(
                    'flex-1 transition-all duration-300 ease-in-out',
                    isCollapsed ? 'ml-[80px]' : 'ml-[280px]',
                )}
            >
                {/* Standardized Padding & Max-Width for readability */}
                <div className="p-6 lg:p-10 max-w-[1600px] mx-auto w-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
