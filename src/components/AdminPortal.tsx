import React, { useEffect, useState } from 'react';
import { Lock, LogOut, Plus, Trash2, Upload, X } from 'lucide-react';
import { apiFetch, ApiError } from '../lib/apiClient';
import type {
  BrandSettings,
  InquiryRecord,
  InquiryStatus,
  ProjectCase,
} from '../types';

interface AdminPortalProps {
  open: boolean;
  onClose: () => void;
  onContentUpdated: () => void;
}

const STATUS_OPTIONS: InquiryStatus[] = [
  'New',
  'In Review',
  'Scheduled',
  'Completed',
];

export const AdminPortal: React.FC<AdminPortalProps> = ({
  open,
  onClose,
  onContentUpdated,
}) => {
  const [token, setToken] = useState<string | null>(null);
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<'leads' | 'projects' | 'brand'>('leads');
  const [inquiries, setInquiries] = useState<InquiryRecord[]>([]);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [projects, setProjects] = useState<ProjectCase[]>([]);
  const [brand, setBrand] = useState<BrandSettings>({
    customPortraitDataUrl: null,
    customLogoDataUrl: null,
    motionEnabled: true,
    motionSensitivity: 1,
  });
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // New Project Form
  const [newTitle, setNewTitle] = useState('');
  const [newDomain, setNewDomain] = useState('Data Analytics');
  const [newTier, setNewTier] = useState('SMB & Enterprise');
  const [newMetricValue, setNewMetricValue] = useState('+35%');
  const [newMetricLabel, setNewMetricLabel] = useState('Operational throughput improvement');
  const [newSummary, setNewSummary] = useState('');

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const loadDashboard = async (authToken: string) => {
    try {
      const data = await apiFetch<{
        inquiries: InquiryRecord[];
        projects: ProjectCase[];
        brand: BrandSettings;
      }>('/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const loadedInquiries = data.inquiries || [];
      setInquiries(loadedInquiries);
      setNoteDrafts(
        Object.fromEntries(loadedInquiries.map((item) => [item.id, item.notes ?? '']))
      );
      setProjects(data.projects || []);
      if (data.brand) setBrand(data.brand);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setToken(null);
      }
      setStatusMessage(err instanceof Error ? err.message : 'Unable to load dashboard.');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      const data = await apiFetch<{ token: string }>('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ passcode }),
      });
      setToken(data.token);
      setPasscode('');
      await loadDashboard(data.token);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    if (token) {
      await apiFetch('/api/admin/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    setToken(null);
    setStatusMessage(null);
  };

  const handleInquiryUpdate = async (
    id: string,
    updates: { status?: InquiryStatus; notes?: string }
  ) => {
    if (!token) return;
    try {
      const data = await apiFetch<{ inquiry: InquiryRecord }>(`/api/admin/inquiries/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(updates),
      });
      setInquiries((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...data.inquiry } : item))
      );
      if (updates.notes !== undefined) {
        setNoteDrafts((prev) => ({ ...prev, [id]: data.inquiry.notes ?? updates.notes ?? '' }));
      }
      setStatusMessage(
        updates.status
          ? `Updated ${id} to ${updates.status}.`
          : `Saved triage note for ${id}.`
      );
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : 'Unable to update inquiry.');
    }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newTitle.trim() || !newSummary.trim()) return;
    try {
      const data = await apiFetch<{ projects: ProjectCase[] }>('/api/admin/projects', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: newTitle.trim(),
          domain: newDomain,
          tier: newTier,
          metricValue: newMetricValue,
          metricLabel: newMetricLabel,
          summary: newSummary.trim(),
        }),
      });
      setProjects(data.projects);
      setNewTitle('');
      setNewSummary('');
      setStatusMessage('Case study added.');
      onContentUpdated();
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : 'Unable to add blueprint.');
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!token) return;
    try {
      const data = await apiFetch<{ projects: ProjectCase[] }>(`/api/admin/projects/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setProjects(data.projects);
      setStatusMessage('Case study removed.');
      onContentUpdated();
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : 'Unable to remove blueprint.');
    }
  };

  const handleImageUpload = (
    file: File | undefined,
    field: 'customLogoDataUrl'
  ) => {
    if (!file || !token) return;
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setStatusMessage('Only PNG, JPEG, or WebP logo files are permitted.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setStatusMessage('Logo upload must be 2MB or smaller.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : null;
      if (!dataUrl) return;
      try {
        const data = await apiFetch<{ brand: BrandSettings }>('/api/admin/brand', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({ [field]: dataUrl }),
        });
        setBrand(data.brand);
        setStatusMessage('Brand asset saved.');
        onContentUpdated();
      } catch (err) {
        setStatusMessage(err instanceof Error ? err.message : 'Unable to save logo.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetAsset = async (field: 'customLogoDataUrl') => {
    if (!token) return;
    try {
      const data = await apiFetch<{ brand: BrandSettings }>('/api/admin/brand', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ [field]: null }),
      });
      setBrand(data.brand);
      setStatusMessage('Restored default asset.');
      onContentUpdated();
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : 'Unable to restore asset.');
    }
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-portal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-[#E5CE93]/25 bg-[#071B20] p-6 sm:p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Admin Console"
          className="absolute right-4 top-4 rounded-lg border border-[#E5CE93]/20 p-2 text-[#F5F2EB] hover:bg-[#0D2B32]"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="border-b border-[#E5CE93]/15 pb-4">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#E5CE93]">
            Executive Administration
          </p>
          <h2
            id="admin-portal-title"
            className="mt-1 font-display text-2xl font-semibold text-[#F5F2EB]"
          >
            Leads, Portfolio & Brand Assets
          </h2>
        </div>

        {!token ? (
          <form onSubmit={handleLogin} className="mx-auto my-8 max-w-sm space-y-4">
            <div className="flex items-center gap-2 text-sm text-[#F5F2EB]/80">
              <Lock className="h-4 w-4 text-[#C8A253]" aria-hidden="true" />
              <span>Enter the server-configured executive passcode to manage leads and brand assets.</span>
            </div>
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Passcode"
              aria-label="Executive passcode"
              autoComplete="current-password"
              className="min-h-[42px] w-full rounded-lg border border-[#E5CE93]/20 bg-[#0D2B32] px-3.5 py-2 text-sm text-[#F5F2EB] focus:border-[#C8A253] focus:outline-none"
            />
            {authError && (
              <p role="alert" className="text-xs text-amber-300">
                {authError}
              </p>
            )}
            <button
              type="submit"
              disabled={authLoading}
              className="w-full min-h-[42px] rounded-lg bg-[#C8A253] px-4 py-2 text-sm font-semibold text-[#071B20] hover:bg-[#E5CE93] disabled:opacity-60"
            >
              {authLoading ? 'Verifying...' : 'Unlock Console'}
            </button>
          </form>
        ) : (
          <div className="mt-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="inline-flex gap-1 rounded-xl border border-[#E5CE93]/15 bg-[#0D2B32] p-1">
                {(
                  [
                    { id: 'leads', label: `Client Leads (${inquiries.length})` },
                    { id: 'projects', label: `Projects (${projects.length})` },
                    { id: 'brand', label: 'Brand Assets & Portrait' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-[#C8A253] text-[#071B20]'
                        : 'text-[#F5F2EB]/75 hover:text-[#F5F2EB]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                {statusMessage && (
                  <span className="text-xs text-[#E5CE93]">{statusMessage}</span>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5CE93]/25 px-3 py-1.5 text-xs font-medium text-[#F5F2EB]/80 hover:border-[#C8A253] hover:text-[#E5CE93]"
                >
                  <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>

            {activeTab === 'leads' && (
              <div className="space-y-3">
                {inquiries.length === 0 ? (
                  <p className="rounded-xl border border-[#E5CE93]/15 bg-[#0D2B32]/60 p-6 text-sm text-[#F5F2EB]/70">
                    No client inquiries logged yet.
                  </p>
                ) : (
                  inquiries.map((inq) => {
                    const emailLabel =
                      inq.emailStatus === 'pending'
                        ? 'Queued'
                        : inq.emailStatus === 'sending'
                          ? 'Sending'
                          : inq.emailStatus === 'sent'
                            ? 'Accepted by Gmail'
                            : inq.emailStatus === 'review'
                              ? 'Needs review'
                              : null;

                    const diagParts: string[] = [];
                    if (typeof inq.emailAttempts === 'number' && inq.emailAttempts > 0) {
                      diagParts.push(`Attempts: ${inq.emailAttempts}`);
                    }
                    if (inq.lastEmailHttpStatus) {
                      diagParts.push(`HTTP ${inq.lastEmailHttpStatus}`);
                    }
                    if (inq.providerMessageId) {
                      diagParts.push(`Gmail ID: ${inq.providerMessageId}`);
                    }
                    if (inq.lastEmailStage) {
                      diagParts.push(inq.lastEmailStage);
                    }

                    return (
                      <div
                        key={inq.id}
                        className="rounded-xl border border-[#E5CE93]/15 bg-[#0D2B32]/85 p-4 text-sm"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-mono text-xs text-[#E5CE93]">
                              {inq.id} · {inq.tier.toUpperCase()} · {inq.timeline}
                            </p>
                            <h3 className="mt-1 font-semibold text-[#F5F2EB]">
                              {inq.name}
                              {inq.company ? ` — ${inq.company}` : ''}
                            </h3>
                            <p className="text-xs text-[#F5F2EB]/65">{inq.email}</p>
                            {(() => {
                              const rawPhone =
                                typeof inq.phone === 'string' ? inq.phone.trim() : '';
                              const telTarget = rawPhone.replace(/[^\d+]/g, '');
                              const hasDialablePhone = Boolean(
                                rawPhone && /^\+?\d+$/.test(telTarget)
                              );
                              return (
                                <p className="mt-0.5 text-xs text-[#F5F2EB]/70">
                                  Contact number:{' '}
                                  {hasDialablePhone ? (
                                    <a
                                      href={`tel:${telTarget}`}
                                      className="font-mono text-[#E5CE93] underline decoration-[#C8A253]/50 underline-offset-2 hover:text-[#F5F2EB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A253]"
                                    >
                                      {rawPhone}
                                    </a>
                                  ) : (
                                    <span>Not provided</span>
                                  )}
                                </p>
                              );
                            })()}
                            {emailLabel && (
                              <p className="mt-1.5 text-xs text-[#DFC585]">
                                Email: <span className="font-semibold">{emailLabel}</span>
                                {diagParts.length > 0 && (
                                  <span className="ml-2 font-mono text-[11px] text-[#F5F2EB]/65">
                                    ({diagParts.join(' · ')})
                                  </span>
                                )}
                              </p>
                            )}
                          </div>

                          <select
                            aria-label={`Status for ${inq.name}`}
                            value={inq.status}
                            onChange={(e) =>
                              handleInquiryUpdate(inq.id, {
                                status: e.target.value as InquiryStatus,
                              })
                            }
                            className="rounded-lg border border-[#E5CE93]/25 bg-[#071B20] px-3 py-1.5 text-xs text-[#E5CE93]"
                          >
                            {STATUS_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>
                        <p className="mt-3 text-xs leading-relaxed text-[#F5F2EB]/80">
                          {inq.message}
                        </p>
                        <div className="mt-3 flex flex-col gap-2 border-t border-[#E5CE93]/10 pt-3 sm:flex-row sm:items-center">
                          <input
                            type="text"
                            aria-label={`Notes for ${inq.id}`}
                            value={noteDrafts[inq.id] ?? inq.notes ?? ''}
                            onChange={(e) =>
                              setNoteDrafts((prev) => ({ ...prev, [inq.id]: e.target.value }))
                            }
                            placeholder="Add verification or triage note..."
                            className="flex-1 rounded-lg border border-[#E5CE93]/20 bg-[#071B20] px-3 py-1.5 text-xs text-[#F5F2EB] placeholder:text-[#F5F2EB]/40 focus:border-[#C8A253] focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              handleInquiryUpdate(inq.id, {
                                notes: noteDrafts[inq.id] ?? inq.notes ?? '',
                              })
                            }
                            className="rounded-lg border border-[#C8A253]/35 bg-[#123846] px-3 py-1.5 text-xs font-medium text-[#F5F2EB] hover:bg-[#194B5C]"
                          >
                            Save Note
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {activeTab === 'projects' && (
              <div className="space-y-6">
                <form
                  onSubmit={handleAddProject}
                  className="grid grid-cols-1 gap-3 rounded-xl border border-[#E5CE93]/15 bg-[#0D2B32]/80 p-4 sm:grid-cols-2"
                >
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Project title"
                    required
                    className="rounded-lg border border-[#E5CE93]/20 bg-[#071B20] px-3 py-2 text-xs text-[#F5F2EB]"
                  />
                  <input
                    type="text"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    placeholder="Domain (e.g. Data Analytics)"
                    className="rounded-lg border border-[#E5CE93]/20 bg-[#071B20] px-3 py-2 text-xs text-[#F5F2EB]"
                  />
                  <input
                    type="text"
                    value={newMetricValue}
                    onChange={(e) => setNewMetricValue(e.target.value)}
                    placeholder="Metric (e.g. -40%)"
                    className="rounded-lg border border-[#E5CE93]/20 bg-[#071B20] px-3 py-2 text-xs text-[#F5F2EB]"
                  />
                  <input
                    type="text"
                    value={newMetricLabel}
                    onChange={(e) => setNewMetricLabel(e.target.value)}
                    placeholder="Metric description"
                    className="rounded-lg border border-[#E5CE93]/20 bg-[#071B20] px-3 py-2 text-xs text-[#F5F2EB]"
                  />
                  <textarea
                    value={newSummary}
                    onChange={(e) => setNewSummary(e.target.value)}
                    placeholder="Project summary..."
                    required
                    rows={2}
                    className="sm:col-span-2 rounded-lg border border-[#E5CE93]/20 bg-[#071B20] px-3 py-2 text-xs text-[#F5F2EB]"
                  />
                  <div className="sm:col-span-2 flex justify-end">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#C8A253] px-4 py-2 text-xs font-semibold text-[#071B20]"
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Add Blueprint</span>
                    </button>
                  </div>
                </form>

                <div className="space-y-3">
                  {projects.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between gap-4 rounded-xl border border-[#E5CE93]/15 bg-[#0D2B32]/70 p-4"
                    >
                      <div>
                        <p className="text-xs text-[#E5CE93]">
                          {p.domain} · {p.metricValue} {p.metricLabel}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-[#F5F2EB]">{p.title}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteProject(p.id)}
                        aria-label={`Delete ${p.title}`}
                        className="rounded-lg border border-[#E5CE93]/15 p-2 text-[#F5F2EB]/70 hover:text-amber-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'brand' && (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="rounded-xl border border-[#E5CE93]/15 bg-[#0D2B32]/85 p-5 space-y-3">
                  <h3 className="font-display text-base font-semibold text-[#F5F2EB]">
                    Original Portrait Asset
                  </h3>
                  <p className="text-xs leading-relaxed text-[#F5F2EB]/70">
                    The public site displays the static original photograph at{" "}
                    <span className="font-mono text-[#E5CE93]">
                      public/assets/images/portrait-pio-languisan.png
                    </span>{" "}
                    with zero filters, cropping, or motion effects.
                  </p>
                </div>

                <div className="rounded-xl border border-[#E5CE93]/15 bg-[#0D2B32]/85 p-5 space-y-3">
                  <h3 className="font-display text-base font-semibold text-[#F5F2EB]">
                    Official PL Monogram Logo
                  </h3>
                  <p className="text-xs leading-relaxed text-[#F5F2EB]/70">
                    Upload your custom PL logo file (PNG, JPEG, or WebP, max 2MB) to override the
                    default circular PL emblem in the navigation bar and footer.
                  </p>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#144B54] px-4 py-2 text-xs font-semibold text-[#F5F2EB] hover:bg-[#195E69]">
                    <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Upload PL Logo</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="sr-only"
                      onChange={(e) =>
                        handleImageUpload(e.target.files?.[0], 'customLogoDataUrl')
                      }
                    />
                  </label>
                  {brand.customLogoDataUrl && (
                    <button
                      type="button"
                      onClick={() => handleResetAsset('customLogoDataUrl')}
                      className="ml-3 text-xs text-[#E5CE93] underline"
                    >
                      Restore Default
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
