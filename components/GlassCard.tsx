import { ReactNode } from 'react';

type GlassCardProps = {
  children: ReactNode;
  className?: string;
};

const base =
  'rounded-2xl border border-amber-50/15 bg-neutral-900/60 backdrop-blur-xl shadow-[0_18px_45px_rgba(0,0,0,0.85)]';

export function GlassCard({ children, className }: GlassCardProps) {
  return <div className={`${base} ${className ?? ''}`}>{children}</div>;
}

