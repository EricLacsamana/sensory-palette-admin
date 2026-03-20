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

    // 1. IDENTITY FETCH: Gated by token
    const { data: user, isLoading: isUserLoading } = useQuery({
        queryKey: ['me'],
        queryFn: me,
        enabled: isAuthenticated && !!token && !isAuthLoading,
        retry: false,
    });

    const isStudent = user?.role?.type === 'student';

    // 2. CACHE SYNC
    useEffect(() => {
        if (isAuthenticated && token) {
            queryClient.invalidateQueries({ queryKey: ['me'] });
        }
    }, [isAuthenticated, token, queryClient]);

    // ✨ ROUTE DEFINITIONS ✨
    const isTherapistAuth =
        pathname.startsWith('/auth') ||
        pathname === '/login' ||
        pathname === '/register';
    const isStudentLogin = pathname.includes('student-login');
    const isStudentZone =
        pathname.startsWith('/student-portal') ||
        pathname.startsWith('/activities/play');

    // Should we hide the sidebar? (Yes, for ALL auth pages, ALL student pages, or if the user is a student)
    const isFullScreenRoute =
        isTherapistAuth || isStudentLogin || isStudentZone || isStudent;

    // 3. SMART AUTH REDIRECT LOGIC
    useEffect(() => {
        if (isMounted && !isAuthLoading && !isAuthenticated) {
            if (isStudentZone) {
                // Unauthenticated user trying to access the portal -> Kick to Passcode Screen
                router.push('/auth/student-login');
            } else if (!isTherapistAuth && !isStudentLogin) {
                // Unauthenticated user trying to access Therapist dashboard -> Kick to Admin Login
                router.push('/auth/login');
            }
        }
    }, [
        isMounted,
        isAuthLoading,
        isAuthenticated,
        isTherapistAuth,
        isStudentLogin,
        isStudentZone,
        router,
    ]);

    // Global Loading Barrier
    if (
        !isMounted ||
        ((isAuthLoading || isUserLoading) &&
            !isTherapistAuth &&
            !isStudentLogin)
    ) {
        return (
            <div className="h-[100dvh] w-full flex items-center justify-center bg-white">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
        );
    }

    // --- LAYOUT 1: FULL SCREEN (Auth, Passcode, Student Portal, or Games) ---
    if (isFullScreenRoute) {
        return (
            <main
                className={cn(
                    'h-[100dvh] w-full overflow-y-auto relative',
                    // Give login screens a dark background, portal/games a light background
                    isStudentLogin || isTherapistAuth
                        ? 'bg-slate-950'
                        : 'bg-[#FDFEFE]',
                )}
            >
                {children}
            </main>
        );
    }

    // --- LAYOUT 2: THERAPIST DASHBOARD ---
    return (
        <div className="flex h-[100dvh] w-full overflow-hidden bg-[#F8FAFC]">
            {/* Sidebar only renders for authenticated therapists on dashboard routes */}
            <Sidebar
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
            />

            <main
                className={cn(
                    'flex flex-col flex-1 h-full min-w-0 overflow-y-auto transition-all duration-300 relative',
                    // Using 'pl' (padding) instead of 'ml' (margin) prevents horizontal overflow bugs
                    isCollapsed ? 'pl-[72px]' : 'pl-[260px]',
                )}
            >
                <div className="flex flex-col flex-1 w-full h-full max-w-[1600px] mx-auto">
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
