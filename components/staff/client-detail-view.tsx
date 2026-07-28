"use client";

import { useCallback, useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import {
  Briefcase,
  FileText,
  FolderOpen,
  Globe2,
  Server,
  Wallet,
} from "lucide-react";
import { formatMoney } from "@/lib/commerce-format";
import { formatSriLankaDate, formatSriLankaDateTime } from "@/lib/timezone";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/system/empty-state";
import { LoadingState } from "@/components/system/loading-state";
import { ErrorState } from "@/components/system/error-state";

type ClientDetail = {
  id: string;
  customerCode?: string | null;
  fullName: string;
  company?: string | null;
  email: string;
  profile: {
    phone?: string | null;
    whatsapp?: string | null;
    address?: string | null;
    city?: string | null;
    province?: string | null;
    country?: string | null;
    companyWebsite?: string | null;
    industry?: string | null;
    notes?: string | null;
    customerRating?: string | null;
  } | null;
  stats: {
    activeProjects: number;
    totalRevenueCents: number;
    collectedCents?: number;
    outstandingBalanceCents: number;
    invoiceCount: number;
    serviceCount: number;
  };
  projects: Array<{
    id: string;
    projectCode: string;
    name: string;
    status: string;
    startDate?: string | null;
    endDate?: string | null;
    taskCount: number;
    milestoneCount: number;
  }>;
  services: Array<{
    id: string;
    type: "domain" | "hosting" | "subscription";
    label: string;
    status: string;
    renewsAt?: string | null;
  }>;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    status: string;
    totalCents: number;
    paidCents: number;
    remainingBalanceCents?: number;
    dueAt?: string | null;
    createdAt: string;
  }>;
  payments: Array<{
    id: string;
    amountCents: number;
    method: string;
    reference?: string | null;
    status: string;
    createdAt: string;
  }>;
  documents: Array<{
    id: string;
    docNumber: string;
    title: string;
    category: string;
    status: string;
    fileUrl?: string | null;
    createdAt: string;
  }>;
  contacts: Array<{
    id: string;
    name: string;
    role?: string | null;
    email?: string | null;
    phone?: string | null;
    isPrimary: boolean;
  }>;
};

function statusVariant(status: string): "success" | "warning" | "destructive" | "secondary" {
  const s = status.toUpperCase();
  if (["ACTIVE", "PAID", "SUCCEEDED", "COMPLETED"].includes(s)) return "success";
  if (["PENDING", "SENT", "PARTIALLY_PAID", "PLANNING", "OVERDUE"].includes(s)) return "warning";
  if (["EXPIRED", "CANCELLED", "VOID", "FAILED", "SUSPENDED"].includes(s)) return "destructive";
  return "secondary";
}

function serviceIcon(type: string) {
  if (type === "domain") return Globe2;
  if (type === "hosting") return Server;
  return Briefcase;
}

