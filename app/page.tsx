import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Database, ClipboardCheck } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-zinc-800/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logos */}
            <div className="flex items-center gap-8">
              <Image
                src="/logos/valkyrie.png"
                alt="Valkyrie Revival"
                width={180}
                height={60}
                className="h-12 w-auto"
              />
              <div className="h-8 w-px bg-zinc-700" />
              <Image
                src="/logos/prytaneum.png"
                alt="Prytaneum Partners"
                width={180}
                height={60}
                className="h-12 w-auto"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="pt-32">
        {/* Hero Content */}
        <section className="container mx-auto px-6 py-20">
          <div className="max-w-4xl mx-auto text-center">
            {/* Helmet Logo */}
            <div className="mb-8 flex justify-center">
              <Image
                src="/logos/valkyrie.png"
                alt="Valkyrie Helm"
                width={120}
                height={120}
                className="h-24 w-auto opacity-90"
              />
            </div>

            {/* Main Title */}
            <h1 className="text-6xl md:text-7xl font-bold mb-8 tracking-tight">
              VALKYRIE REVIVAL FUND
            </h1>

            {/* Tagline */}
            <p className="text-3xl md:text-4xl font-bold mb-6 text-zinc-300">
              REVIVE. SCALE. THRIVE.
            </p>

            {/* Mission Statement */}
            <p className="text-xl text-zinc-400 max-w-3xl mx-auto mb-12 leading-relaxed">
              Disciplined, hands-on revival of undervalued technology companies through
              operational excellence and strategic value creation.
            </p>
          </div>
        </section>

        {/* Platform Access Cards */}
        <section className="container mx-auto px-6 py-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Platform Access</h2>

            <div className="grid md:grid-cols-2 gap-6">
              {/* CRM Card */}
              <Link
                href="/login"
                className="group relative overflow-hidden bg-zinc-900/50 border border-zinc-800 rounded-lg p-8 hover:border-zinc-700 transition-all duration-300 hover:bg-zinc-900/80"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
                    <Database className="w-6 h-6 text-zinc-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">Investor CRM</h3>
                    <p className="text-zinc-400 text-sm mb-4">
                      Manage fundraising pipeline, track relationships, and drive investor engagement.
                    </p>
                    <div className="flex items-center text-zinc-300 text-sm group-hover:text-white transition-colors">
                      <span className="font-medium">Access Platform</span>
                      <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>

              {/* Assessment Card */}
              <a
                href="https://assessment.valhros.com"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative overflow-hidden bg-zinc-900/50 border border-zinc-800 rounded-lg p-8 hover:border-zinc-700 transition-all duration-300 hover:bg-zinc-900/80"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
                    <ClipboardCheck className="w-6 h-6 text-zinc-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">VALHROS Assessment</h3>
                    <p className="text-zinc-400 text-sm mb-4">
                      Comprehensive strategic assessment and operational analysis platform.
                    </p>
                    <div className="flex items-center text-zinc-300 text-sm group-hover:text-white transition-colors">
                      <span className="font-medium">Launch Assessment</span>
                      <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </a>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="container mx-auto px-6 py-12 mt-20 border-t border-zinc-800">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <Image
                  src="/logos/valkyrie.png"
                  alt="Valkyrie Revival"
                  width={120}
                  height={40}
                  className="h-8 w-auto opacity-60"
                />
                <div className="h-6 w-px bg-zinc-800" />
                <Image
                  src="/logos/prytaneum.png"
                  alt="Prytaneum Partners"
                  width={120}
                  height={40}
                  className="h-8 w-auto opacity-60"
                />
              </div>
              <p className="text-zinc-600 text-sm">
                © {new Date().getFullYear()} Valkyrie Revival Fund. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
