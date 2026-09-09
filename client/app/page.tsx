"use client";

import { useState, useEffect, useRef } from "react";

// ─── Tiny Icon Components ────────────────────────────────────────────────────
function IconRocket({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4.5 16.5c-1.5 1.5-2 5-2 5s3.5-.5 5-2l7-7-3-3-7 7z" />
      <path d="m21.5 2.5-3 3M14 10l-4-4 8-4 4 4-8 4z" />
      <circle cx="16.5" cy="7.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconBolt({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

function IconShield({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2L3 7v5c0 5 3.9 9.7 9 11 5.1-1.3 9-6 9-11V7l-9-5z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function IconGlobe({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" />
    </svg>
  );
}

function IconGit({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.546 10.93L13.067.452a1.55 1.55 0 0 0-2.188 0L8.708 2.627l2.76 2.76a1.838 1.838 0 0 1 2.327 2.342l2.658 2.66a1.838 1.838 0 1 1-1.1 1.059L12.81 9.145v6.479a1.838 1.838 0 1 1-1.512-.046V9.05a1.838 1.838 0 0 1-.997-2.41L7.585 3.935 .45 11.068a1.55 1.55 0 0 0 0 2.187l10.478 10.478a1.55 1.55 0 0 0 2.187 0l10.431-10.431a1.55 1.55 0 0 0 0-2.373z" />
    </svg>
  );
}

function IconArrow({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

// ─── Terminal Demo ────────────────────────────────────────────────────────────
const TERMINAL_LINES = [
  { text: "$ git push origin main", color: "#a0a0b0", delay: 0 },
  { text: "→ Detected: Node.js 22, React 19", color: "#6c47ff", delay: 600 },
  { text: "→ Running railpack build...", color: "#00d4ff", delay: 1200 },
  { text: "  ✓ Dependencies installed (3.2s)", color: "#22c55e", delay: 2000 },
  { text: "  ✓ Build complete (8.4s)", color: "#22c55e", delay: 2800 },
  { text: "→ Deploying to edge network...", color: "#00d4ff", delay: 3600 },
  { text: "  ✓ Promoted to production", color: "#22c55e", delay: 4400 },
  { text: "✦ Live at https://myapp.launch.io", color: "#6c47ff", delay: 5000 },
];

function TerminalDemo() {
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [isRunning, setIsRunning] = useState(false);

  const run = () => {
    if (isRunning) return;
    setIsRunning(true);
    setVisibleLines(0);
    TERMINAL_LINES.forEach((line, i) => {
      setTimeout(() => {
        setVisibleLines(i + 1);
        if (i === TERMINAL_LINES.length - 1) {
          setTimeout(() => setIsRunning(false), 1500);
        }
      }, line.delay);
    });
  };

  useEffect(() => { run(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className="glass glow-border rounded-2xl overflow-hidden cursor-pointer select-none"
      onClick={run}
      title="Click to replay"
    >
      {/* Terminal top bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-white/[0.03]">
        <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
        <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
        <div className="w-3 h-3 rounded-full bg-[#28c840]" />
        <span className="ml-3 text-xs text-white/30 font-mono">launch.io — deploy</span>
        <span className="ml-auto text-xs text-white/20 font-mono">click to replay ↺</span>
      </div>
      {/* Terminal body */}
      <div className="p-5 font-mono text-sm min-h-[240px] space-y-2">
        {TERMINAL_LINES.slice(0, visibleLines).map((line, i) => (
          <div
            key={i}
            className="flex items-start gap-2 animate-slide-up"
            style={{ color: line.color }}
          >
            <span className="whitespace-pre">{line.text}</span>
            {i === visibleLines - 1 && isRunning && (
              <span className="w-2 h-4 bg-[#6c47ff] inline-block ml-1 animate-pulse" />
            )}
          </div>
        ))}
        {visibleLines === 0 && (
          <span className="text-white/20">Click to run demo...</span>
        )}
      </div>
    </div>
  );
}

// ─── Feature Card ─────────────────────────────────────────────────────────────
function FeatureCard({
  icon,
  title,
  description,
  gradient,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="glass rounded-2xl p-6 transition-all duration-300 group relative overflow-hidden"
      style={{
        border: hovered ? "1px solid rgba(108,71,255,0.35)" : "1px solid rgba(255,255,255,0.08)",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hovered
          ? "0 20px 60px rgba(108,71,255,0.15)"
          : "0 0 0 transparent",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Gradient blob on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${gradient}, transparent 70%)`,
        }}
      />
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 relative z-10"
        style={{ background: gradient }}
      >
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2 relative z-10">{title}</h3>
      <p className="text-sm text-white/50 leading-relaxed relative z-10">{description}</p>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="glass rounded-2xl p-6 text-center">
      <div className="text-4xl font-bold shimmer-text mb-1">{value}</div>
      <div className="text-sm text-white/40">{label}</div>
    </div>
  );
}

// ─── Floating Grid Background ─────────────────────────────────────────────────
function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ opacity: 0.04 }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  );
}

// ─── Ticker ───────────────────────────────────────────────────────────────────
const TICKER_ITEMS = [
  "Zero-config deploys", "Auto-scaling", "Edge Network", "Private repos",
  "Instant rollbacks", "Custom domains", "SSL included", "GitHub integration",
  "Preview URLs", "Environment variables", "Build logs", "99.99% uptime",
];

function Ticker() {
  const doubled = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="relative overflow-hidden py-4" style={{ maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)" }}>
      <div className="flex gap-8 animate-ticker whitespace-nowrap">
        {doubled.map((item, i) => (
          <span key={i} className="flex items-center gap-2 text-sm text-white/40 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6c47ff] inline-block" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, []);

  return (
    <main className="noise relative">
      {/* ── Ambient cursor glow ── */}
      <div
        className="fixed pointer-events-none z-0 w-[600px] h-[600px] rounded-full transition-all duration-700 ease-out"
        style={{
          left: mousePos.x - 300,
          top: mousePos.y - 300,
          background: "radial-gradient(circle, rgba(108,71,255,0.08) 0%, transparent 70%)",
        }}
      />

      {/* ═══════════════════════════ NAV ═══════════════════════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-4 glass border-b border-white/[0.06]">
        <a href="#" id="nav-logo" className="flex items-center gap-2 text-xl font-bold tracking-tight">
          <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#6c47ff] to-[#00d4ff] flex items-center justify-center">
            <IconBolt className="w-4 h-4 text-white" />
          </span>
          <span>launch<span className="text-[#6c47ff]">.io</span></span>
        </a>
        <div className="hidden md:flex items-center gap-8 text-sm text-white/60">
          <a href="#features" id="nav-features" className="hover:text-white transition-colors">Features</a>
          <a href="#how-it-works" id="nav-howitworks" className="hover:text-white transition-colors">How it works</a>
          <a href="#pricing" id="nav-pricing" className="hover:text-white transition-colors">Pricing</a>
          <a href="#docs" id="nav-docs" className="hover:text-white transition-colors">Docs</a>
        </div>
        <div className="flex items-center gap-3">
          <button id="nav-login" className="text-sm text-white/60 hover:text-white transition-colors px-4 py-2">
            Sign in
          </button>
          <button
            id="nav-cta"
            className="text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #6c47ff, #00d4ff)",
              boxShadow: "0 0 20px rgba(108,71,255,0.4)",
            }}
          >
            Get started free
          </button>
        </div>
      </nav>

      {/* ═══════════════════════════ HERO ══════════════════════════ */}
      <section
        ref={heroRef}
        id="hero"
        className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16 overflow-hidden"
      >
        <GridBackground />

        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px] opacity-20 animate-float"
          style={{ background: "radial-gradient(circle, #6c47ff, transparent 70%)" }}
        />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full blur-[100px] opacity-15"
          style={{ background: "radial-gradient(circle, #00d4ff, transparent 70%)", animationDelay: "2s" }}
        />

        {/* Badge */}
        <div
          id="hero-badge"
          className="glass glow-border rounded-full px-4 py-1.5 text-xs font-medium text-[#a08fff] mb-8 animate-slide-up flex items-center gap-2"
        >
          <span className="w-2 h-2 rounded-full bg-[#6c47ff] animate-pulse inline-block" />
          Now in public beta — Deploy in seconds
          <span className="ml-1 text-white/30">→</span>
        </div>

        {/* Headline */}
        <h1
          id="hero-headline"
          className="text-center text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-none mb-6 animate-slide-up"
          style={{ animationDelay: "0.1s", opacity: 0 }}
        >
          Deploy at the
          <br />
          <span className="shimmer-text">speed of thought</span>
        </h1>

        {/* Subheading */}
        <p
          id="hero-sub"
          className="text-center text-lg md:text-xl text-white/50 max-w-2xl mb-10 animate-slide-up"
          style={{ animationDelay: "0.2s", opacity: 0 }}
        >
          Push code. We detect your stack, build it, and put it live on a global
          edge network — in under 60 seconds. No Dockerfiles. No YAML.
        </p>

        {/* CTA buttons */}
        <div
          className="flex flex-col sm:flex-row items-center gap-4 animate-slide-up"
          style={{ animationDelay: "0.3s", opacity: 0 }}
        >
          <button
            id="hero-cta-primary"
            className="group flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #6c47ff, #00d4ff)",
              boxShadow: "0 0 30px rgba(108,71,255,0.5)",
            }}
          >
            <IconGit className="w-4 h-4" />
            Connect GitHub &amp; Deploy
            <IconArrow className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            id="hero-cta-secondary"
            className="glass flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm text-white/70 hover:text-white transition-all duration-200 border border-white/10 hover:border-white/20"
          >
            Read the docs
          </button>
        </div>

        {/* Proof line */}
        <p className="mt-6 text-xs text-white/25 animate-fade-in" style={{ animationDelay: "0.6s" }}>
          No credit card required · 3 projects free forever
        </p>

        {/* Terminal */}
        <div className="w-full max-w-2xl mt-16 animate-slide-up" style={{ animationDelay: "0.4s", opacity: 0 }}>
          <TerminalDemo />
        </div>
      </section>

      {/* ═══════════════════════════ TICKER ════════════════════════ */}
      <div className="border-y border-white/[0.06] py-1">
        <Ticker />
      </div>

      {/* ═══════════════════════════ STATS ═════════════════════════ */}
      <section id="stats" className="relative px-6 md:px-12 py-20">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard value="&lt; 60s" label="Avg deploy time" />
          <StatCard value="130+" label="Edge locations" />
          <StatCard value="99.99%" label="Uptime SLA" />
          <StatCard value="50k+" label="Deployments / day" />
        </div>
      </section>

      {/* ═══════════════════════════ FEATURES ══════════════════════ */}
      <section id="features" className="relative px-6 md:px-12 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-mono text-[#6c47ff] uppercase tracking-widest mb-3">Everything included</p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Built for developers
              <br />
              <span className="text-white/30">who ship fast</span>
            </h2>
            <p className="text-white/40 max-w-xl mx-auto">
              Everything from zero-config builds to instant rollbacks — launch.io handles
              the infrastructure so you can focus on the product.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FeatureCard
              icon={<IconBolt className="w-5 h-5 text-white" />}
              title="Instant Deploys"
              description="Push to main and we do the rest. Smart build caching makes subsequent deploys even faster."
              gradient="rgba(108,71,255,0.6)"
            />
            <FeatureCard
              icon={<IconRocket className="w-5 h-5 text-white" />}
              title="Auto-detect Stacks"
              description="Node, Python, Go, Rust, Ruby — launch.io detects your stack automatically and configures the build."
              gradient="rgba(0,212,255,0.5)"
            />
            <FeatureCard
              icon={<IconGlobe className="w-5 h-5 text-white" />}
              title="Global Edge Network"
              description="Your app lives at 130+ PoPs worldwide. Users get served from the nearest location, every time."
              gradient="rgba(34,197,94,0.5)"
            />
            <FeatureCard
              icon={<IconShield className="w-5 h-5 text-white" />}
              title="Zero-config SSL"
              description="Every deploy, every preview URL — HTTPS by default. No certificates to manage, ever."
              gradient="rgba(251,146,60,0.5)"
            />
            <FeatureCard
              icon={<IconGit className="w-5 h-5 text-white" />}
              title="Git-native Workflow"
              description="Every PR gets a unique preview URL. Merge to main, it goes live. Rollback is one click."
              gradient="rgba(244,63,94,0.5)"
            />
            <FeatureCard
              icon={<IconBolt className="w-5 h-5 text-white" />}
              title="Railpack Builds"
              description="Powered by railpack — Nix-based reproducible builds that are fast, secure, and consistent."
              gradient="rgba(168,85,247,0.5)"
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════ HOW IT WORKS ══════════════════ */}
      <section id="how-it-works" className="relative px-6 md:px-12 py-20">
        <GridBackground />
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-mono text-[#00d4ff] uppercase tracking-widest mb-3">How it works</p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Three steps to live</h2>
          </div>

          <div className="relative">
            {/* Connector line */}
            <div
              className="absolute left-8 top-8 bottom-8 w-px hidden md:block"
              style={{ background: "linear-gradient(to bottom, #6c47ff, #00d4ff, #6c47ff)" }}
            />

            <div className="space-y-8">
              {[
                {
                  step: "01",
                  title: "Connect your repo",
                  desc: "Link your GitHub account. We see your repos — pick the one you want to deploy.",
                  color: "#6c47ff",
                },
                {
                  step: "02",
                  title: "We build it",
                  desc: "launch.io detects your stack, installs deps, and runs your build. Live logs, always.",
                  color: "#00d4ff",
                },
                {
                  step: "03",
                  title: "It's live",
                  desc: "Your app is deployed globally. Custom domain ready. Every future push auto-deploys.",
                  color: "#22c55e",
                },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-6 glass rounded-2xl p-6 relative z-10">
                  <div
                    className="shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center font-mono font-bold text-lg"
                    style={{
                      background: `${item.color}22`,
                      border: `1px solid ${item.color}44`,
                      color: item.color,
                    }}
                  >
                    {item.step}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                    <p className="text-white/50 text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════ CTA SECTION ═══════════════════ */}
      <section id="cta" className="relative px-6 md:px-12 py-32 overflow-hidden">
        {/* Radial glow background */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div
            className="w-[800px] h-[400px] rounded-full blur-[100px] opacity-30 animate-pulse-glow"
            style={{ background: "radial-gradient(ellipse, #6c47ff 0%, #00d4ff 50%, transparent 70%)" }}
          />
        </div>

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <p className="text-xs font-mono text-[#6c47ff] uppercase tracking-widest mb-4">Ready?</p>
          <h2 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
            Your first deploy
            <br />
            <span className="shimmer-text">is 60 seconds away</span>
          </h2>
          <p className="text-white/40 mb-10 text-lg">
            Join thousands of developers who ship faster with launch.io.
            No credit card. No infrastructure headaches.
          </p>
          <button
            id="cta-bottom"
            className="group inline-flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #6c47ff, #00d4ff)",
              boxShadow: "0 0 50px rgba(108,71,255,0.5)",
            }}
          >
            <IconGit className="w-5 h-5" />
            Start deploying for free
            <IconArrow className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* ═══════════════════════════ FOOTER ════════════════════════ */}
      <footer className="border-t border-white/[0.06] px-6 md:px-12 py-10">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-lg font-bold">
            <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#6c47ff] to-[#00d4ff] flex items-center justify-center">
              <IconBolt className="w-3.5 h-3.5 text-white" />
            </span>
            launch<span className="text-[#6c47ff]">.io</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-white/30">
            <a href="#" className="hover:text-white/60 transition-colors">Privacy</a>
            <a href="#" className="hover:text-white/60 transition-colors">Terms</a>
            <a href="#" className="hover:text-white/60 transition-colors">Status</a>
            <a href="#" className="hover:text-white/60 transition-colors">GitHub</a>
          </div>
          <p className="text-xs text-white/20">© 2026 launch.io. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
