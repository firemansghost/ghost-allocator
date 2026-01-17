import { GlassCard } from '@/components/GlassCard';
import { buildMetadata } from '@/lib/seo';
import type { Metadata } from 'next';

export const metadata: Metadata = buildMetadata({
  title: 'OKC 457(b) Playbook - Coming Soon - Ghost Allocator',
  description: 'OKC-specific 457(b) implementation guide coming soon.',
  path: '/learn/457/okc',
});

export default function Learn457OKCPage() {
  return (
    <div className="flex justify-center">
      <div className="w-full max-w-4xl space-y-8 pb-10">
        <GlassCard className="p-6 sm:p-7">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            OKC 457(b) Playbook
          </h1>
          <p className="mt-3 text-sm sm:text-base text-zinc-300 leading-relaxed">
            Coming soon: An OKC-specific guide to implementing your 457(b) retirement strategy.
          </p>
        </GlassCard>

        <GlassCard className="p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-zinc-50">What Will Be Covered</h2>
          <ul className="mt-3 space-y-2 text-sm text-zinc-300 leading-relaxed">
            <li>
              <span className="font-semibold text-zinc-200">Voya menu realities:</span> Understanding the actual
              fund options available in the OKC Voya 457 plan and how to map them to your portfolio strategy.
            </li>
            <li>
              <span className="font-semibold text-zinc-200">Schwab sweep reality:</span> How the BrokerageLink
              sweep process works, timing considerations, and practical tips for managing transfers.
            </li>
            <li>
              <span className="font-semibold text-zinc-200">OKC-specific workflow:</span> Step-by-step guidance
              on setting up your contributions, managing your allocation across Voya and Schwab, and optimizing
              for your specific situation as an Oklahoma City firefighter.
            </li>
          </ul>
          <p className="mt-4 text-sm text-zinc-400 italic">
            This guide is being developed based on the actual OKC plan documents and real-world implementation
            experience. Check back soon for the complete playbook.
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
