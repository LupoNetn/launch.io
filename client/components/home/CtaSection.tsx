import { Rocket, ArrowRight } from "lucide-react";
import { GithubIcon } from "@/components/icons/GithubIcon";

export default function CtaSection() {
  return (
    <section className="py-28 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto glass-panel rounded-3xl p-10 sm:p-14 text-center border border-white/15 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-white/[0.05] via-transparent to-transparent pointer-events-none"></div>
        <Rocket className="w-12 h-12 text-white mx-auto mb-6 opacity-90 drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]" />
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4 text-white">Start shipping today</h2>
        <p className="text-base sm:text-lg text-white/55 mb-8 max-w-lg mx-auto">Build, deploy, and scale your web applications on launch.io in seconds.</p>
        
        <button className="h-13 px-8 rounded-full bg-white text-black font-semibold hover:bg-neutral-100 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_35px_rgba(255,255,255,0.2)] flex items-center justify-center gap-3 mx-auto text-sm sm:text-base">
          <GithubIcon className="w-5 h-5" />
          Continue with GitHub
          <ArrowRight className="w-4 h-4 text-neutral-600" />
        </button>
      </div>
    </section>
  );
}
