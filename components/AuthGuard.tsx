'use client';

import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter, usePathname } from 'next/navigation';
import { RootState } from '@/redux/store';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useSelector(
        (state: RootState) => state.auth,
    );
    const router = useRouter();
    const pathname = usePathname();

    const isPublicRoute =
        pathname === '/auth/login' || pathname === '/register';

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated && !isPublicRoute) {
                router.push('/auth/login');
            } else if (isAuthenticated && isPublicRoute) {
                router.push('/dashboard');
            }
        }
    }, [isAuthenticated, isLoading, isPublicRoute, router]);

    // Prevent content flash while checking session
    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-white">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
            </div>
        );
    }

    return <>{children}</>;
}
