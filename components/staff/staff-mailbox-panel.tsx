"use client";

import { ExternalLink, Mail } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const MAIL_ADMIN_URL =
  process.env.NEXT_PUBLIC_MAIL_ADMIN_URL?.trim() || "/mail-platform";

export function StaffMailboxPanel() {
  const isExternal = MAIL_ADMIN_URL.startsWith("http");

  return (
    <div>
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/staff">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Mailbox</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-5">
        <h1 className="stitch-page-title">Business email</h1>
        <p className="stitch-page-sub !mb-0">
          MernCrest mail platform — mailbox provisioning, aliases, and delivery management.
        </p>
      </div>

      <section className="stitch-section-card max-w-2xl">
        <div className="stitch-section-body text-center py-10 px-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-violet-500/10 text-violet-500 mb-4">
            <Mail className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-semibold mb-2">Mail platform integration</h2>
          <p className="text-sm text-[var(--sp-muted)] max-w-md mx-auto mb-6">
            Staff mailbox administration runs on the dedicated MernCrest mail platform
            (Postfix, Dovecot, Roundcube). Use the admin console to manage domains, mailboxes,
            distribution groups, and HR onboarding mail flows.
          </p>
          <a
            href={MAIL_ADMIN_URL}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
            className="stitch-btn-primary-sm inline-flex"
          >
            Open mail admin
            <ExternalLink className="h-4 w-4" />
          </a>
          <p className="text-xs text-[var(--sp-muted)] mt-4">
            Configure <code className="font-mono">NEXT_PUBLIC_MAIL_ADMIN_URL</code> to point at your
            deployed mail admin UI.
          </p>
        </div>
      </section>
    </div>
  );
}
