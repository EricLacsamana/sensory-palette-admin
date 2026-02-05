'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { cn } from '@/lib/utils';

export default function AppContent({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isPublicRoute =
        pathname === '/auth/login' || pathname === '/register';

    // If we are on login/register, show the page without Sidebar or Layout padding
    if (isPublicRoute) {
        return <main className="min-h-screen bg-white">{children}</main>;
    }

    return (
        <div className="flex group/layout">
            {/* Sidebar with z-index to stay on top */}
            <Sidebar />

            {/* Main Content Area */}
            <main
                className={cn(
                    'flex-1 min-h-screen bg-slate-50 transition-all duration-300 ease-in-out',
                    // DEFAULT: Sidebar is 280px wide
                    'pl-[280px]',
                    // COLLAPSED: If an 'aside' with class 'w-[80px]' exists in this group, change padding
                    'group-has-[aside.w-[80px]]:pl-[80px]',
                )}
            >
                {/* Internal container for spacing */}
                <div className="w-full h-full p-4 lg:p-8">{children}</div>
            </main>
        </div>
    );
}
