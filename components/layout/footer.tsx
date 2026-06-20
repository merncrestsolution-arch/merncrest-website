"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Globe, Mail, MapPin, UserRound } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

const serviceLinks = [
  { href: "/services/software-development", label: "Software Development" },
  { href: "/services/web-development", label: "Web Development" },
  { href: "/services/cloud-services", label: "Cloud Services" },
  { href: "/services/cyber-security", label: "Cyber Security" },
];

const solutionLinks = [
  { href: "/solutions/erp", label: "ERP System" },
  { href: "/solutions/crm", label: "CRM System" },
  { href: "/solutions/healthcare", label: "Hospital Management" },
  { href: "/solutions/pos", label: "POS System" },
];

const companyLinks = [
  { key: "aboutUs", href: "/about" },
  { key: "ourTeam", href: "/team" },
  { key: "careers", href: "/careers" },
  { key: "blog", href: "/blog" },
  { key: "contact", href: "/contact" },
] as const;

const legalLinks = [
  { key: "privacyPolicy", href: "/privacy" },
  { key: "termsOfService", href: "/terms" },
] as const;

const socialLinks = [
  { href: "https://linkedin.com", icon: UserRound, label: "LinkedIn" },
  { href: "https://github.com", icon: Globe, label: "GitHub" },
  { href: "https://merncrest.lk", icon: Globe, label: "Website" },
];

export function Footer() {
  const t = useTranslations("footer");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const response = await fetch("https://formsubmit.co/ajax/merncrestsolution@gmail.com", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ 
          email: email,
          _subject: "New Newsletter Subscriber!"
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ text: "Subscribed successfully!", type: "success" });
        setEmail("");
      } else {
        setMessage({ text: data.error || "Failed to subscribe.", type: "error" });
      }
    } catch (error) {
      setMessage({ text: "An error occurred. Please try again.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bg-primary border-t border-white/10">
      <div className="container-wide section-padding pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-block">
              <span className="font-display text-2xl font-bold gradient-text">
                MERNcrest
              </span>
            </Link>
            <p className="text-sm text-muted max-w-sm">{t("tagline")}</p>
            <p className="text-sm text-muted max-w-sm leading-relaxed">
              {t("description")}
            </p>
            <div className="flex items-center gap-3 pt-2">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-muted-foreground hover:text-accent hover:border-accent/50 transition-colors"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
            <div className="space-y-2 pt-2 text-sm text-muted">
              <a
                href="mailto:merncrestsolution@gmail.com"
                className="flex items-center gap-2 hover:text-foreground transition-colors"
              >
                <Mail className="h-4 w-4" />
                merncrestsolution@gmail.com
              </a>
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0" />
                87/B Galle Road Kollupity, Colombo 003, Sri Lanka
              </p>
              <a
                href="tel:+94713838638"
                className="flex items-center gap-2 hover:text-foreground transition-colors"
              >
                <Globe className="h-4 w-4 shrink-0" />
                +94 713838638
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">{t("services")}</h3>
            <ul className="space-y-2">
              {serviceLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Solutions */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">{t("solutions")}</h3>
            <ul className="space-y-2">
              {solutionLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company + Legal */}
          <div className="space-y-8">
            <div>
              <h3 className="font-semibold text-foreground mb-4">{t("company")}</h3>
              <ul className="space-y-2">
                {companyLinks.map((link) => (
                  <li key={link.key}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted hover:text-foreground transition-colors"
                    >
                      {t(link.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-4">{t("legal")}</h3>
              <ul className="space-y-2">
                {legalLinks.map((link) => (
                  <li key={link.key}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted hover:text-foreground transition-colors"
                    >
                      {t(link.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Newsletter */}
        <div className="mt-12 glass-card p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="font-semibold text-foreground">{t("newsletterTitle")}</h3>
              <p className="text-sm text-muted mt-1">
                Get insights on software, cloud, and digital transformation.
              </p>
            </div>
            <div className="flex flex-col w-full md:w-auto">
              <form className="flex flex-col sm:flex-row gap-3 w-full" onSubmit={handleSubscribe}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("newsletterPlaceholder")}
                  required
                  disabled={loading}
                  className="flex-1 w-full sm:w-auto md:w-64 rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent text-foreground disabled:opacity-50"
                />
                <Button type="submit" disabled={loading} className="w-full sm:w-auto py-2.5 h-auto">
                  {loading ? "Subscribing..." : t("newsletterButton")}
                </Button>
              </form>
              {message.text && (
                <p className={`text-xs mt-2 ${message.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                  {message.text}
                </p>
              )}
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted">
          <p>{t("copyright")}</p>
          <p className="font-mono text-xs">merncrest.lk</p>
        </div>
      </div>
    </footer>
  );
}
