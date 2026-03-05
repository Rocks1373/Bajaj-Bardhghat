import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
});

const outfit = Outfit({
    subsets: ['latin'],
    variable: '--font-outfit',
});

export const metadata: Metadata = {
    title: 'Hulhas Auto | Authorized Bajaj Showroom',
    description: 'Your trusted Bajaj partner. Explore Pulsar, Dominar, Avenger, Platina, and Chetak Electric. Best prices, easy EMI, exchange offers.',
    keywords: ['Bajaj', 'Hulhas Auto', 'motorcycle', 'scooter', 'Pulsar', 'Dominar', 'Chetak', 'showroom'],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="dark">
            <body className={`${inter.variable} ${outfit.variable} font-sans antialiased pattern-bg`}>
                {children}
            </body>
        </html>
    );
}
