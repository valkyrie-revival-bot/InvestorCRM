'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Database, ClipboardCheck, Shield, Target } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Ambient Background Grid */}
      <div className="fixed inset-0 opacity-[0.015] pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px'
        }} />
      </div>

      {/* Vignette Effect */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black opacity-60" />
      </div>

      {/* Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-black/95 backdrop-blur-md border-b border-zinc-800 shadow-2xl shadow-black/50'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="container mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logos */}
            <div className="flex items-center gap-6 lg:gap-10">
              <a
                href="https://www.valkyrie-revival.com"
                target="_blank"
                rel="noopener noreferrer"
                className="relative group"
              >
                <div className="absolute inset-0 bg-white/5 rounded-lg blur-xl scale-0 group-hover:scale-100 transition-transform duration-300" />
                <Image
                  src="/logos/valkyrie.png"
                  alt="Valkyrie Revival"
                  width={180}
                  height={60}
                  className="h-11 w-auto relative z-10 transition-all duration-300 group-hover:brightness-110"
                />
              </a>

              <div className="relative h-10">
                <div className="absolute inset-y-0 left-1/2 w-px bg-gradient-to-b from-transparent via-zinc-700 to-transparent" />
              </div>

              <a
                href="https://www.prytaneumpartners.com"
                target="_blank"
                rel="noopener noreferrer"
                className="relative group"
              >
                <div className="absolute inset-0 bg-white/5 rounded-lg blur-xl scale-0 group-hover:scale-100 transition-transform duration-300" />
                <Image
                  src="/logos/prytaneum.png"
                  alt="Prytaneum Partners"
                  width={180}
                  height={60}
                  className="h-11 w-auto relative z-10 transition-all duration-300 group-hover:brightness-110"
                />
              </a>
            </div>

            {/* Status Indicator */}
            <div
              className={`flex items-center gap-2 text-xs font-mono tracking-wider transition-all duration-500 ${
                mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
              }`}
              style={{ animationDelay: '600ms' }}
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-zinc-500 uppercase">System Online</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative">
        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center px-6 lg:px-8 pt-20">
          <div className="max-w-5xl mx-auto text-center">

            {/* Helmet Logo with Glow */}
            <div
              className={`mb-12 flex justify-center transition-all duration-1000 ${
                mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-white/10 rounded-full blur-3xl scale-150" />
                <Image
                  src="/logos/valkyrie.png"
                  alt="Valkyrie Helm"
                  width={140}
                  height={140}
                  className="h-28 w-auto relative z-10 drop-shadow-2xl"
                />
              </div>
            </div>

            {/* Main Title - Staggered Animation */}
            <div className="mb-10">
              <h1
                className={`text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-none mb-4 transition-all duration-1000 ${
                  mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{
                  animationDelay: '200ms',
                  fontFamily: 'var(--font-heading)',
                  letterSpacing: '-0.05em'
                }}
              >
                VALKYRIE
              </h1>
              <h2
                className={`text-5xl md:text-6xl lg:text-7xl font-light tracking-wide text-zinc-400 transition-all duration-1000 ${
                  mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{
                  animationDelay: '400ms',
                  letterSpacing: '0.15em'
                }}
              >
                COMMAND CENTER
              </h2>
            </div>

            {/* Tagline with underline accent */}
            <div
              className={`relative inline-block mb-8 transition-all duration-1000 ${
                mounted ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ animationDelay: '600ms' }}
            >
              <p className="text-3xl md:text-4xl font-bold tracking-widest text-zinc-300">
                REVIVE. SCALE. THRIVE.
              </p>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-0.5 bg-gradient-to-r from-transparent via-zinc-500 to-transparent" />
            </div>

            {/* Mission Statement */}
            <p
              className={`text-lg md:text-xl text-zinc-400 max-w-3xl mx-auto leading-relaxed transition-all duration-1000 ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{
                animationDelay: '800ms',
                lineHeight: '1.8'
              }}
            >
              Disciplined, hands-on revival of undervalued technology companies through
              operational excellence and strategic value creation.
            </p>

            {/* Tactical Metrics Bar */}
            <div
              className={`mt-16 flex flex-wrap items-center justify-center gap-8 md:gap-12 transition-all duration-1000 ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ animationDelay: '1000ms' }}
            >
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-zinc-600" />
                <div className="text-left">
                  <div className="text-xs font-mono text-zinc-600 uppercase tracking-wider">Security</div>
                  <div className="text-sm font-semibold">Enterprise Grade</div>
                </div>
              </div>
              <div className="h-8 w-px bg-zinc-800" />
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-zinc-600" />
                <div className="text-left">
                  <div className="text-xs font-mono text-zinc-600 uppercase tracking-wider">Precision</div>
                  <div className="text-sm font-semibold">Operator-First</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Platform Access Section */}
        <section className="container mx-auto px-6 lg:px-8 py-24">
          <div className="max-w-5xl mx-auto">

            {/* Section Header */}
            <div className="text-center mb-16">
              <div className="inline-block mb-4">
                <div className="text-xs font-mono tracking-widest text-zinc-600 uppercase mb-2">Access Points</div>
                <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                Platform Systems
              </h2>
            </div>

            {/* Platform Cards */}
            <div className="grid md:grid-cols-2 gap-6 lg:gap-8">

              {/* CRM Card */}
              <Link
                href="/login"
                className="group relative overflow-hidden bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-8 lg:p-10 hover:border-zinc-700 transition-all duration-500 hover:shadow-2xl hover:shadow-zinc-900/50 hover:-translate-y-1"
              >
                {/* Hover Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/0 via-zinc-800/0 to-zinc-800/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Corner Accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-zinc-800/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-zinc-700/30 transition-colors duration-500" />

                <div className="relative flex flex-col h-full">
                  <div className="flex items-start gap-5 mb-6">
                    <div className="w-14 h-14 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0 group-hover:border-zinc-700 group-hover:bg-zinc-800 transition-all duration-300">
                      <Database className="w-7 h-7 text-zinc-400 group-hover:text-zinc-300 transition-colors" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-2 group-hover:text-white transition-colors">
                        Investor CRM
                      </h3>
                      <div className="text-xs font-mono text-zinc-600 uppercase tracking-wider">
                        System Alpha
                      </div>
                    </div>
                  </div>

                  <p className="text-zinc-400 leading-relaxed mb-8 flex-grow">
                    Manage fundraising pipeline, track relationships, and drive investor engagement with AI-powered insights and real-time collaboration.
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-zinc-800/50">
                    <div className="flex items-center gap-2 text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">
                      <span>Access Platform</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-300" />
                    </div>
                    <div className="text-xs font-mono text-zinc-600">→ /login</div>
                  </div>
                </div>
              </Link>

              {/* Assessment Card */}
              <a
                href="https://assessment.valhros.com"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative overflow-hidden bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-8 lg:p-10 hover:border-zinc-700 transition-all duration-500 hover:shadow-2xl hover:shadow-zinc-900/50 hover:-translate-y-1"
              >
                {/* Hover Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/0 via-zinc-800/0 to-zinc-800/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Corner Accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-zinc-800/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-zinc-700/30 transition-colors duration-500" />

                <div className="relative flex flex-col h-full">
                  <div className="flex items-start gap-5 mb-6">
                    <div className="w-14 h-14 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0 group-hover:border-zinc-700 group-hover:bg-zinc-800 transition-all duration-300">
                      <ClipboardCheck className="w-7 h-7 text-zinc-400 group-hover:text-zinc-300 transition-colors" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-2 group-hover:text-white transition-colors">
                        VALHROS Assessment
                      </h3>
                      <div className="text-xs font-mono text-zinc-600 uppercase tracking-wider">
                        System Omega
                      </div>
                    </div>
                  </div>

                  <p className="text-zinc-400 leading-relaxed mb-8 flex-grow">
                    Comprehensive strategic assessment and operational analysis platform for portfolio company evaluation and value creation planning.
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-zinc-800/50">
                    <div className="flex items-center gap-2 text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">
                      <span>Launch System</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-300" />
                    </div>
                    <div className="text-xs font-mono text-zinc-600">↗ External</div>
                  </div>
                </div>
              </a>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="relative border-t border-zinc-900 mt-32">
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />

          <div className="container mx-auto px-6 lg:px-8 py-16">
            <div className="max-w-5xl mx-auto">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-8">

                {/* Logos */}
                <div className="flex items-center gap-8">
                  <Image
                    src="/logos/valkyrie.png"
                    alt="Valkyrie Revival"
                    width={120}
                    height={40}
                    className="h-8 w-auto opacity-40 hover:opacity-60 transition-opacity"
                  />
                  <div className="h-8 w-px bg-zinc-900" />
                  <Image
                    src="/logos/prytaneum.png"
                    alt="Prytaneum Partners"
                    width={120}
                    height={40}
                    className="h-8 w-auto opacity-40 hover:opacity-60 transition-opacity"
                  />
                </div>

                {/* Legal */}
                <div className="text-center lg:text-right">
                  <p className="text-sm text-zinc-600 mb-1">
                    © {new Date().getFullYear()} Prytaneum Partners. All rights reserved.
                  </p>
                  <p className="text-xs font-mono text-zinc-700 tracking-wider">
                    PATENTS PENDING
                  </p>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
