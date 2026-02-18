'use client';

import React, {
    useState,
    useEffect,
    useSyncExternalStore,
    Suspense,
} from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

import Sidebar from '@/components/Sidebar';
import { cn } from '@/lib/utils';
import { RootState } from '@/redux/store';
import { me } from '@/api/users';
import SessionPlanningModal from './SessionPlanningModal';

// --- SUB-COMPONENT: Modal Manager ---
function ModalManager() {
    const searchParams = useSearchParams();
    const isOpen = searchParams.get('isActivitySessionPlanningOpen') === 'true';
    if (!isOpen) return null;
    return <SessionPlanningModal />;
}

// Hydration Helpers
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
    const queryClient = useQueryClient();
    const searchParams = useSearchParams();
    const modalKey = searchParams.toString();

    // Prevent Hydration Mismatch
    const isMounted = useSyncExternalStore(
        subscribe,
        getSnapshot,
        getServerSnapshot,
    );

    const {
        isAuthenticated,
        token,
        isLoading: isAuthLoading,
    } = useSelector((state: RootState) => state.auth);

    // 1. IDENTITY FETCH: Gated by token to prevent Forbidden errors on mount
    const { data: user, isLoading: isUserLoading } = useQuery({
        queryKey: ['me'],
        queryFn: me,
        // 🔥 THE FIX: Gating by !!token ensures Axios has a token to read
        enabled: isAuthenticated && !!token && !isAuthLoading,
        retry: false, // Prevents the error from looping
    });

    const isStudent = user?.role?.type === 'student';

    // 2. CACHE SYNC: Cleanly invalidate only when the token actually changes
    useEffect(() => {
        if (isAuthenticated && token) {
            queryClient.invalidateQueries({ queryKey: ['me'] });
        }
    }, [isAuthenticated, token, queryClient]);

    const isAuthPage =
        pathname.startsWith('/auth') ||
        pathname === '/login' ||
        pathname === '/register';

    // 3. AUTH REDIRECT LOGIC
    useEffect(() => {
        if (isMounted && !isAuthLoading && !isAuthenticated && !isAuthPage) {
            router.push('/auth/login');
        }
    }, [isMounted, isAuthLoading, isAuthenticated, isAuthPage, router]);

    // Global Loading Barrier
    if (!isMounted || ((isAuthLoading || isUserLoading) && !isAuthPage)) {
        return (
            <div className="h-[100dvh] w-full flex items-center justify-center bg-white">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
        );
    }

    // Public / Auth Layout
    if (isAuthPage || !isAuthenticated) {
        return (
            <main className="h-[100dvh] w-full overflow-y-auto bg-white">
                {children}
            </main>
        );
    }

    return (
        <div className="flex h-[100dvh] w-full overflow-hidden bg-[#F8FAFC]">
            {/* Sidebar logic: Hidden for students */}
            {!isStudent && (
                <Sidebar
                    isCollapsed={isCollapsed}
                    setIsCollapsed={setIsCollapsed}
                />
            )}

            <main
                className={cn(
                    'flex flex-col flex-1 h-full min-w-0 overflow-y-auto transition-all duration-300 relative',
                    isStudent
                        ? 'ml-0'
                        : isCollapsed
                          ? 'md:ml-[72px]'
                          : 'md:ml-[260px]',
                )}
            >
                <div
                    className={cn(
                        'flex flex-col flex-1 w-full h-full max-w-[1600px] mx-auto',
                        isStudent && 'px-0',
                    )}
                >
                    {children}
                </div>
            </main>

            {/* Suspense-wrapped Modal Manager */}
            <Suspense fallback={null} key={modalKey}>
                <ModalManager />
            </Suspense>
        </div>
    );
}
