'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux'; // Add this
import Sidebar from '@/components/Sidebar';
import { cn } from '@/lib/utils';
import { RootState } from '@/redux/store'; // Adjust path to your store
import SessionPlanningModal from './SessionPlanningModal';
import { ActivityEntry } from '@/types/actitivity';

export default function LayoutWrapper({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    // 1. Get auth state from Redux
    const { isAuthenticated, isLoading } = useSelector(
        (state: RootState) => state.auth,
    );

    // 2. Identify Auth Pages
    const isAuthPage =
        pathname.startsWith('/auth') ||
        pathname === '/login' ||
        pathname === '/register';

    // 3. Optional: Redirect to login if not authenticated and not on an auth page
    useEffect(() => {
        if (!isLoading && !isAuthenticated && !isAuthPage) {
            router.push('/auth/login');
        }
    }, [isAuthenticated, isLoading, isAuthPage, router]);

    // If it's an auth page or user isn't authenticated yet, don't show Sidebar
    if (isAuthPage || !isAuthenticated) {
        return <main className="min-h-screen bg-white">{children}</main>;
    }

    return (
        <div className="flex min-h-screen bg-[#F8FAFC] selection:bg-indigo-100">
            {/* Sidebar only renders if isAuthenticated is true */}
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
                <div className="p-6 lg:p-10 max-w-[1600px] mx-auto w-full">
                    {children}
                </div>
            </main>
            <SessionPlanningModal
                onConfirm={function (data: {
                    activitSessionItem: ActivityEntry[];
                }): void {
                    throw new Error('Function not implemented.');
                }}
            />
        </div>
    );
}
