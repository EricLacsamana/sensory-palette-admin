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

// Modal Manager logic restored
function ModalManager() {
    const searchParams = useSearchParams();
    const isOpen = searchParams.get('isActivitySessionPlanningOpen') === 'true';
    if (!isOpen) return null;
    return <SessionPlanningModal />;
}

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

    const { data: user, isLoading: isUserLoading } = useQuery({
        queryKey: ['me'],
        queryFn: me,
        enabled: isAuthenticated && !!token && !isAuthLoading,
        retry: false,
    });

    const isStudent = user?.role?.type === 'student';

    useEffect(() => {
        if (isAuthenticated && token) {
            queryClient.invalidateQueries({ queryKey: ['me'] });
        }
    }, [isAuthenticated, token, queryClient]);

    const isTherapistAuth =
        pathname.startsWith('/auth') ||
        pathname === '/login' ||
        pathname === '/register';
    const isStudentLogin = pathname.includes('student-login');
    const isStudentZone =
        pathname.startsWith('/student-portal') ||
        pathname.startsWith('/activities/play');

    const isFullScreenRoute =
        isTherapistAuth || isStudentLogin || isStudentZone || isStudent;

    useEffect(() => {
        if (isMounted && !isAuthLoading && !isAuthenticated) {
            if (isStudentZone) {
                router.push('/auth/student-login');
            } else if (!isTherapistAuth && !isStudentLogin) {
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

    // Loading State
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

    // --- FULL SCREEN LAYOUT ---
    if (isFullScreenRoute) {
        return (
            <main
                className={cn(
                    'h-[100dvh] w-full overflow-y-auto relative',
                    isStudentLogin || isTherapistAuth
                        ? 'bg-slate-950'
                        : 'bg-[#FDFEFE]',
                )}
            >
                {children}
            </main>
        );
    }

    // --- DASHBOARD LAYOUT (STABLE) ---
    return (
        <div className="flex h-[100dvh] w-full overflow-hidden bg-[#F8FAFC]">
            <Sidebar
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
            />

            <main
                className={cn(
                    'flex flex-col flex-1 h-full min-w-0 overflow-y-auto transition-all duration-300 relative',
                    isCollapsed ? 'pl-[72px]' : 'pl-[260px]',
                )}
            >
                {/* CRITICAL: Never put a 'key' prop here. 
                   Keeping this container stable allows the Sidebar to stay mounted 
                   and the animation indicator to slide correctly.
                */}
                <div className="flex flex-col flex-1 w-full h-full max-w-[1600px] mx-auto">
                    {children}
                </div>
            </main>

            <Suspense fallback={null}>
                <ModalManager />
            </Suspense>
        </div>
    );
}
