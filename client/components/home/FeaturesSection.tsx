import { Globe, Cpu, ShieldCheck, Server } from 'lucide-react';

export default function FeaturesSection() {
  return (
    <section
      id="features"
      className="mx-auto max-w-7xl border-t border-white/[0.06] px-4 py-24 sm:px-6 lg:px-8"
    >
      <div className="mx-auto mb-16 max-w-3xl text-center">
        <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl">
          Built for speed, engineered for scale
        </h2>
        <p className="text-base text-white/55 sm:text-lg">
          Everything you need to deliver production applications without
          managing infrastructure.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="glass-panel group flex flex-col justify-between rounded-3xl p-8 transition-all duration-500 hover:border-white/20 md:col-span-2">
          <div>
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 shadow-lg transition-colors group-hover:border-white/20">
              <Globe className="h-6 w-6 text-white" />
            </div>
            <h3 className="mb-3 text-2xl font-bold text-white">
              Global Edge Network
            </h3>
            <p className="max-w-lg leading-relaxed text-white/55">
              Your application is automatically replicated across 134+ global
              points of presence. Traffic routes to the nearest server for
              sub-10ms response times worldwide.
            </p>
          </div>
        </div>

        <div className="glass-panel group flex flex-col justify-between rounded-3xl p-8 transition-all duration-500 hover:border-white/20">
          <div>
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 shadow-lg transition-colors group-hover:border-white/20">
              <Cpu className="h-6 w-6 text-white" />
            </div>
            <h3 className="mb-3 text-2xl font-bold text-white">
              Railpack Builds
            </h3>
            <p className="leading-relaxed text-white/55">
              Reproducible, cached builds powered by Nix containerization.
              Instant cold starts with zero overhead.
            </p>
          </div>
        </div>

        <div className="glass-panel group flex flex-col justify-between rounded-3xl p-8 transition-all duration-500 hover:border-white/20">
          <div>
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 shadow-lg transition-colors group-hover:border-white/20">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <h3 className="mb-3 text-2xl font-bold text-white">
              Automatic SSL &amp; TLS
            </h3>
            <p className="leading-relaxed text-white/55">
              Instant Wildcard TLS certificates generated for custom domains and
              pull request preview environments.
            </p>
          </div>
        </div>

        <div className="glass-panel group flex flex-col justify-between rounded-3xl p-8 transition-all duration-500 hover:border-white/20 md:col-span-2">
          <div>
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 shadow-lg transition-colors group-hover:border-white/20">
              <Server className="h-6 w-6 text-white" />
            </div>
            <h3 className="mb-3 text-2xl font-bold text-white">
              Zero-Downtime Rollbacks
            </h3>
            <p className="max-w-lg leading-relaxed text-white/55">
              Every commit produces an immutable artifact. Revert production
              instant-by-instant with a single click if a release requires
              immediate rollback.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
