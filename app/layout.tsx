import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  metadataBase: new URL('https://openbracket.io'),
  title: 'OpenBracket — A small but mighty web studio',
  description: 'Independent web design and development in Dallas/Fort Worth. Strategy, thoughtful design, and high-performance websites built to grow your business.',
  alternates: { canonical: '/' },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><a className="skip" href="#main">Skip to content</a>{children}</body></html>;
}
