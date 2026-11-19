import React from 'react';
import { ArrowRight } from 'lucide-react';
import ProfilePhoto from './ProfilePhoto';

interface HeroSectionProps {
  onBookConsultation: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onBookConsultation,
}) => {
  return (
    <section
      id="top"
      className="scroll-mt-20 relative z-10 border-b border-[#C8A253]/15 pt-10 pb-14 sm:pt-14 sm:pb-20"
    >
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7 space-y-6">
            <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#DFC585]">
              Technology · Operations · Analytics
            </p>

            <h1 className="font-display text-3xl font-semibold leading-[1.1] text-[#F5F2EB] sm:text-5xl text-balance max-w-2xl">
              Executive operations, technical support, and analytics built for clarity.
            </h1>

            <p className="max-w-[58ch] text-base leading-relaxed text-[#C2D0D6] sm:text-lg">
              I help individuals, startups, small businesses, and enterprise teams build reliable
              support workflows, decision-ready KPI reporting, disciplined account governance, and
              custom web systems.
            </p>

            <div className="flex flex-wrap items-center gap-5 pt-1">
              <button
                type="button"
                onClick={onBookConsultation}
                className="inline-flex min-h-[46px] items-center gap-2 rounded-lg bg-[#C8A253] px-6 py-3 text-sm font-semibold text-[#06141E] whitespace-nowrap transition-colors duration-150 hover:bg-[#DFC585] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5F2EB] focus-visible:ring-offset-2 focus-visible:ring-offset-[#06141E]"
              >
                <span>Book Consultation</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>

              <a
                href="#services"
                className="inline-flex min-h-[46px] items-center rounded-lg border border-[#C8A253]/30 bg-[#0A202B]/80 px-5 py-3 text-sm font-medium text-[#F5F2EB] whitespace-nowrap transition-colors duration-150 hover:border-[#C8A253]/60 hover:text-[#DFC585] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A253]"
              >
                Explore Services
              </a>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-5 border-t border-[#C8A253]/15 pt-6 sm:grid-cols-3">
              <div>
                <p className="font-mono text-xs tabular-nums text-[#DFC585]">06</p>
                <p className="mt-1 text-sm font-medium text-[#F5F2EB]">Core Disciplines</p>
                <p className="mt-0.5 text-xs text-[#C2D0D6]">
                  Support, service, analytics, ops, accounts & web
                </p>
              </div>
              <div>
                <p className="font-mono text-xs tabular-nums text-[#DFC585]">04</p>
                <p className="mt-1 text-sm font-medium text-[#F5F2EB]">Client Tiers</p>
                <p className="mt-0.5 text-xs text-[#C2D0D6]">
                  Individuals, startups, SMBs & enterprise teams
                </p>
              </div>
              <div>
                <p className="font-mono text-xs tabular-nums text-[#DFC585]">24h</p>
                <p className="mt-1 text-sm font-medium text-[#F5F2EB]">Discovery Turnaround</p>
                <p className="mt-0.5 text-xs text-[#C2D0D6]">
                  Structured scope brief on every inquiry
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 flex items-center justify-center">
            <ProfilePhoto priority={true} />
          </div>
        </div>
      </div>
    </section>
  );
};
