"use client";

import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { GithubIcon } from "@/components/icons/GithubIcon";

const WORDS = ["deploy", "push", "create"];

export default function HeroSection() {
  const [wordIndex, setWordIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setWordIndex((prev) => (prev + 1) % WORDS.length);
        setFade(true);
      }, 250);
    }, 2400);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="pt-36 sm:pt-44 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto flex flex-col items-center text-center">
      <h1 className="text-3xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-8 text-white max-w-5xl leading-[1.18]">
        Effortlessly{" "}
        <span className="inline-flex items-center px-3 sm:px-5 py-0.5 sm:py-1 my-1 rounded-2xl bg-white/[0.08] border border-white/15 shadow-sm">
          <span
            className={`inline-block min-w-[90px] sm:min-w-[150px] text-center transition-all duration-300 transform bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-300 bg-clip-text text-transparent ${
              fade
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-2"
            }`}
            style={{
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {WORDS[wordIndex]}
          </span>
        </span>{" "}
        full-stack apps to the global edge.
      </h1>
      
      <p className="text-base sm:text-lg md:text-xl text-white/55 max-w-2xl mb-10 font-normal leading-relaxed">
        Connect your repository and launch instantly. Autonomous builds, preview deployments, and zero-downtime edge distribution out of the box.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
        <button className="w-full sm:w-auto h-13 px-8 rounded-full bg-white text-black font-semibold hover:bg-neutral-100 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_35px_rgba(255,255,255,0.22)] flex items-center justify-center gap-3 text-sm sm:text-base">
          <GithubIcon className="w-5 h-5 fill-current" />
          Continue with GitHub
          <ArrowRight className="w-4 h-4 text-neutral-600" />
        </button>
      </div>
    </section>
  );
}
