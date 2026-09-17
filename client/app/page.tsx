import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/home/HeroSection";
import TerminalSection from "@/components/home/TerminalSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import CtaSection from "@/components/home/CtaSection";
import Footer from "@/components/layout/Footer";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05050A] text-white selection:bg-white/20 selection:text-white">
      <div className="pointer-events-none absolute left-1/2 top-1/4 z-0 h-[400px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-indigo-600/15 via-blue-500/10 to-purple-600/15 blur-[140px]" />
      <div className="pointer-events-none absolute right-10 top-3/4 z-0 h-[300px] w-[500px] rounded-full bg-emerald-500/5 blur-[150px]" />
      <div className="pointer-events-none absolute inset-0 z-0 bg-grid-pattern opacity-[0.12]" />
      <Navbar />
      <main className="relative z-10">
        <HeroSection />
        <TerminalSection />
        <FeaturesSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
