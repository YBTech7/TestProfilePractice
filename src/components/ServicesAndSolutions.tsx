import React, { useState } from 'react';
import { ArrowUpRight, Check, MessageSquare, Sparkles } from 'lucide-react';
import { AnimatedProjectImage } from './effects/AnimatedProjectImage';
import { GoldenLightBackground } from './effects/GoldenLightBackground';
import {
  CLIENT_TIER_SOLUTIONS,
  NETWORK_VISUAL_URL,
  SERVICE_OFFERINGS,
  resolveAssetUrl,
} from '../data/profileData';
import { apiFetch } from '../lib/apiClient';
import type {
  AiScopeRecommendation,
  ClientTierId,
  ServiceDomainId,
} from '../types';

interface ServicesAndSolutionsProps {
  selectedTier: ClientTierId;
  onSelectTier: (tier: ClientTierId) => void;
  onSelectServiceForConsult: (serviceId: ServiceDomainId, tierId?: ClientTierId) => void;
  onApplyAiScope: (scope: AiScopeRecommendation) => void;
  onOpenAdvisor: () => void;
}

const TIER_CHART_SERIES: Record<
  ClientTierId,
  {
    label: string;
    slaTarget: string;
    cycleReduction: string;
    points: { quarter: string; baseline: number; optimized: number }[];
  }
> = {
  individual: {
    label: 'Personal Workflow Efficiency Index',
    slaTarget: '99.2%',
    cycleReduction: '-38%',
    points: [
      { quarter: 'W1', baseline: 58, optimized: 68 },
      { quarter: 'W2', baseline: 60, optimized: 78 },
      { quarter: 'W3', baseline: 59, optimized: 88 },
      { quarter: 'W4', baseline: 62, optimized: 95 },
    ],
  },
  startup: {
    label: 'First-Response Resolution Velocity',
    slaTarget: '97.5%',
    cycleReduction: '-44%',
    points: [
      { quarter: 'Q1', baseline: 48, optimized: 64 },
      { quarter: 'Q2', baseline: 51, optimized: 76 },
      { quarter: 'Q3', baseline: 50, optimized: 86 },
      { quarter: 'Q4', baseline: 53, optimized: 93 },
    ],
  },
  smb: {
    label: 'Cross-Team SLA & Account Health',
    slaTarget: '98.1%',
    cycleReduction: '-41%',
    points: [
      { quarter: 'Q1', baseline: 55, optimized: 70 },
      { quarter: 'Q2', baseline: 57, optimized: 81 },
      { quarter: 'Q3', baseline: 56, optimized: 89 },
      { quarter: 'Q4', baseline: 58, optimized: 96 },
    ],
  },
  enterprise: {
    label: 'Multi-Tier Escalation Consistency',
    slaTarget: '99.4%',
    cycleReduction: '-47%',
    points: [
      { quarter: 'Q1', baseline: 62, optimized: 74 },
      { quarter: 'Q2', baseline: 63, optimized: 84 },
      { quarter: 'Q3', baseline: 61, optimized: 92 },
      { quarter: 'Q4', baseline: 64, optimized: 98 },
    ],
  },
};

