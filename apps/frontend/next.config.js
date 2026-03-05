/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            { protocol: 'http', hostname: 'localhost', port: '4000' },
            { protocol: 'http', hostname: 'backend', port: '4000' },
            { protocol: 'https', hostname: 'images.unsplash.com' },
            { protocol: 'https', hostname: '**.bajajauto.com' },
            { protocol: 'https', hostname: '**.bajaj-auto.com' },
        ],
        unoptimized: true,
    },
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/:path*`,
            },
        ];
    },
};

module.exports = nextConfig;
