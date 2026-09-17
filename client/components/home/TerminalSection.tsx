import { Terminal, CheckCircle2 } from 'lucide-react';

export default function TerminalSection() {
  return (
    <section className="mx-auto max-w-5xl px-4 pb-32 sm:px-6 lg:px-8">
      <div className="glass-panel overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500/80"></div>
            <div className="h-3 w-3 rounded-full bg-yellow-500/80"></div>
            <div className="h-3 w-3 rounded-full bg-green-500/80"></div>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs text-white/40">
            <Terminal className="h-3.5 w-3.5 text-white/30" />
            ~/projects/launch-app
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            <span className="font-mono text-[11px] text-emerald-400/90">
              Railpack Active
            </span>
          </div>
        </div>

        <div className="space-y-3 bg-[#07070E]/90 p-6 font-mono text-xs text-white/75 backdrop-blur-md sm:text-sm">
          <div className="flex gap-3">
            <span className="text-blue-400">$</span>
            <span className="font-medium text-white">git push origin main</span>
          </div>
          <div className="pl-5 text-white/40">
            -&gt; Triggering webhook deployment hook for main branch...
          </div>
          <div className="pl-5 text-white/40">
            -&gt; Detecting project stack: Next.js 16 + TypeScript
          </div>

          <div className="flex gap-3 pt-2">
            <span className="text-emerald-400">launch.io</span>
            <span className="text-white">
              Executing railpack build sequence [1.8s]
            </span>
          </div>

          <div className="flex gap-3">
            <span className="text-emerald-400">launch.io</span>
            <span className="text-white">
              Provisioning TLS certificate &amp; global edge routing... [0.6s]
            </span>
          </div>

          <div className="flex items-center gap-3 pt-3 font-semibold text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            <span>Deployment Live across 134 Edge Nodes</span>
          </div>

          <div className="flex flex-col gap-2 border-t border-white/5 pt-2 text-xs sm:flex-row sm:items-center">
            <span className="text-white/40">Production URL:</span>
            <a
              href="#"
              className="font-medium text-indigo-300 underline decoration-indigo-300/30 underline-offset-4 transition-colors hover:text-white"
            >
              https://app.launch.io
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