export const ServicesAndSolutions: React.FC<ServicesAndSolutionsProps> = ({
  selectedTier,
  onSelectTier,
  onSelectServiceForConsult,
  onApplyAiScope,
  onOpenAdvisor,
}) => {
  const [goalInput, setGoalInput] = useState('');
  const [scopeLoading, setScopeLoading] = useState(false);
  const [scopeError, setScopeError] = useState<string | null>(null);
  const [scopeResult, setScopeResult] = useState<AiScopeRecommendation | null>(null);

  const activeSolution =
    CLIENT_TIER_SOLUTIONS.find((t) => t.id === selectedTier) || CLIENT_TIER_SOLUTIONS[1];
  const chartData = TIER_CHART_SERIES[selectedTier];

  const handleGenerateScope = async (e: React.FormEvent) => {
    e.preventDefault();
    if (goalInput.trim().length < 5) {
      setScopeError('Describe your operational challenge or project goal in at least a few words.');
      return;
    }

    setScopeLoading(true);
    setScopeError(null);
    try {
      const data = await apiFetch<{ scope: AiScopeRecommendation }>('/api/assistant/scope', {
        method: 'POST',
        body: JSON.stringify({ goal: goalInput.trim() }),
      });
      setScopeResult(data.scope);
    } catch (err) {
      setScopeError(
        err instanceof Error ? err.message : 'Unable to reach Gemini service advisor.'
      );
    } finally {
      setScopeLoading(false);
    }
  };

  return (
    <>
      {/* About & Practice Philosophy */}
      <section
        id="about"
        className="scroll-mt-20 relative z-10 border-b border-[#C8A253]/15 py-16 sm:py-20"
      >
        <GoldenLightBackground variant="about" />
        <div className="relative z-10 mx-auto max-w-[1280px] px-5 sm:px-8">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-6 space-y-5">
              <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#DFC585]">
                Executive Profile
              </p>
              <h2 className="font-display text-3xl font-semibold text-[#F5F2EB] sm:text-4xl text-balance">
                Where hands-on operations meet clear technical execution.
              </h2>
              <p className="text-base leading-relaxed text-[#C2D0D6]">
                Teams rarely stall from a lack of software—they stall when technical support,
                reporting, account handoffs, and web tools work in disconnected silos. Drawing from
                direct delivery experience across all six disciplines, I build cohesive systems
                that scale cleanly from solo practices to enterprise teams.
              </p>

              <div className="grid grid-cols-1 gap-4 border-t border-[#C8A253]/15 pt-6 sm:grid-cols-3">
                <div>
                  <p className="font-mono text-xs text-[#DFC585]">01</p>
                  <p className="mt-1 text-sm font-semibold text-[#F5F2EB]">Diagnose</p>
                  <p className="mt-1 text-xs leading-relaxed text-[#C2D0D6]">
                    Audit queues, spreadsheets, and handoffs for hidden bottlenecks.
                  </p>
                </div>
                <div>
                  <p className="font-mono text-xs text-[#DFC585]">02</p>
                  <p className="mt-1 text-sm font-semibold text-[#F5F2EB]">Structure</p>
                  <p className="mt-1 text-xs leading-relaxed text-[#C2D0D6]">
                    Establish clean SOPs, SLA governance, and normalized reporting.
                  </p>
                </div>
                <div>
                  <p className="font-mono text-xs text-[#DFC585]">03</p>
                  <p className="mt-1 text-sm font-semibold text-[#F5F2EB]">Automate</p>
                  <p className="mt-1 text-xs leading-relaxed text-[#C2D0D6]">
                    Deploy custom web portals, dashboards, and AI-guided workflows.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="group overflow-hidden rounded-2xl border border-[#C8A253]/20 bg-[#0A202B] transition-colors hover:border-[#C8A253]/40">
                <AnimatedProjectImage
                  src={resolveAssetUrl(NETWORK_VISUAL_URL)}
                  alt="Distributed network topology representing interconnected operational systems"
                  variant="network"
                  aspectClassName="aspect-video"
                />
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#C8A253]/15 px-5 py-3.5 text-xs text-[#C2D0D6]">
                  <span>Connected Operations Architecture</span>
                  <span className="text-[#DFC585]">Support · Analytics · Accounts · Web</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Services Grid */}
      <section
        id="services"
        className="scroll-mt-20 relative z-10 border-b border-[#C8A253]/15 py-16 sm:py-20"
      >
        <GoldenLightBackground variant="services" />
        <div className="relative z-10 mx-auto max-w-[1280px] px-5 sm:px-8">
          <div className="flex flex-col justify-between gap-4 border-b border-[#C8A253]/15 pb-8 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#DFC585]">
                Core Services
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-[#F5F2EB] sm:text-4xl text-balance">
                Six practice disciplines built for measurable delivery.
              </h2>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-[#C2D0D6]">
              Select any discipline to pre-fill a focused consultation brief for your team.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-12">
            {SERVICE_OFFERINGS.map((service, idx) => {
              const isWide = idx === 0 || idx === 3 || idx === 4;
              const colSpan = isWide ? 'lg:col-span-7' : 'lg:col-span-5';
              return (
                <article
                  key={service.id}
                  className={`${colSpan} flex flex-col justify-between rounded-2xl border border-[#C8A253]/15 bg-[#0A202B]/90 p-6 sm:p-7 transition-colors duration-150 hover:border-[#C8A253]/40`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-4 text-xs text-[#C2D0D6]">
                      <span className="font-mono tabular-nums text-[#DFC585]">
                        {service.index}
                      </span>
                      <span>{service.cadence}</span>
                    </div>

                    <h3 className="mt-3 font-display text-xl font-semibold text-[#F5F2EB]">
                      {service.title}
                    </h3>

                    <p className="mt-2.5 text-sm leading-relaxed text-[#C2D0D6]">
                      {service.summary}
                    </p>

                    <div className="mt-5 grid grid-cols-1 gap-4 border-t border-[#C8A253]/12 pt-5 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-medium text-[#DFC585]">Operational Outcomes</p>
                        <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-[#C2D0D6]">
                          {service.outcomes.map((outcome) => (
                            <li key={outcome} className="flex items-start gap-2">
                              <Check
                                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#C8A253]"
                                aria-hidden="true"
                              />
                              <span>{outcome}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-[#DFC585]">Key Deliverables</p>
                        <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-[#C2D0D6]">
                          {service.deliverables.map((del) => (
                            <li key={del}>· {del}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-end border-t border-[#C8A253]/12 pt-4">
                    <button
                      type="button"
                      onClick={() => onSelectServiceForConsult(service.id)}
                      className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-semibold text-[#DFC585] whitespace-nowrap transition-colors hover:text-[#F5F2EB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A253]"
                    >
                      <span>Scope {service.shortTitle}</span>
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Business Solutions & Interactive Analytics + AI Scope */}
      <section
        id="solutions"
        className="scroll-mt-20 relative z-10 border-b border-[#C8A253]/15 py-16 sm:py-20"
      >
        <GoldenLightBackground variant="solutions" />
        <div className="relative z-10 mx-auto max-w-[1280px] px-5 sm:px-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#DFC585]">
                Business Solutions
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-[#F5F2EB] sm:text-4xl text-balance">
                Structured engagement models for every stage of growth.
              </h2>
            </div>

            <div
              role="tablist"
              aria-label="Client Organization Tiers"
              className="inline-flex flex-wrap gap-1.5 rounded-xl border border-[#C8A253]/18 bg-[#0A202B] p-1"
            >
              {CLIENT_TIER_SOLUTIONS.map((tier) => {
                const isActive = tier.id === selectedTier;
                return (
                  <button
                    key={tier.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => onSelectTier(tier.id)}
                    className={`rounded-lg px-3.5 py-2 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A253] ${
                      isActive
                        ? 'border border-[#C8A253]/65 bg-[#123846] text-[#F5F2EB]'
                        : 'border border-transparent text-[#C2D0D6] hover:text-[#F5F2EB]'
                    }`}
                  >
                    {tier.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Tier Solution Brief */}
            <div className="flex flex-col justify-between rounded-2xl border border-[#C8A253]/15 bg-[#0A202B]/90 p-7 lg:col-span-6">
              <div>
                <p className="text-xs text-[#DFC585]">
                  {activeSolution.label} · {activeSolution.typicalTimeline}
                </p>
                <h3 className="mt-2 font-display text-2xl font-semibold text-[#F5F2EB]">
                  {activeSolution.headline}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[#C2D0D6]">
                  {activeSolution.description}
                </p>

                <div className="mt-6 space-y-4 border-t border-[#C8A253]/15 pt-5">
                  <div>
                    <p className="text-xs font-medium text-[#DFC585]">Recommended Pillars</p>
                    <p className="mt-1 text-sm text-[#F5F2EB]">
                      {activeSolution.recommendedServices.join(' · ')}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium text-[#DFC585]">Engagement Cadence</p>
                      <p className="mt-1 text-sm text-[#C2D0D6]">
                        {activeSolution.engagementModel}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[#DFC585]">Anchor Deliverable</p>
                      <p className="mt-1 text-sm text-[#C2D0D6]">
                        {activeSolution.keyDeliverable}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[#C8A253]/15 pt-5">
                <span className="text-xs text-[#C2D0D6]">
                  Tailored discovery call included
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onSelectServiceForConsult('technical-support', activeSolution.id)
                  }
                  className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[#C8A253]/45 bg-[#123846] px-4 py-2 text-xs font-semibold text-[#F5F2EB] whitespace-nowrap transition-colors hover:border-[#C8A253] hover:text-[#DFC585] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A253]"
                >
                  <span>Request {activeSolution.label} Scope</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-[#DFC585]" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Interactive Operations & Analytics Preview */}
            <div className="flex flex-col justify-between rounded-2xl border border-[#C8A253]/15 bg-[#0A202B]/90 p-7 lg:col-span-6">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-[#DFC585]">Analytics & SLA Model</p>
                    <h3 className="mt-1 font-display text-lg font-semibold text-[#F5F2EB]">
                      {chartData.label}
                    </h3>
                  </div>
                  <div className="flex items-center gap-5 text-right">
                    <div>
                      <p className="font-mono text-lg font-semibold tabular-nums text-[#DFC585]">
                        {chartData.slaTarget}
                      </p>
                      <p className="text-[11px] text-[#C2D0D6]">Target SLA</p>
                    </div>
                    <div>
                      <p className="font-mono text-lg font-semibold tabular-nums text-[#F5F2EB]">
                        {chartData.cycleReduction}
                      </p>
                      <p className="text-[11px] text-[#C2D0D6]">Cycle Latency</p>
                    </div>
                  </div>
                </div>

                {/* Clean Tabular Bar Visualization */}
                <div className="mt-6 space-y-4 border-t border-[#C8A253]/12 pt-5">
                  {chartData.points.map((pt) => (
                    <div key={pt.quarter} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono tabular-nums text-[#C2D0D6]">
                          {pt.quarter}
                        </span>
                        <span className="font-mono tabular-nums text-[#DFC585]">
                          Baseline {pt.baseline}% · Structured {pt.optimized}%
                        </span>
                      </div>
                      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-[#06141E]">
                        <div
                          className="absolute inset-y-0 left-0 rounded-full bg-[#154454]"
                          style={{ width: `${pt.baseline}%` }}
                        />
                        <div
                          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#6E5629] to-[#C8A253] transition-all duration-300"
                          style={{ width: `${pt.optimized}%`, opacity: 0.9 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick AI Scope Builder & Inline Advisor Trigger */}
              <div className="mt-7 border-t border-[#C8A253]/15 pt-5 space-y-4">
                <form onSubmit={handleGenerateScope} className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label
                      htmlFor="ai-scope-input"
                      className="flex items-center gap-2 text-xs font-semibold text-[#DFC585]"
                    >
                      <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Consultation Scope Generator</span>
                    </label>
                    <button
                      type="button"
                      onClick={onOpenAdvisor}
                      aria-label="Open Gemini Service Advisor"
                      className="inline-flex items-center gap-1.5 rounded-md border border-[#C8A253]/30 bg-[#06141E] px-2.5 py-1 text-[11px] font-medium text-[#DFC585] transition-colors hover:border-[#C8A253] hover:text-[#F5F2EB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A253]"
                    >
                      <MessageSquare className="h-3 w-3" aria-hidden="true" />
                      <span>Open AI Advisor Chat</span>
                    </button>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      id="ai-scope-input"
                      type="text"
                      value={goalInput}
                      onChange={(e) => setGoalInput(e.target.value)}
                      placeholder="e.g. We have 4 support agents and messy weekly Excel SLA reports..."
                      className="min-h-[42px] flex-1 rounded-lg border border-[#C8A253]/25 bg-[#06141E] px-3.5 py-2 text-sm text-[#F5F2EB] placeholder:text-[#F5F2EB]/45 focus:border-[#C8A253] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A253]"
                    />
                    <button
                      type="submit"
                      disabled={scopeLoading}
                      className="inline-flex min-h-[42px] items-center justify-center rounded-lg border border-[#C8A253]/40 bg-[#123846] px-4 py-2 text-xs font-semibold text-[#F5F2EB] whitespace-nowrap transition-colors hover:border-[#C8A253] hover:text-[#DFC585] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A253]"
                    >
                      {scopeLoading ? 'Scoping...' : 'Generate Scope'}
                    </button>
                  </div>
                </form>

                {scopeError && (
                  <p role="alert" className="text-xs text-amber-300">
                    {scopeError}
                  </p>
                )}

                {scopeResult && (
                  <div className="rounded-xl border border-[#C8A253]/30 bg-[#06141E]/95 p-4 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-[#DFC585]">
                        Recommended: {scopeResult.recommendedService.replace('-', ' ')} ·{' '}
                        {scopeResult.recommendedTimeline}
                      </span>
                      <button
                        type="button"
                        onClick={() => onApplyAiScope(scopeResult)}
                        className="font-semibold text-[#C8A253] underline underline-offset-4 hover:text-[#F5F2EB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A253]"
                      >
                        Apply to Consultation Form
                      </button>
                    </div>
                    <p className="mt-2 leading-relaxed text-[#F5F2EB]">
                      {scopeResult.executiveSummary}
                    </p>
                    <ul className="mt-2 space-y-1 text-[#C2D0D6]">
                      {scopeResult.actionPlan.map((step) => (
                        <li key={step}>· {step}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