export function ClientDetailView({ clientId }: { clientId: string }) {
  const [data, setData] = useState<ClientDetail | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    fetch(`/api/staff/clients/${clientId}`)
      .then(async (r) => {
        const text = await r.text();
        if (!text) throw new Error("Empty response from server");
        const d = JSON.parse(text);
        if (!d.success) throw new Error(d.error?.message ?? "Failed to load client");
        setData(d.data);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <ErrorState message="Client not found" />;

  const displayName = data.company || data.fullName;

  return (
    <div>
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/staff">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/staff/clients">Clients</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{displayName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="stitch-page-title">{displayName}</h1>
          <p className="stitch-page-sub !mb-0">
            {data.customerCode ?? data.email}
            {data.profile?.customerRating ? ` · ${data.profile.customerRating}` : ""}
          </p>
        </div>
        <Badge variant={statusVariant("ACTIVE")}>Active</Badge>
      </div>

      <div className="stitch-kpi-grid !grid-cols-2 lg:!grid-cols-5 mb-6">
        <div className="stitch-kpi-card">
          <div className="stitch-kpi-value">{data.stats.activeProjects}</div>
          <div className="stitch-kpi-label">Active Projects</div>
        </div>
        <div className="stitch-kpi-card">
          <div className="stitch-kpi-value text-lg">{formatMoney(data.stats.totalRevenueCents)}</div>
          <div className="stitch-kpi-label">Contract value</div>
        </div>
        <div className="stitch-kpi-card">
          <div className="stitch-kpi-value text-lg">
            {formatMoney(data.stats.collectedCents ?? 0)}
          </div>
          <div className="stitch-kpi-label">Collected</div>
        </div>
        <div className="stitch-kpi-card">
          <div className="stitch-kpi-value text-lg text-amber-500">
            {formatMoney(data.stats.outstandingBalanceCents)}
          </div>
          <div className="stitch-kpi-label">Outstanding balance</div>
        </div>
        <div className="stitch-kpi-card">
          <div className="stitch-kpi-value">{data.stats.serviceCount}</div>
          <div className="stitch-kpi-label">Services</div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full flex-wrap h-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects ({data.projects.length})</TabsTrigger>
          <TabsTrigger value="services">Services ({data.services.length})</TabsTrigger>
          <TabsTrigger value="billing">
            Invoices & Payments ({data.invoices.length})
          </TabsTrigger>
          <TabsTrigger value="documents">Documents ({data.documents.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Client Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-[var(--sp-muted)]">Contact</span>
                  <span>{data.fullName}</span>
                  <span className="text-[var(--sp-muted)]">Email</span>
                  <span>{data.email}</span>
                  <span className="text-[var(--sp-muted)]">Phone</span>
                  <span>{data.profile?.phone ?? "—"}</span>
                  <span className="text-[var(--sp-muted)]">WhatsApp</span>
                  <span>{data.profile?.whatsapp ?? "—"}</span>
                  <span className="text-[var(--sp-muted)]">Industry</span>
                  <span>{data.profile?.industry ?? "—"}</span>
                  <span className="text-[var(--sp-muted)]">Website</span>
                  <span>{data.profile?.companyWebsite ?? "—"}</span>
                </div>
                {data.profile?.address ? (
                  <p className="text-[var(--sp-muted)] pt-2 border-t border-[var(--sp-border)]">
                    {data.profile.address}
                    {data.profile.city ? `, ${data.profile.city}` : ""}
                    {data.profile.province ? `, ${data.profile.province}` : ""}
                    {data.profile.country ? `, ${data.profile.country}` : ""}
                  </p>
                ) : null}
                {data.profile?.notes ? (
                  <p className="text-sm pt-2 border-t border-[var(--sp-border)]">{data.profile.notes}</p>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contacts</CardTitle>
              </CardHeader>
              <CardContent>
                {data.contacts.length === 0 ? (
                  <EmptyState
                    title="No additional contacts"
                    description="Primary contact is the account holder."
                  />
                ) : (
                  <ul className="space-y-3">
                    {data.contacts.map((c) => (
                      <li key={c.id} className="flex items-start justify-between gap-2 text-sm">
                        <div>
                          <strong>{c.name}</strong>
                          {c.isPrimary ? (
                            <Badge variant="default" className="ml-2">Primary</Badge>
                          ) : null}
                          <p className="text-[var(--sp-muted)] text-xs mt-0.5">
                            {c.role ?? "Contact"}
                            {c.email ? ` · ${c.email}` : ""}
                            {c.phone ? ` · ${c.phone}` : ""}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="projects">
          {data.projects.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="No projects yet"
              description="This client has no linked delivery projects. Services and billing are still available."
            />
          ) : (
            <div className="space-y-3">
              {data.projects.map((p) => (
                <Card key={p.id}>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-5">
                    <div>
                      <Link
                        href={`/staff/projects/${p.id}`}
                        className="font-medium text-violet-400 hover:underline"
                      >
                        {p.name}
                      </Link>
                      <p className="text-xs text-[var(--sp-muted)] mt-1 font-mono">{p.projectCode}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusVariant(p.status)}>{p.status}</Badge>
                      <span className="text-xs text-[var(--sp-muted)]">
                        {p.taskCount} tasks · {p.milestoneCount} milestones
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="services">
          {data.services.length === 0 ? (
            <EmptyState
              icon={Server}
              title="No services"
              description="No domains, hosting, or subscriptions linked to this client."
            />
          ) : (
            <section className="stitch-section-card">
              <div className="stitch-section-body overflow-x-auto !p-0">
                <table className="stitch-table">
                  <thead>
                    <tr>
                      <th>Service</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Renewal / Expiry</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.services.map((s) => {
                      const Icon = serviceIcon(s.type);
                      const href =
                        s.type === "domain"
                          ? `/staff/domains/${s.id}`
                          : s.type === "hosting"
                            ? `/staff/hosting/${s.id}`
                            : null;
                      return (
                        <tr key={`${s.type}-${s.id}`}>
                          <td>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-[var(--sp-muted)]" />
                              {href ? (
                                <Link href={href} className="hover:text-violet-400">
                                  {s.label}
                                </Link>
                              ) : (
                                s.label
                              )}
                            </div>
                          </td>
                          <td className="capitalize">{s.type}</td>
                          <td>
                            <Badge variant={statusVariant(s.status)}>{s.status}</Badge>
                          </td>
                          <td>{formatSriLankaDate(s.renewsAt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </TabsContent>

        <TabsContent value="billing">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Invoice History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.invoices.length === 0 ? (
                  <EmptyState title="No invoices" description="No invoices on record for this client." />
                ) : (
                  <ul className="space-y-2">
                    {data.invoices.map((inv) => (
                      <li
                        key={inv.id}
                        className="flex items-center justify-between gap-2 text-sm border-b border-[var(--sp-border)] pb-2 last:border-0"
                      >
                        <div>
                          <Link
                            href={`/staff/billing?invoice=${inv.id}`}
                            className="font-medium hover:text-violet-400"
                          >
                            {inv.invoiceNumber}
                          </Link>
                          <p className="text-xs text-[var(--sp-muted)]">
                            Due {formatSriLankaDate(inv.dueAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-medium">{formatMoney(inv.totalCents)}</span>
                          {(inv.remainingBalanceCents ?? 0) > 0 ? (
                            <p className="text-xs text-amber-600 font-medium">
                              Due {formatMoney(inv.remainingBalanceCents ?? 0)}
                            </p>
                          ) : null}
                          <Badge variant={statusVariant(inv.status)} className="ml-2">
                            {inv.status}
                          </Badge>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Payment History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.payments.length === 0 ? (
                  <EmptyState title="No payments" description="No payment records for this client." />
                ) : (
                  <ul className="space-y-2">
                    {data.payments.map((p) => (
                      <li
                        key={p.id}
                        className="flex items-center justify-between gap-2 text-sm border-b border-[var(--sp-border)] pb-2 last:border-0"
                      >
                        <div>
                          <span className="font-medium">{formatMoney(p.amountCents)}</span>
                          <p className="text-xs text-[var(--sp-muted)]">
                            {p.method}
                            {p.reference ? ` · ${p.reference}` : ""}
                          </p>
                        </div>
                        <div className="text-right text-xs text-[var(--sp-muted)]">
                          {formatSriLankaDateTime(p.createdAt)}
                          <Badge variant={statusVariant(p.status)} className="ml-2">
                            {p.status}
                          </Badge>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="documents">
          {data.documents.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title="No documents"
              description="Upload contracts and files from the Documents module and link them to this client."
            />
          ) : (
            <section className="stitch-section-card">
              <div className="stitch-section-body overflow-x-auto !p-0">
                <table className="stitch-table">
                  <thead>
                    <tr>
                      <th>Document</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.documents.map((doc) => (
                      <tr key={doc.id}>
                        <td>
                          {doc.fileUrl ? (
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-violet-400 hover:underline"
                            >
                              {doc.title}
                            </a>
                          ) : (
                            doc.title
                          )}
                          <span className="text-xs text-[var(--sp-muted)] block font-mono">
                            {doc.docNumber}
                          </span>
                        </td>
                        <td>{doc.category}</td>
                        <td>
                          <Badge variant={statusVariant(doc.status)}>{doc.status}</Badge>
                        </td>
                        <td>{formatSriLankaDate(doc.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
