import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Send } from 'lucide-react';
import { CLIENT_TIER_SOLUTIONS, SERVICE_OFFERINGS } from '../data/profileData';
import { ApiError, apiFetch } from '../lib/apiClient';
import {
  DEFAULT_PHONE_COUNTRY,
  validateAndNormalizePhone,
  type CountryCode,
} from '../lib/phone';
import type { ClientTierId, InquiryRecord, ServiceDomainId } from '../types';
import { PhoneNumberField } from './PhoneNumberField';

interface ConsultationSectionProps {
  preselectedTier: ClientTierId;
  preselectedService: ServiceDomainId;
  preselectedTimeline?: string;
  preselectedSummary?: string;
}

export const ConsultationSection: React.FC<ConsultationSectionProps> = ({
  preselectedTier,
  preselectedService,
  preselectedTimeline,
  preselectedSummary,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneCountry, setPhoneCountry] = useState<CountryCode>(DEFAULT_PHONE_COUNTRY);
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [company, setCompany] = useState('');
  const [tier, setTier] = useState<ClientTierId>(preselectedTier);
  const [serviceDomain, setServiceDomain] = useState<ServiceDomainId>(preselectedService);
  const [timeline, setTimeline] = useState(preselectedTimeline || 'Within 30 days');
  const [message, setMessage] = useState(preselectedSummary || '');
  const [website, setWebsite] = useState('');
  const submission = useRef<{ payload: string; key: string } | null>(null);
  const submittingRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedRecord, setSubmittedRecord] = useState<InquiryRecord | null>(null);

  useEffect(() => {
    setTier(preselectedTier);
  }, [preselectedTier]);

  useEffect(() => {
    setServiceDomain(preselectedService);
  }, [preselectedService]);

  useEffect(() => {
    if (preselectedTimeline) setTimeline(preselectedTimeline);
  }, [preselectedTimeline]);

  useEffect(() => {
    if (preselectedSummary) setMessage(preselectedSummary);
  }, [preselectedSummary]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;
    setError(null);
    setPhoneError(null);

    if (name.trim().length < 2) {
      setError('Please enter your full name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid work or personal email address.');
      return;
    }
    const phoneCheck = validateAndNormalizePhone(phone, phoneCountry);
    if (!phoneCheck.valid) {
      setPhoneError(
        phoneCheck.error || 'Please enter a valid international contact number.'
      );
      document.getElementById('consult-phone')?.focus();
      return;
    }
    if (message.trim().length < 10) {
      setError('Please share at least a brief overview (10+ characters) of your objectives.');
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    try {
      const fields: Record<string, string> = {
        name: name.trim(),
        email: email.trim(),
        company: company.trim(),
        tier,
        serviceDomain,
        timeline,
        message: message.trim(),
        website,
      };
      if (phoneCheck.e164) {
        fields.phone = phoneCheck.e164;
      }
      const payload = JSON.stringify(fields);
      if (submission.current?.payload !== payload) {
        const nextKey =
          typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : '00000000-0000-4000-8000-' + Date.now().toString(16).padStart(12, '0').slice(-12);
        submission.current = { payload, key: nextKey };
      }
      const data = await apiFetch<{ inquiry?: InquiryRecord }>('/api/inquiries', {
        method: 'POST',
        body: JSON.stringify({ ...fields, submissionKey: submission.current.key }),
      });
      if (!data.inquiry || typeof data.inquiry.id !== 'string' || !data.inquiry.id.trim()) {
        throw new Error('We could not confirm your tracking ID. Please retry this request.');
      }
      submission.current = null;
      setSubmittedRecord(data.inquiry);
      setName('');
      setEmail('');
      setPhone('');
      setPhoneCountry(DEFAULT_PHONE_COUNTRY);
      setPhoneError(null);
      setCompany('');
      setMessage('');
      setWebsite('');
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) submission.current = null;
      if (
        err instanceof ApiError &&
        err.status === 400 &&
        /contact number|phone/i.test(err.message)
      ) {
        setPhoneError(err.message);
      } else {
        setError(err instanceof Error ? err.message : 'Submission failed. Please try again.');
      }
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <section id="contact" className="scroll-mt-20 relative z-10 py-16 sm:py-20">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5 space-y-5">
            <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#DFC585]">
              Consultation & Contact
            </p>
            <h2 className="font-display text-3xl font-semibold text-[#F5F2EB] sm:text-4xl text-balance">
              Start a structured discovery conversation.
            </h2>
            <p className="text-base leading-relaxed text-[#C2D0D6]">
              Share your priorities across technical support, customer operations, analytics,
              account management, or custom web creation below.
            </p>

            <div className="space-y-4 border-t border-[#C8A253]/15 pt-6 text-sm text-[#C2D0D6]">
              <div>
                <p className="text-xs font-medium text-[#DFC585]">Direct Inquiries</p>
                <div className="mt-1.5 flex flex-col items-start gap-1.5">
                  <a
                    href="mailto:pioorly.languisan@gmail.com"
                    className="inline-flex items-center rounded-sm py-0.5 font-mono text-sm text-[#F5F2EB] break-all underline decoration-[#C8A253]/45 underline-offset-4 transition-colors hover:text-[#DFC585] hover:decoration-[#DFC585] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A253]"
                  >
                    pioorly.languisan@gmail.com
                  </a>
                  <a
                    href="tel:+639294391755"
                    className="inline-flex items-center rounded-sm py-0.5 font-mono text-sm text-[#F5F2EB] underline decoration-[#C8A253]/45 underline-offset-4 transition-colors hover:text-[#DFC585] hover:decoration-[#DFC585] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A253]"
                  >
                    +63 929 439 1755
                  </a>
                </div>
                <p className="mt-2 text-xs text-[#C2D0D6]">
                  Hours of operation:{' '}
                  <span className="font-medium text-[#F5F2EB]">8:00 AM–5:00 PM PST</span>
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-[#DFC585]">Response Commitment</p>
                <p className="mt-1">
                  Every consultation request receives an immediate tracking reference and a tailored
                  agenda within 1 business day.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-[#C8A253]/20 bg-[#0A202B]/95 p-6 sm:p-8">
              {submittedRecord ? (
                <div className="space-y-4 py-4">
                  <div className="flex items-center gap-3 text-[#DFC585]">
                    <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
                    <h3 className="font-display text-xl font-semibold text-[#F5F2EB]">
                      Consultation Request Recorded
                    </h3>
                  </div>
                  <p className="text-sm leading-relaxed text-[#C2D0D6]">
                    Thank you, {submittedRecord.name}. Your inquiry has been logged for review.
                  </p>
                  <div className="rounded-xl border border-[#C8A253]/18 bg-[#06141E] p-4 text-xs text-[#C2D0D6] space-y-1.5">
                    <p>
                      Reference ID:{' '}
                      <span className="font-mono font-semibold text-[#DFC585]">
                        {submittedRecord.id}
                      </span>
                    </p>
                    <p>Organization Tier: {submittedRecord.tier}</p>
                    <p>Primary Focus: {submittedRecord.serviceDomain}</p>
                    <p>Target Timeline: {submittedRecord.timeline}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmittedRecord(null);
                      setError(null);
                    }}
                    className="rounded-lg border border-[#C8A253]/30 px-4 py-2 text-xs font-semibold text-[#DFC585] hover:bg-[#123846] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A253]"
                  >
                    Submit Another Request
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                  <div className="sr-only" aria-hidden="true">
                    <label htmlFor="consult-website">Website</label>
                    <input
                      id="consult-website"
                      type="text"
                      name="website"
                      tabIndex={-1}
                      autoComplete="off"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="consult-name"
                        className="block text-xs font-medium text-[#DFC585]"
                      >
                        Full Name *
                      </label>
                      <input
                        id="consult-name"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Alex Rivera"
                        className="mt-1.5 min-h-[42px] w-full rounded-lg border border-[#C8A253]/25 bg-[#06141E] px-3.5 py-2 text-sm text-[#F5F2EB] placeholder:text-[#F5F2EB]/45 focus:border-[#C8A253] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A253]"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="consult-email"
                        className="block text-xs font-medium text-[#DFC585]"
                      >
                        Email Address *
                      </label>
                      <input
                        id="consult-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="alex@company.com"
                        className="mt-1.5 min-h-[42px] w-full rounded-lg border border-[#C8A253]/25 bg-[#06141E] px-3.5 py-2 text-sm text-[#F5F2EB] placeholder:text-[#F5F2EB]/45 focus:border-[#C8A253] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A253]"
                      />
                    </div>
                  </div>

                  <PhoneNumberField
                    country={phoneCountry}
                    value={phone}
                    error={phoneError}
                    onCountryChange={(nextCountry) => {
                      setPhoneCountry(nextCountry);
                      if (phoneError) setPhoneError(null);
                    }}
                    onValueChange={(nextValue) => {
                      setPhone(nextValue);
                      if (phoneError) setPhoneError(null);
                    }}
                  />

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="consult-company"
                        className="block text-xs font-medium text-[#DFC585]"
                      >
                        Organization / Practice
                      </label>
                      <input
                        id="consult-company"
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="Optional company or team name"
                        className="mt-1.5 min-h-[42px] w-full rounded-lg border border-[#C8A253]/25 bg-[#06141E] px-3.5 py-2 text-sm text-[#F5F2EB] placeholder:text-[#F5F2EB]/45 focus:border-[#C8A253] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A253]"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="consult-tier"
                        className="block text-xs font-medium text-[#DFC585]"
                      >
                        Organization Tier
                      </label>
                      <select
                        id="consult-tier"
                        value={tier}
                        onChange={(e) => setTier(e.target.value as ClientTierId)}
                        className="mt-1.5 min-h-[42px] w-full rounded-lg border border-[#C8A253]/25 bg-[#06141E] px-3.5 py-2 text-sm text-[#F5F2EB] focus:border-[#C8A253] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A253]"
                      >
                        {CLIENT_TIER_SOLUTIONS.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="consult-service"
                        className="block text-xs font-medium text-[#DFC585]"
                      >
                        Primary Service Domain
                      </label>
                      <select
                        id="consult-service"
                        value={serviceDomain}
                        onChange={(e) => setServiceDomain(e.target.value as ServiceDomainId)}
                        className="mt-1.5 min-h-[42px] w-full rounded-lg border border-[#C8A253]/25 bg-[#06141E] px-3.5 py-2 text-sm text-[#F5F2EB] focus:border-[#C8A253] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A253]"
                      >
                        {SERVICE_OFFERINGS.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.index}. {s.title}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor="consult-timeline"
                        className="block text-xs font-medium text-[#DFC585]"
                      >
                        Target Timeline
                      </label>
                      <select
                        id="consult-timeline"
                        value={timeline}
                        onChange={(e) => setTimeline(e.target.value)}
                        className="mt-1.5 min-h-[42px] w-full rounded-lg border border-[#C8A253]/25 bg-[#06141E] px-3.5 py-2 text-sm text-[#F5F2EB] focus:border-[#C8A253] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A253]"
                      >
                        <option value="Immediate (1–2 weeks)">Immediate (1–2 weeks)</option>
                        <option value="Within 30 days">Within 30 days</option>
                        <option value="This quarter">This quarter</option>
                        <option value="Advisory / Ongoing">Advisory / Ongoing</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="consult-message"
                      className="block text-xs font-medium text-[#DFC585]"
                    >
                      Project Context & Objectives *
                    </label>
                    <textarea
                      id="consult-message"
                      required
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Briefly describe your current systems, operational bottleneck, or target deliverables..."
                      className="mt-1.5 w-full rounded-lg border border-[#C8A253]/25 bg-[#06141E] px-3.5 py-2.5 text-sm text-[#F5F2EB] placeholder:text-[#F5F2EB]/45 focus:border-[#C8A253] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A253]"
                    />
                  </div>

                  {error && (
                    <p role="alert" className="text-xs font-medium text-amber-300">
                      {error}
                    </p>
                  )}

                  <div className="flex items-center justify-end">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#C8A253] px-6 py-2.5 text-sm font-semibold text-[#06141E] whitespace-nowrap transition-colors hover:bg-[#DFC585] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5F2EB]"
                    >
                      <Send className="h-4 w-4" aria-hidden="true" />
                      <span>{submitting ? 'Submitting...' : 'Submit Consultation Request'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
