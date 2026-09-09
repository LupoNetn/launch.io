import { Zap } from "lucide-react";
import { GithubIcon } from "@/components/icons/GithubIcon";

export default function Navbar() {
  return (
    <div className="fixed top-0 w-full z-50">
      {/* Navigation Header */}
      <nav className="border-b border-white/[0.06] bg-[#05050A]/80 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.3)]">
              <Zap className="w-4 h-4 text-black fill-black" />
            </div>
            <span className="font-bold tracking-tight text-white text-lg">launch.io</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#workflow" className="hover:text-white transition-colors">Workflow</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#docs" className="hover:text-white transition-colors">Documentation</a>
          </div>

          <div className="flex items-center gap-4">
            <button className="h-9 px-3.5 sm:px-4 rounded-full bg-white text-black text-xs sm:text-sm font-semibold hover:bg-neutral-200 transition-all flex items-center gap-1.5 sm:gap-2 shadow-md shadow-white/10 active:scale-95 whitespace-nowrap">
              <GithubIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span><span className="hidden sm:inline">Continue with </span>GitHub</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Banner beneath Navbar */}
      <div className="w-full bg-gradient-to-r from-indigo-500/10 via-purple-500/15 to-emerald-500/10 border-b border-white/[0.08] bg-[#05050A]/90 backdrop-blur-xl py-2 px-4 text-center text-xs sm:text-sm font-medium text-white/90 flex items-center justify-center gap-2 shadow-sm">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>launch.io coming soon</span>
      </div>
    </div>
  );
}
