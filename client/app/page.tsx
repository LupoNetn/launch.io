import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/home/HeroSection";
import TerminalSection from "@/components/home/TerminalSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import CtaSection from "@/components/home/CtaSection";
import Footer from "@/components/layout/Footer";

export default function Home() {
  return (
    <div className="relative min-h-screen selection:bg-white/20 selection:text-white overflow-hidden bg-[#05050A]">
      {/* Dynamic ambient radial glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-indigo-600/15 via-blue-500/10 to-purple-600/15 rounded-full blur-[140px] pointer-events-none -z-10"></div>
      <div className="absolute top-3/4 right-10 w-[500px] h-[300px] bg-emerald-500/5 rounded-full blur-[150px] pointer-events-none -z-10"></div>

      {/* Grid pattern background */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-grid-pattern opacity-[0.12]"></div>
      
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
