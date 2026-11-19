import type {
  ClientTierSolution,
  FaqItem,
  InsightArticle,
  ProjectCase,
  ServiceOffering,
} from '../types.ts';

export const BRAND_EMBLEM_URL =
  'assets/images/pl-circular-emblem.png';

export const NETWORK_VISUAL_URL =
  'assets/images/blockchain_network_visual_1794901227232.jpg';

export const ANALYTICS_VISUAL_URL =
  'assets/images/analytics_dashboard_visual_1794901227040.jpg';

export const WORKFLOW_VISUAL_URL =
  'assets/images/ai_automation_workflow_1794901228479.jpg';

export function resolveAssetUrl(assetPath: string, baseOverride?: string): string {
  if (!assetPath) return '';
  if (
    assetPath.startsWith('data:') ||
    assetPath.startsWith('http://') ||
    assetPath.startsWith('https://')
  ) {
    return assetPath;
  }

  const baseUrl =
    baseOverride ??
    ((import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/');
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

  let cleanPath = assetPath.replace(/^\/+/, '');
  if (cleanPath.startsWith('src/assets/')) {
    cleanPath = cleanPath.slice(4);
  }

  return `${normalizedBase}${cleanPath}`;
}

export const SERVICE_OFFERINGS: ServiceOffering[] = [
  {
    id: 'technical-support',
    index: '01',
    title: 'Technical Support & Systems',
    shortTitle: 'Technical Support',
    summary:
      'Structured troubleshooting, escalation governance, and root-cause documentation built to stabilize software and operational environments.',
    outcomes: [
      'Faster tier-1 to tier-2 triage resolution',
      'Repeatable incident runbooks and diagnostics',
      'Clear SLA compliance across user endpoints',
    ],
    deliverables: [
      'Escalation Matrix & Triage SOPs',
      'Knowledge Base Architecture',
      'Issue Taxonomy & Root-Cause Logs',
    ],
    cadence: 'Retainer or Project Sprint',
  },
  {
    id: 'customer-service',
    index: '02',
    title: 'Customer Service Operations',
    shortTitle: 'Customer Service',
    summary:
      'High-empathy omnichannel support frameworks that protect client trust, compress response latency, and turn support queues into retention signals.',
    outcomes: [
      'Consistent response tone across email, chat, and voice',
      'Reduced repeat-contact volume through proactive clarity',
      'Actionable CSAT and resolution-time tracking',
    ],
    deliverables: [
      'Omnichannel Response Playbooks',
      'Queue Prioritization & Routing Rules',
      'Client Feedback Loop Reporting',
    ],
    cadence: 'Ongoing Operations or Audit',
  },
  {
    id: 'data-analytics',
    index: '03',
    title: 'Data Analytics & Executive Reporting',
    shortTitle: 'Data Analytics',
    summary:
      'Turning fragmented spreadsheets, ticket queues, and operational logs into decision-ready dashboards and clean weekly executive summaries.',
    outcomes: [
      'Single source of truth for throughput and SLA metrics',
      'Normalized datasets free of manual reconciliation errors',
      'Clear anomaly detection for staffing and bottleneck planning',
    ],
    deliverables: [
      'Executive KPI Dashboard Models',
      'Automated Reporting Templates',
      'Operational Variance & Trend Briefings',
    ],
    cadence: '2–6 Week Implementation',
  },
  {
    id: 'admin-operations',
    index: '04',
    title: 'Administrative & Business Operations',
    shortTitle: 'Admin Operations',
    summary:
      'Disciplined executive coordination, vendor administration, documentation control, and internal process design that keeps teams moving without friction.',
    outcomes: [
      'Zero missed handoffs between leadership and delivery teams',
      'Standardized onboarding, compliance, and scheduling records',
      'Reclaimed leadership hours via structured workflow design',
    ],
    deliverables: [
      'Standard Operating Procedure Library',
      'Executive Calendar & Stakeholder Cadence',
      'Vendor & Resource Tracking Ledgers',
    ],
    cadence: 'Fractional Operations Partner',
  },
  {
    id: 'account-management',
    index: '05',
    title: 'Strategic Account Management',
    shortTitle: 'Account Management',
    summary:
      'Dedicated client relationship stewardship from initial onboarding through quarterly business reviews, renewal governance, and scope expansion.',
    outcomes: [
      'Structured 30/60/90-day client onboarding milestones',
      'Transparent executive QBRs grounded in real delivery data',
      'Early churn risk mitigation and healthy account continuity',
    ],
    deliverables: [
      'Client Onboarding & Handoff Blueprints',
      'QBR Executive Decks & Health Scorecards',
      'Renewal & Expansion Readiness Plans',
    ],
    cadence: 'Dedicated Portfolio Coverage',
  },
  {
    id: 'web-creation',
    index: '06',
    title: 'Web Creation & AI Workflows',
    shortTitle: 'Web & AI Systems',
    summary:
      'Modern responsive websites, client intake portals, and practical Gemini-assisted workflow tools engineered for clarity, speed, and reliability.',
    outcomes: [
      'Executive-grade digital presence with responsive precision',
      'Validated lead capture and client scoping interfaces',
      'Server-backed AI assistants grounded in real service logic',
    ],
    deliverables: [
      'Custom React & TypeScript Web Platforms',
      'Interactive Client Portals & Lead Workflows',
      'AI-Guided Service Discovery Integrations',
    ],
    cadence: '4–8 Week Build Cycle',
  },
];

export const CLIENT_TIER_SOLUTIONS: ClientTierSolution[] = [
  {
    id: 'individual',
    label: 'Individuals',
    headline: 'Personal executive presence and operational clarity',
    description:
      'Designed for independent consultants, executives, and creators who need a high-trust web platform, clean workflow systems, and structured analytics without agency overhead.',
    recommendedServices: [
      'Web Creation & AI Workflows',
      'Administrative Operations',
      'Data Analytics Setup',
    ],
    engagementModel: 'Focused 2–4 week build or advisory sprint',
    typicalTimeline: '2–4 Weeks',
    keyDeliverable: 'Personal Brand Platform + Intake Workflow',
  },
  {
    id: 'startup',
    label: 'Startups',
    headline: 'Foundational support, onboarding, and reporting from day one',
    description:
      'Built for early-stage teams transitioning from founder-led firefighting to repeatable customer service, technical triage, and investor-ready operational metrics.',
    recommendedServices: [
      'Technical Support & Systems',
      'Customer Service Operations',
      'Web Creation & AI Workflows',
    ],
    engagementModel: 'Rapid launch sprint with fractional continuity',
    typicalTimeline: '3–6 Weeks',
    keyDeliverable: 'Support Desk Architecture + KPI Baseline',
  },
  {
    id: 'smb',
    label: 'Small & Medium Businesses',
    headline: 'Connected operations across support, accounts, and analytics',
    description:
      'Ideal for growing companies ready to unify fragmented spreadsheets, standardize account management, and improve customer retention with measurable SLA visibility.',
    recommendedServices: [
      'Data Analytics & Executive Reporting',
      'Strategic Account Management',
      'Administrative & Business Operations',
    ],
    engagementModel: 'Structured operational overhaul + monthly advisory',
    typicalTimeline: '4–8 Weeks',
    keyDeliverable: 'Unified Operations Dashboard + QBR Playbook',
  },
  {
    id: 'enterprise',
    label: 'Enterprise Clients',
    headline: 'Scalable governance, distributed triage, and executive intelligence',
    description:
      'Tailored for multi-team organizations requiring cross-functional escalation matrices, normalized multi-source reporting, and governed AI service discovery.',
    recommendedServices: [
      'Technical Support & Systems',
      'Data Analytics & Executive Reporting',
      'Strategic Account Management',
    ],
    engagementModel: 'Cross-functional program delivery & documentation',
    typicalTimeline: '6–12 Weeks',
    keyDeliverable: 'Enterprise SLA Matrix + Automated Briefing Pipeline',
  },
];

export const INITIAL_PROJECTS: ProjectCase[] = [
  {
    id: 'proj-ops-analytics',
    title: 'Executive Operations & SLA Telemetry Hub',
    domain: 'Data Analytics',
    tier: 'SMB & Enterprise',
    timeframe: '6 Weeks',
    metricValue: '-41%',
    metricLabel: 'Average ticket escalation cycle time',
    summary:
      'Consolidated fragmented support queues, account health logs, and weekly operational spreadsheets into a unified KPI reporting model with clear SLA variance tracking.',
    architecture: [
      'Normalized multi-channel ticket taxonomy across 4 support tiers',
      'Automated weekly executive variance digests and backlog alerts',
      'Interactive throughput modeling for capacity planning',
    ],
    imageUrl: ANALYTICS_VISUAL_URL,
  },
  {
    id: 'proj-ai-triage',
    title: 'AI-Assisted Client Intake & Service Scoping Engine',
    domain: 'Web & AI Systems',
    tier: 'Startups & Growth Teams',
    timeframe: '4 Weeks',
    metricValue: '3.2x',
    metricLabel: 'Faster consultation brief qualification',
    summary:
      'Designed an executive web portal integrating validated lead capture with server-side Gemini guidance to map client pain points directly to structured service deliverables.',
    architecture: [
      'Server-side Gemini reasoning paired with strict service schema',
      'Validated consultation handoff with zero manual copy-paste',
      'Responsive Midnight Teal & Metallic Gold interface architecture',
    ],
    imageUrl: WORKFLOW_VISUAL_URL,
  },
  {
    id: 'proj-network-ops',
    title: 'Distributed Technical Support & Account Continuity Framework',
    domain: 'Technical Support & Account Management',
    tier: 'Enterprise',
    timeframe: '8 Weeks',
    metricValue: '98.4%',
    metricLabel: 'On-time milestone adherence across renewals',
    summary:
      'Built an interconnected escalation and account stewardship protocol linking front-line technical diagnostics directly with QBR reporting and executive stakeholder updates.',
    architecture: [
      'Tier-1 to Tier-3 diagnostic handoff checklists and SLA timers',
      '30/60/90-day client onboarding and renewal health scorecards',
      'Centralized SOP library for cross-time-zone operational teams',
    ],
    imageUrl: NETWORK_VISUAL_URL,
  },
];

export const INITIAL_INSIGHTS: InsightArticle[] = [
  {
    id: 'insight-support-analytics',
    title: 'Why Technical Support Queues Are Your Best Operational Analytics Dataset',
    category: 'Data Analytics',
    readTime: '4 min read',
    publishedAt: 'November 2026',
    excerpt:
      'Every recurring support ticket encodes a product friction point, an onboarding gap, or a documentation blind spot waiting to be quantified.',
    paragraphs: [
      'Most organizations treat technical support strictly as a cost center focused on closing tickets as quickly as possible. While speed matters, speed without categorization hides the systemic patterns driving ticket volume in the first place.',
      'By introducing a disciplined 3-layer taxonomy—root cause, customer tier, and resolution pathway—support logs transform into an early-warning intelligence system for account managers and leadership.',
      'When paired with weekly executive variance briefs, teams can prioritize fixes that eliminate entire classes of repeat inquiries rather than simply adding headcount to handle symptoms.',
    ],
  },
  {
    id: 'insight-account-continuity',
    title: 'Bridging Customer Service and Strategic Account Management',
    category: 'Account Management',
    readTime: '5 min read',
    publishedAt: 'October 2026',
    excerpt:
      'Renewals are rarely won in the final thirty days of a contract—they are earned through transparent operational delivery across every routine interaction.',
    paragraphs: [
      'A common failure mode in B2B service delivery is the wall between day-to-day customer service and quarterly account management. Account leads walk into QBRs unaware of unresolved friction points, while support agents lack context on strategic client goals.',
      'Aligning both functions around a shared health ledger ensures that every escalated issue informs the executive narrative—demonstrating accountability, response discipline, and measurable progress.',
    ],
  },
  {
    id: 'insight-ai-operations',
    title: 'Practical AI Workflows for Lean Operations Teams',
    category: 'Web & AI Systems',
    readTime: '4 min read',
    publishedAt: 'October 2026',
    excerpt:
      'Effective AI adoption starts with clean operational inputs, structured scoping schemas, and human-in-the-loop verification—not generic chatbots.',
    paragraphs: [
      'Adding an AI widget without clear domain boundaries creates noise. In operational environments, AI delivers real leverage when anchored to explicit service catalogs, validated forms, and structured JSON handoffs.',
      'Whether triaging consultation requests or summarizing weekly SLA metrics, pairing Gemini models on a secure server backend with deterministic UI workflows yields reliable, auditable outcomes.',
    ],
  },
];

export const INITIAL_FAQS: FaqItem[] = [
  {
    id: 'faq-tiers',
    question: 'Who do you typically work with—individuals, startups, or established enterprises?',
    answer:
      'Engagements are structured across all four tiers. Individuals and founders often engage for web creation and personal workflow organization; startups and SMBs focus on support desk setup, analytics dashboards, and account retention; enterprise teams partner on SLA governance, reporting normalization, and escalation architecture.',
    topic: 'Engagement',
  },
  {
    id: 'faq-scope',
    question: 'Can multiple service pillars be combined into a single engagement?',
    answer:
      'Yes. In practice, technical support, customer service, data analytics, and account management reinforce one another. Most engagements combine a primary operational build—such as a reporting system or web portal—with ongoing advisory or documentation.',
    topic: 'Services',
  },
  {
    id: 'faq-ai',
    question: 'How does the Gemini AI Service Advisor work on this platform?',
    answer:
      'The AI Advisor runs through a dedicated server-side endpoint powered by Gemini. It evaluates your team size, operational bottlenecks, and timeline to recommend matching service pillars and can generate a structured consultation brief directly into the booking form.',
    topic: 'Technology',
  },
  {
    id: 'faq-timeline',
    question: 'What happens after I submit a consultation request?',
    answer:
      'Every submission receives an immediate reference ID and is logged for review. Within one business day, you receive a tailored discovery agenda outlining proposed milestones, deliverables, and scheduling options.',
    topic: 'Process',
  },
];
