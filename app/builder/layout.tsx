import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Your Ghost Allocation - Ghost Allocator',
  description: 'Your Ghost allocation plan based on your answers. OKC 457 Voya core funds and optional Schwab BrokerageLink ETFs.',
  path: '/builder',
});

export default function BuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}



