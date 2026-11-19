import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { AnimatedProjectImage } from './effects/AnimatedProjectImage';
import { GoldenLightBackground } from './effects/GoldenLightBackground';
import { resolveAssetUrl } from '../data/profileData';
import type { FaqItem, InsightArticle, ProjectCase } from '../types';

interface ProjectsAndInsightsProps {
  projects: ProjectCase[];
  insights: InsightArticle[];
  faqs: FaqItem[];
}

export const ProjectsAndInsights: React.FC<ProjectsAndInsightsProps> = ({
  projects,
  insights,
  faqs,
}) => {
  const [domainFilter, setDomainFilter] = useState<string>('All');
  const [activeProject, setActiveProject] = useState<ProjectCase | null>(null);
  const [activeArticle, setActiveArticle] = useState<InsightArticle | null>(null);
  const [openFaqId, setOpenFaqId] = useState<string | null>(faqs[0]?.id || null);
  const projectCloseRef = useRef<HTMLButtonElement | null>(null);
  const articleCloseRef = useRef<HTMLButtonElement | null>(null);

  const domains = ['All', ...Array.from(new Set(projects.map((p) => p.domain)))];
  const filteredProjects =
    domainFilter === 'All'
      ? projects
      : projects.filter((p) => p.domain === domainFilter);

  useEffect(() => {
    if (activeProject) projectCloseRef.current?.focus();
  }, [activeProject]);

  useEffect(() => {
    if (activeArticle) articleCloseRef.current?.focus();
  }, [activeArticle]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveProject(null);
        setActiveArticle(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <>
      {/* Projects & Blueprints */}
      <section
        id="projects"
        className="scroll-mt-20 relative z-10 border-b border-[#C8A253]/15 py-16 sm:py-20"
      >
        <GoldenLightBackground variant="projects" />
        <div className="relative z-10 mx-auto max-w-[1280px] px-5 sm:px-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#DFC585]">
                Projects & Architecture
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-[#F5F2EB] sm:text-4xl text-balance">
                Representative systems and operational blueprints.
              </h2>
              <p className="mt-2 text-xs text-[#C2D0D6]">
                Target benchmark outcomes across practice domains.
              </p>
            </div>

            <div className="inline-flex flex-wrap gap-1.5 rounded-xl border border-[#C8A253]/18 bg-[#0A202B] p-1">
              {domains.map((dom) => {
                const isActive = dom === domainFilter;
                return (
                  <button
                    key={dom}
                    type="button"
                    onClick={() => setDomainFilter(dom)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A253] ${
                      isActive
                        ? 'border border-[#C8A253]/65 bg-[#123846] text-[#F5F2EB]'
                        : 'border border-transparent text-[#C2D0D6] hover:text-[#F5F2EB]'
                    }`}
                  >
                    {dom}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <article
                key={project.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-[#C8A253]/15 bg-[#0A202B]/90 transition-[border-color,box-shadow] duration-300 hover:border-[#C8A253]/45 focus-within:border-[#C8A253]/45 hover:shadow-[0_12px_32px_-16px_rgba(200,162,83,0.28)]"
              >
                <AnimatedProjectImage
                  src={resolveAssetUrl(project.imageUrl)}
                  alt={project.title}
                  variant={project.animationVariant}
                  domain={project.domain}
                  aspectClassName="aspect-[4/3]"
                >
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 z-[3] bg-gradient-to-t from-[#06141E]/85 via-transparent to-transparent"
                  />
                  <div className="absolute bottom-3 left-4 right-4 z-10 flex items-baseline justify-between gap-2">
                    <span className="font-mono text-2xl font-semibold tabular-nums text-[#DFC585]">
                      {project.metricValue}
                    </span>
                    <span className="text-xs text-[#F5F2EB] text-right">
                      {project.metricLabel}
                    </span>
                  </div>
                </AnimatedProjectImage>

                <div className="flex flex-1 flex-col justify-between p-6">
                  <div>
                    <p className="text-xs text-[#DFC585]">
                      {project.domain} · {project.timeframe} · {project.tier}
                    </p>
                    <h3 className="mt-2 font-display text-lg font-semibold text-[#F5F2EB]">
                      {project.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#C2D0D6]">
                      {project.summary}
                    </p>
                  </div>

                  <div className="mt-5 border-t border-[#C8A253]/12 pt-4">
                    <button
                      type="button"
                      onClick={() => setActiveProject(project)}
                      className="rounded text-xs font-semibold text-[#DFC585] hover:text-[#F5F2EB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A253]"
                    >
                      Inspect Blueprint Details
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Insights & Knowledge Center */}
      <section
        id="insights"
        className="scroll-mt-20 relative z-10 border-b border-[#C8A253]/15 py-16 sm:py-20"
      >
        <GoldenLightBackground variant="insights" />
        <div className="relative z-10 mx-auto max-w-[1280px] px-5 sm:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            {/* Editorial Insights */}
            <div className="lg:col-span-7">
              <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#DFC585]">
                Insights & Briefings
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-[#F5F2EB]">
                Field notes on operations, analytics, and systems.
              </h2>

              <div className="mt-8 divide-y divide-[#C8A253]/15 border-y border-[#C8A253]/15">
                {insights.map((article) => (
                  <article key={article.id} className="py-6">
                    <p className="text-xs text-[#DFC585]">
                      {article.category} · {article.publishedAt} · {article.readTime}
                    </p>
                    <h3 className="mt-2 font-display text-xl font-semibold text-[#F5F2EB]">
                      {article.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#C2D0D6]">
                      {article.excerpt}
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveArticle(article)}
                      className="mt-3 rounded text-xs font-semibold text-[#DFC585] hover:text-[#F5F2EB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A253]"
                    >
                      Read Full Briefing
                    </button>
                  </article>
                ))}
              </div>
            </div>

            {/* Knowledge Center / FAQs */}
            <div className="lg:col-span-5">
              <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#DFC585]">
                Knowledge Center
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-[#F5F2EB]">
                Frequently asked questions.
              </h2>

              <div className="mt-8 space-y-3">
                {faqs.map((faq) => {
                  const isOpen = openFaqId === faq.id;
                  return (
                    <div
                      key={faq.id}
                      className="rounded-xl border border-[#C8A253]/15 bg-[#0A202B]/90"
                    >
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                        className="flex w-full items-center justify-between gap-4 rounded-xl px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A253]"
                      >
                        <span className="text-sm font-medium text-[#F5F2EB]">
                          {faq.question}
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 shrink-0 text-[#C8A253] transition-transform duration-150 ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                          aria-hidden="true"
                        />
                      </button>
                      {isOpen && (
                        <div className="border-t border-[#C8A253]/12 px-5 py-4 text-sm leading-relaxed text-[#C2D0D6]">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Project Lightbox Modal */}
      {activeProject && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="project-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onClick={() => setActiveProject(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#C8A253]/25 bg-[#0A202B] p-6 sm:p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              ref={projectCloseRef}
              type="button"
              onClick={() => setActiveProject(null)}
              aria-label="Close project details"
              className="absolute right-4 top-4 rounded-lg border border-[#C8A253]/25 p-2 text-[#F5F2EB] hover:bg-[#123846] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A253]"
            >
              <X className="h-4 w-4" />
            </button>

            <p className="text-xs text-[#DFC585]">
              {activeProject.domain} · {activeProject.timeframe} · {activeProject.tier}
            </p>
            <h3
              id="project-modal-title"
              className="mt-2 pr-8 font-display text-2xl font-semibold text-[#F5F2EB]"
            >
              {activeProject.title}
            </h3>

            <div className="mt-5 overflow-hidden rounded-xl border border-[#C8A253]/18">
              <AnimatedProjectImage
                src={resolveAssetUrl(activeProject.imageUrl)}
                alt={activeProject.title}
                variant={activeProject.animationVariant}
                domain={activeProject.domain}
                aspectClassName="aspect-video"
                loading="eager"
              />
            </div>

            <div className="mt-5 flex items-baseline gap-3 border-b border-[#C8A253]/15 pb-4">
              <span className="font-mono text-2xl font-semibold tabular-nums text-[#DFC585]">
                {activeProject.metricValue}
              </span>
              <span className="text-sm text-[#F5F2EB]">{activeProject.metricLabel}</span>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-[#C2D0D6]">
              {activeProject.summary}
            </p>

            <div className="mt-5">
              <p className="text-xs font-semibold text-[#DFC585]">Architecture Components</p>
              <ul className="mt-2 space-y-1.5 text-sm text-[#C2D0D6]">
                {activeProject.architecture.map((item) => (
                  <li key={item}>· {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Article Reader Modal */}
      {activeArticle && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="article-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onClick={() => setActiveArticle(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#C8A253]/25 bg-[#0A202B] p-6 sm:p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              ref={articleCloseRef}
              type="button"
              onClick={() => setActiveArticle(null)}
              aria-label="Close article"
              className="absolute right-4 top-4 rounded-lg border border-[#C8A253]/25 p-2 text-[#F5F2EB] hover:bg-[#123846] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A253]"
            >
              <X className="h-4 w-4" />
            </button>

            <p className="text-xs text-[#DFC585]">
              {activeArticle.category} · {activeArticle.publishedAt} · {activeArticle.readTime}
            </p>
            <h3
              id="article-modal-title"
              className="mt-2 pr-8 font-display text-2xl font-semibold text-[#F5F2EB]"
            >
              {activeArticle.title}
            </h3>

            <div className="mt-6 space-y-4 text-sm leading-relaxed text-[#C2D0D6] sm:text-base">
              {activeArticle.paragraphs.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
