import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Ghost Allocator',
  description: 'Build a modern portfolio for a post-60/40 world. Pension-aware portfolio templates for your 457 using Voya core funds and Schwab ETFs.',
  path: '/',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#000000" />
      </head>
      <body className="min-h-screen bg-black text-zinc-100 antialiased">
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1 bg-gradient-to-b from-black via-neutral-950 to-black">
            <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:py-12">
              {children}
            </div>
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
