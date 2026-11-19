export type ClientTierId = 'individual' | 'startup' | 'smb' | 'enterprise';

export type ServiceDomainId =
  | 'technical-support'
  | 'customer-service'
  | 'data-analytics'
  | 'admin-operations'
  | 'account-management'
  | 'web-creation';

export type InquiryStatus = 'New' | 'In Review' | 'Scheduled' | 'Completed';

export interface ServiceOffering {
  id: ServiceDomainId;
  index: string;
  title: string;
  shortTitle: string;
  summary: string;
  outcomes: string[];
  deliverables: string[];
  cadence: string;
}

export interface ClientTierSolution {
  id: ClientTierId;
  label: string;
  headline: string;
  description: string;
  recommendedServices: string[];
  engagementModel: string;
  typicalTimeline: string;
  keyDeliverable: string;
}

export type ProjectImageAnimationVariant =
  | 'analytics'
  | 'ai-circuit'
  | 'network'
  | 'ambient';

export interface ProjectCase {
  id: string;
  title: string;
  domain: string;
  tier: string;
  timeframe: string;
  metricValue: string;
  metricLabel: string;
  summary: string;
  architecture: string[];
  imageUrl: string;
  animationVariant?: ProjectImageAnimationVariant;
}

export interface InsightArticle {
  id: string;
  title: string;
  category: string;
  readTime: string;
  publishedAt: string;
  excerpt: string;
  paragraphs: string[];
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  topic: string;
}

export type EmailDeliveryState = 'pending' | 'sending' | 'sent' | 'review';

export interface InquiryRecord {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company: string;
  tier: ClientTierId;
  serviceDomain: ServiceDomainId;
  timeline: string;
  message: string;
  status: InquiryStatus;
  createdAt: string;
  notes?: string;
  emailStatus?: EmailDeliveryState;
  emailAttempts?: number;
  providerMessageId?: string | null;
  lastEmailHttpStatus?: number | null;
  lastEmailStage?: string | null;
}

export interface BrandSettings {
  customPortraitDataUrl: string | null;
  customLogoDataUrl: string | null;
  motionEnabled: boolean;
  motionSensitivity: number;
}

export interface SiteContentPayload {
  projects: ProjectCase[];
  insights: InsightArticle[];
  faqs: FaqItem[];
  brand: BrandSettings;
}

export interface AiScopeRecommendation {
  recommendedTier: ClientTierId;
  recommendedService: ServiceDomainId;
  recommendedTimeline: string;
  executiveSummary: string;
  actionPlan: string[];
}

export type PortraitInteractionState =
  | 'IDLE'
  | 'HOVERING'
  | 'TRACKING_GAZE'
  | 'EXPRESSING'
  | 'DRAGGING'
  | 'RETURNING'
  | 'REDUCED_MOTION';

export type PortraitExpressionState =
  | 'neutral'
  | 'smile'
  | 'eyebrow-raise'
  | 'playful-reaction';

export interface PortraitEyeRigAssets {
  leftIrisUrl?: string;
  rightIrisUrl?: string;
  upperEyelidMaskUrl?: string;
}

export type PortraitExpressionFrames = Partial<
  Record<PortraitExpressionState, string>
>;

