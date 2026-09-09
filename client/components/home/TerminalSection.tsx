import { Terminal, CheckCircle2 } from "lucide-react";

export default function TerminalSection() {
  return (
    <section className="px-4 sm:px-6 lg:px-8 pb-32 max-w-5xl mx-auto">
      <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl border border-white/10">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/[0.03]">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
          </div>
          <div className="text-xs font-mono text-white/40 flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-white/30" />
            ~/projects/launch-app
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-[11px] font-mono text-emerald-400/90">Railpack Active</span>
          </div>
        </div>
        
        <div className="p-6 font-mono text-xs sm:text-sm text-white/75 space-y-3 bg-[#07070E]/90 backdrop-blur-md">
          <div className="flex gap-3">
            <span className="text-blue-400">$</span>
            <span className="text-white font-medium">git push origin main</span>
          </div>
          <div className="text-white/40 pl-5">-&gt; Triggering webhook deployment hook for main branch...</div>
          <div className="text-white/40 pl-5">-&gt; Detecting project stack: Next.js 16 + TypeScript</div>
          
          <div className="flex gap-3 pt-2">
            <span className="text-emerald-400">launch.io</span>
            <span className="text-white">Executing railpack build sequence [1.8s]</span>
          </div>
          
          <div className="flex gap-3">
            <span className="text-emerald-400">launch.io</span>
            <span className="text-white">Provisioning TLS certificate &amp; global edge routing... [0.6s]</span>
          </div>
          
          <div className="flex items-center gap-3 pt-3 text-emerald-400 font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Deployment Live across 134 Edge Nodes</span>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-2 border-t border-white/5 text-xs">
            <span className="text-white/40">Production URL:</span>
            <a href="#" className="text-indigo-300 underline decoration-indigo-300/30 underline-offset-4 hover:text-white transition-colors font-medium">
              https://app.launch.io
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
