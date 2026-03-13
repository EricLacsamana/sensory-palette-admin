import os from 'os';
import type { NextConfig } from 'next';

// 1. Get your current dynamic network IP
function getNetworkIp(): string {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        const networkInterface = interfaces[name];
        if (networkInterface) {
            for (const iface of networkInterface) {
                // Look for an IPv4 address that is NOT localhost (127.0.0.1)
                if (iface.family === 'IPv4' && !iface.internal) {
                    return iface.address;
                }
            }
        }
    }
    return '127.0.0.1'; // Fallback
}

const currentIp = getNetworkIp();

const nextConfig: NextConfig = {
    /* config options here */

    // 3. Whitelist the dynamic IP so Next.js doesn't block Strapi images
    images: {
        remotePatterns: [
            {
                protocol: 'http',
                hostname: currentIp,
                port: '1337',
            },
        ],
    },
};

export default nextConfig;
