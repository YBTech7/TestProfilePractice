/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import {
  INITIAL_FAQS,
  INITIAL_INSIGHTS,
  INITIAL_PROJECTS,
} from './data/profileData';
import { apiFetch } from './lib/apiClient';
import type {
  AiScopeRecommendation,
  BrandSettings,
  ClientTierId,
  FaqItem,
  InsightArticle,
  ProjectCase,
  ServiceDomainId,
} from './types';
import { NetworkCanvas } from './components/NetworkCanvas';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { ServicesAndSolutions } from './components/ServicesAndSolutions';
import { ProjectsAndInsights } from './components/ProjectsAndInsights';
import { ConsultationSection } from './components/ConsultationSection';
import { BrandMark } from './components/BrandMark';

const AiAdvisorDrawer = lazy(() =>
  import('./components/AiAdvisorDrawer').then((m) => ({ default: m.AiAdvisorDrawer }))
);
const AdminPortal = lazy(() =>
  import('./components/AdminPortal').then((m) => ({ default: m.AdminPortal }))
);

export default function App() {
  const [projects, setProjects] = useState<ProjectCase[]>(INITIAL_PROJECTS);
  const [insights, setInsights] = useState<InsightArticle[]>(INITIAL_INSIGHTS);
  const [faqs, setFaqs] = useState<FaqItem[]>(INITIAL_FAQS);
  const [brand, setBrand] = useState<BrandSettings>({
    customPortraitDataUrl: null,
    customLogoDataUrl: null,
    motionEnabled: true,
    motionSensitivity: 1,
  });

  const [selectedTier, setSelectedTier] = useState<ClientTierId>('startup');
  const [consultService, setConsultService] =
    useState<ServiceDomainId>('technical-support');
  const [consultTimeline, setConsultTimeline] = useState<string>('Within 30 days');
  const [consultSummary, setConsultSummary] = useState<string>('');

  const [advisorOpen, setAdvisorOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);

  const loadSiteContent = useCallback(async () => {
    try {
      const data = await apiFetch<{
        projects?: ProjectCase[];
        insights?: InsightArticle[];
        faqs?: FaqItem[];
        brand?: BrandSettings;
      }>('/api/content');
      if (Array.isArray(data.projects)) setProjects(data.projects);
      if (Array.isArray(data.insights)) setInsights(data.insights);
      if (Array.isArray(data.faqs)) setFaqs(data.faqs);
      if (data.brand) setBrand(data.brand);
    } catch {
      // Static fallback defaults remain active when backend API is unavailable
    }
  }, []);

  useEffect(() => {
    loadSiteContent();
  }, [loadSiteContent]);

  const scrollToContact = () => {
    const el = document.getElementById('contact');
    if (el) {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    }
  };

  const handleSelectServiceForConsult = (
    serviceId: ServiceDomainId,
    tierId?: ClientTierId
  ) => {
    setConsultService(serviceId);
    if (tierId) setSelectedTier(tierId);
    scrollToContact();
  };

  const handleApplyAiScope = (scope: AiScopeRecommendation) => {
    setSelectedTier(scope.recommendedTier);
    setConsultService(scope.recommendedService);
    setConsultTimeline(scope.recommendedTimeline);
    setConsultSummary(
      `${scope.executiveSummary}\n\nProposed Milestones:\n${scope.actionPlan
        .map((step, i) => `${i + 1}. ${step}`)
        .join('\n')}`
    );
    scrollToContact();
  };

  const handleAdvisorToConsult = (summaryText: string) => {
    setConsultSummary(summaryText);
    scrollToContact();
  };

  return (
    <div className="relative min-h-screen bg-[#06141E] text-[#F5F2EB]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-[#C8A253] focus:px-4 focus:py-2 focus:text-xs focus:font-semibold focus:text-[#06141E]"
      >
        Skip to main content
      </a>

      <NetworkCanvas />

      <Header
        customLogoUrl={brand.customLogoDataUrl}
        onBookConsultation={scrollToContact}
      />

      <main id="main-content" tabIndex={-1} className="focus:outline-none">
        <HeroSection onBookConsultation={scrollToContact} />

        <ServicesAndSolutions
          selectedTier={selectedTier}
          onSelectTier={setSelectedTier}
          onSelectServiceForConsult={handleSelectServiceForConsult}
          onApplyAiScope={handleApplyAiScope}
          onOpenAdvisor={() => setAdvisorOpen(true)}
        />

        <ProjectsAndInsights
          projects={projects}
          insights={insights}
          faqs={faqs}
        />

        <ConsultationSection
          preselectedTier={selectedTier}
          preselectedService={consultService}
          preselectedTimeline={consultTimeline}
          preselectedSummary={consultSummary}
        />
      </main>

      <footer className="relative z-10 border-t border-[#C8A253]/15 bg-[#05111A] py-10">
        <div className="mx-auto flex max-w-[1280px] flex-col justify-between gap-6 px-5 sm:px-8 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <BrandMark customLogoUrl={brand.customLogoDataUrl} size={36} decorative />
            <div>
              <p className="font-display text-sm font-semibold leading-snug text-[#F5F2EB]">
                Pio Languisan
              </p>
              <p className="text-xs text-[#C2D0D6]">
                Technology · Operations · Analytics
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-[#C2D0D6]">
            <a
              href="#about"
              className="rounded hover:text-[#DFC585] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A253]"
            >
              About
            </a>
            <a
              href="#services"
              className="rounded hover:text-[#DFC585] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A253]"
            >
              Services
            </a>
            <a
              href="#solutions"
              className="rounded hover:text-[#DFC585] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A253]"
            >
              Solutions
            </a>
            <a
              href="#projects"
              className="rounded hover:text-[#DFC585] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A253]"
            >
              Projects
            </a>
            <a
              href="#contact"
              className="rounded hover:text-[#DFC585] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A253]"
            >
              Contact
            </a>
            <button
              type="button"
              onClick={() => setAdminOpen(true)}
              className="rounded font-medium text-[#DFC585] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A253]"
            >
              Admin Console
            </button>
          </div>

          <p className="text-xs text-[#C2D0D6]/85">
            © {new Date().getFullYear()} Pio Languisan. All rights reserved.
          </p>
        </div>
      </footer>

      <Suspense fallback={null}>
        {advisorOpen && (
          <AiAdvisorDrawer
            open={advisorOpen}
            onClose={() => setAdvisorOpen(false)}
            onProceedToConsult={handleAdvisorToConsult}
          />
        )}

        {adminOpen && (
          <AdminPortal
            open={adminOpen}
            onClose={() => setAdminOpen(false)}
            onContentUpdated={loadSiteContent}
          />
        )}
      </Suspense>
    </div>
  );
}
