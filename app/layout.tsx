import type { Metadata, Viewport } from 'next'; // 👈 Added Viewport import
import { Inter, Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import StoreProvider from '@/providers/StoreProvider';
import LayoutWrapper from '@/components/LayoutWrapper';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

export const metadata: Metadata = {
    title: 'Student Directory Management',
    description: 'Therapist Caseload Management System',
};

// 👇 1. ADD THIS VIEWPORT EXPORT HERE
export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false, // Prevents the mobile browser from zooming in on fast taps
    viewportFit: 'cover', // Ensures it respects the notch/safe areas on modern phones
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={inter.variable}>
            <body
                className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
            >
                <StoreProvider>
                    <LayoutWrapper>{children}</LayoutWrapper>
                    <Toaster position="top-right" richColors duration={4000} />
                </StoreProvider>
            </body>
        </html>
    );
}
