import QuestionnaireForm from '@/components/QuestionnaireForm';
import { GlassCard } from '@/components/GlassCard';

export default function OnboardingPage() {
  return (
    <div className="flex justify-center pt-4 sm:pt-8">
      <div className="w-full max-w-2xl space-y-5">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Build Your Portfolio</h1>
          <p className="text-sm text-zinc-300">
            Answer a few questions about your situation and risk tolerance. We&apos;ll design a modern,
            ETF-based allocation tailored to you.
          </p>
        </header>
        <GlassCard className="p-6 sm:p-7">
          <QuestionnaireForm />
        </GlassCard>
      </div>
    </div>
  );
}

