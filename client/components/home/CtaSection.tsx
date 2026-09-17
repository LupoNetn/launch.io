import { Rocket, ArrowRight } from 'lucide-react';
import { GithubIcon } from '@/components/icons/GithubIcon';
import { API_BASE_URL } from '@/lib/api';

export default function CtaSection() {
  return (
    <section className="px-4 py-28 sm:px-6 lg:px-8">
      <div className="glass-panel relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-white/15 p-10 text-center shadow-2xl sm:p-14">
        <div className="pointer-events-none absolute top-0 left-1/2 h-full w-full -translate-x-1/2 bg-gradient-to-b from-white/[0.05] via-transparent to-transparent"></div>
        <Rocket className="mx-auto mb-6 h-12 w-12 text-white opacity-90 drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]" />
        <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
          Start shipping today
        </h2>
        <p className="mx-auto mb-8 max-w-lg text-base text-white/55 sm:text-lg">
          Build, deploy, and scale your web applications on launch.io in
          seconds.
        </p>

        <a
          href={`${API_BASE_URL}/auth/github/login`}
          className="mx-auto flex h-13 items-center justify-center gap-3 rounded-full bg-white px-8 text-sm font-semibold text-black shadow-[0_0_35px_rgba(255,255,255,0.2)] transition-all hover:scale-[1.02] hover:bg-neutral-100 active:scale-[0.98] sm:text-base"
        >
          <GithubIcon className="h-5 w-5" />
          Continue with GitHub
          <ArrowRight className="h-4 w-4 text-neutral-600" />
        </a>
      </div>
    </section>
  );
}
