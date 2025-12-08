import QuestionnaireForm from '@/components/QuestionnaireForm';

export default function OnboardingPage() {
  return (
    <div className="flex justify-center pt-4 sm:pt-8">
      <div className="w-full max-w-2xl space-y-5">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Build Your Portfolio</h1>
          <p className="text-sm text-slate-300">
            Answer a few questions about your situation and risk tolerance. We&apos;ll design a modern,
            ETF-based allocation tailored to you.
          </p>
        </header>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm">
          <QuestionnaireForm />
        </div>
      </div>
    </div>
  );
}

