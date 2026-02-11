'use client';

import React, {
    useState,
    useEffect,
    useSyncExternalStore,
    Suspense,
} from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import Sidebar from '@/components/Sidebar';
import { cn } from '@/lib/utils';
import { RootState } from '@/redux/store';
import SessionPlanningModal from './SessionPlanningModal';

/**
 * We move the searchParams logic into a wrapper with a KEY.
 * This ensures React re-renders this specific component when the URL changes.
 */
function ModalManager() {
    const searchParams = useSearchParams();
    const isOpen = searchParams.get('isActivitySessionPlanningOpen') === 'true';

    if (!isOpen) return null;

    return <SessionPlanningModal />;
}

// Subscription helpers for useSyncExternalStore
const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export default function LayoutWrapper({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    // We need searchParams here ONLY to provide a key to the Suspense/ModalManager
    const searchParams = useSearchParams();
    const modalKey = searchParams.toString();

    const isMounted = useSyncExternalStore(
        subscribe,
        getSnapshot,
        getServerSnapshot,
    );

    const { isAuthenticated, isLoading } = useSelector(
        (state: RootState) => state.auth,
    );

    const isAuthPage =
        pathname.startsWith('/auth') ||
        pathname === '/login' ||
        pathname === '/register';

    useEffect(() => {
        if (isMounted && !isLoading && !isAuthenticated && !isAuthPage) {
            router.push('/auth/login');
        }
    }, [isMounted, isLoading, isAuthenticated, isAuthPage, router]);

    if (!isMounted || (isLoading && !isAuthPage)) {
        return <div className="min-h-screen bg-white" />;
    }

    if (isAuthPage || !isAuthenticated) {
        return <main className="min-h-screen bg-white">{children}</main>;
    }

    return (
        <div className="flex min-h-screen bg-[#F8FAFC]">
            <Sidebar
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
            />

            <main
                className={cn(
                    'flex-1 transition-all duration-300',
                    isCollapsed ? 'md:ml-[80px]' : 'md:ml-[280px]',
                )}
            >
                <div className="p-6 lg:p-10 max-w-[1600px] mx-auto w-full">
                    {children}
                </div>
            </main>

            {/* 1. Added key={modalKey}: Forces a refresh when any param changes.
                2. Put Suspense here to satisfy Next.js requirements.
            */}
            <Suspense fallback={null} key={modalKey}>
                <ModalManager />
            </Suspense>
        </div>
    );
}
