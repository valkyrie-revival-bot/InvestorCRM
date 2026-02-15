import Link from 'next/link';
import { ArrowRight, Database, ClipboardCheck } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-zinc-900 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl font-bold">
                <span className="text-white">VALHROS</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-zinc-300 to-zinc-500 bg-clip-text text-transparent">
            VALKYRIE REVIVAL
          </h1>
          <p className="text-xl text-zinc-400 mb-4">
            REVIVE. SCALE. THRIVE.
          </p>
          <p className="text-lg text-zinc-500 max-w-2xl mx-auto">
            Enterprise-grade tools for investor relations and strategic assessment
          </p>
        </div>

        {/* Module Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* CRM Card */}
          <Link
            href="/login"
            className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-black p-8 hover:border-brand-primary/50 transition-all duration-300 hover:scale-[1.02]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center mb-6">
                <Database className="w-6 h-6 text-brand-primary" />
              </div>

              <h2 className="text-2xl font-bold mb-3">Investor CRM</h2>
              <p className="text-zinc-400 mb-6">
                Manage fundraising pipeline, track relationships, and drive investor engagement with AI-powered insights.
              </p>

              <div className="flex items-center text-brand-primary group-hover:gap-2 transition-all">
                <span className="font-medium">Access CRM</span>
                <ArrowRight className="w-5 h-5 ml-1" />
              </div>
            </div>
          </Link>

          {/* Assessment Card */}
          <a
            href="https://assessment.valhros.com"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-black p-8 hover:border-brand-gold/50 transition-all duration-300 hover:scale-[1.02]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-brand-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-brand-gold/10 flex items-center justify-center mb-6">
                <ClipboardCheck className="w-6 h-6 text-brand-gold" />
              </div>

              <h2 className="text-2xl font-bold mb-3">VALHROS Assessment</h2>
              <p className="text-zinc-400 mb-6">
                Comprehensive strategic assessment and operational analysis platform for portfolio companies.
              </p>

              <div className="flex items-center text-brand-gold group-hover:gap-2 transition-all">
                <span className="font-medium">Launch Assessment</span>
                <ArrowRight className="w-5 h-5 ml-1" />
              </div>
            </div>
          </a>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-16 text-zinc-600 text-sm">
          <p>Prytaneum Partners × Valkyrie Revival</p>
        </div>
      </main>
    </div>
  );
}
