import type { Metadata } from 'next';
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
