import { Disclaimer } from './Disclaimer';

export function Footer() {
  return (
    <footer className="border-t border-amber-50/10 bg-black/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 text-xs text-zinc-400">
        <Disclaimer />
        <p>Part of the GrayGhost Labs ecosystem.</p>
      </div>
    </footer>
  );
}

