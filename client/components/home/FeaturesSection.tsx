import { Globe, Cpu, ShieldCheck, Server } from "lucide-react";

export default function FeaturesSection() {
  return (
    <section id="features" className="px-4 sm:px-6 lg:px-8 py-24 max-w-7xl mx-auto border-t border-white/[0.06]">
      <div className="mb-16 text-center max-w-3xl mx-auto">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-white">Built for speed, engineered for scale</h2>
        <p className="text-white/55 text-base sm:text-lg">Everything you need to deliver production applications without managing infrastructure.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-8 rounded-3xl md:col-span-2 flex flex-col justify-between group hover:border-white/20 transition-all duration-500">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6 border border-white/10 group-hover:border-white/20 transition-colors shadow-lg">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-white">Global Edge Network</h3>
            <p className="text-white/55 leading-relaxed max-w-lg">Your application is automatically replicated across 134+ global points of presence. Traffic routes to the nearest server for sub-10ms response times worldwide.</p>
          </div>
        </div>

        <div className="glass-panel p-8 rounded-3xl flex flex-col justify-between group hover:border-white/20 transition-all duration-500">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6 border border-white/10 group-hover:border-white/20 transition-colors shadow-lg">
              <Cpu className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-white">Railpack Builds</h3>
            <p className="text-white/55 leading-relaxed">Reproducible, cached builds powered by Nix containerization. Instant cold starts with zero overhead.</p>
          </div>
        </div>

        <div className="glass-panel p-8 rounded-3xl flex flex-col justify-between group hover:border-white/20 transition-all duration-500">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6 border border-white/10 group-hover:border-white/20 transition-colors shadow-lg">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-white">Automatic SSL &amp; TLS</h3>
            <p className="text-white/55 leading-relaxed">Instant Wildcard TLS certificates generated for custom domains and pull request preview environments.</p>
          </div>
        </div>

        <div className="glass-panel p-8 rounded-3xl md:col-span-2 flex flex-col justify-between group hover:border-white/20 transition-all duration-500">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6 border border-white/10 group-hover:border-white/20 transition-colors shadow-lg">
              <Server className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-white">Zero-Downtime Rollbacks</h3>
            <p className="text-white/55 leading-relaxed max-w-lg">Every commit produces an immutable artifact. Revert production instant-by-instant with a single click if a release requires immediate rollback.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
