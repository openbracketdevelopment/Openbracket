import type { Metadata } from 'next';
import Header from '../components/header';
import Footer from '../components/footer';
import { site } from '../data/site';
import './globals.css';
export const metadata: Metadata = {
 metadataBase: new URL(site.url),
 title: { default: 'OpenBracket — Websites & applications, thoughtfully built', template: '%s | OpenBracket' },
 description: 'A small Dallas–Fort Worth development studio building thoughtful websites and useful custom applications for businesses.',
 openGraph: { type: 'website', siteName: site.name, title: 'OpenBracket — Small studio. Open possibilities.', description: 'Thoughtful websites and useful applications from an independent Dallas–Fort Worth studio.', images: ['/opengraph-image'] },
 twitter: { card: 'summary_large_image' },
};
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="en"><body><a className="skip" href="#main">Skip to content</a><Header />{children}<Footer /></body></html>; }
