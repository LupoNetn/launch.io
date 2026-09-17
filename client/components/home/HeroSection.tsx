'use client';

import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { GithubIcon } from '@/components/icons/GithubIcon';
import { API_BASE_URL } from '@/lib/api';

const WORDS = ['deploy', 'push', 'create'];

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
    <section className="mx-auto flex max-w-6xl flex-col items-center px-4 pt-36 pb-16 text-center sm:px-6 sm:pt-44 sm:pb-24 lg:px-8">
      <h1 className="mb-8 max-w-5xl text-3xl leading-[1.18] font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">
        Effortlessly{' '}
        <span className="my-1 inline-flex items-center rounded-2xl border border-white/15 bg-white/[0.08] px-3 py-0.5 shadow-sm sm:px-5 sm:py-1">
          <span
            className={`inline-block min-w-[90px] transform bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-300 bg-clip-text text-center text-transparent transition-all duration-300 sm:min-w-[150px] ${
              fade ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
            }`}
            style={{
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {WORDS[wordIndex]}
          </span>
        </span>{' '}
        full-stack apps to the global edge.
      </h1>

      <p className="mb-10 max-w-2xl text-base leading-relaxed font-normal text-white/55 sm:text-lg md:text-xl">
        Connect your repository and launch instantly. Autonomous builds, preview
        deployments, and zero-downtime edge distribution out of the box.
      </p>

      <div className="flex w-full flex-col items-center justify-center gap-4 sm:flex-row">
        <a
          href={`${API_BASE_URL}/auth/github/login`}
          className="flex h-13 w-full items-center justify-center gap-3 rounded-full bg-white px-8 text-sm font-semibold text-black shadow-[0_0_35px_rgba(255,255,255,0.22)] transition-all hover:scale-[1.02] hover:bg-neutral-100 active:scale-[0.98] sm:w-auto sm:text-base"
        >
          <GithubIcon className="h-5 w-5 fill-current" />
          Continue with GitHub
          <ArrowRight className="h-4 w-4 text-neutral-600" />
        </a>
      </div>
    </section>
  );
}
