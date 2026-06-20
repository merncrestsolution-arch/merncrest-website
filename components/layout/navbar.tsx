"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Menu, ChevronDown, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ThemeToggle } from "./theme-toggle";
import { LanguageSwitcher } from "./language-switcher";
import { navLinks, serviceMenuItems } from "@/lib/navigation";
import Image from "next/image";

export function Navbar() {
  const t = useTranslations("nav");
  const tServices = useTranslations("servicesMenu");
  const [scrolled, setScrolled] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-black/80 backdrop-blur-lg border-b border-white/10 shadow-lg"
          : "bg-transparent"
      )}
    >
      <nav className="container-wide mx-auto flex h-24 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          {/* Light Mode Logo */}
          <Image 
            src="/logo.png.svg" 
            alt="MERNcrest Solutions" 
            width={180} 
            height={50} 
            className="h-16 sm:h-20 w-auto object-contain group-hover:scale-105 transition-transform duration-300 dark:hidden"
            priority
          />
          {/* Dark Mode Logo */}
          <Image 
            src="/logo-dark.svg.svg" 
            alt="MERNcrest Solutions" 
            width={180} 
            height={50} 
            className="h-16 sm:h-20 w-auto object-contain group-hover:scale-105 transition-transform duration-300 hidden dark:block"
            priority
          />
        </Link>

        {/* Desktop Nav */}
        <div className="hidden xl:flex items-center gap-1">
          {navLinks.slice(0, 1).map((link) => (
            <Link
              key={link.key}
              href={link.href}
              className="px-3 py-2 text-sm text-muted hover:text-foreground transition-colors"
            >
              {t(link.key)}
            </Link>
          ))}

          <Link
            href="/about"
            className="px-3 py-2 text-sm text-muted hover:text-foreground transition-colors"
          >
            {t("about")}
          </Link>

          {/* Services Mega Menu */}
          <div
            className="relative"
            onMouseEnter={() => setServicesOpen(true)}
            onMouseLeave={() => setServicesOpen(false)}
          >
            <button
              className="flex items-center gap-1 px-3 py-2 text-sm text-muted hover:text-foreground transition-colors"
              aria-expanded={servicesOpen}
            >
              {t("services")}
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  servicesOpen && "rotate-180"
                )}
              />
            </button>

            {servicesOpen && (
              <div className="absolute left-1/2 top-full -translate-x-1/2 pt-2">
                <div className="w-[720px] rounded-xl border border-white/10 bg-surface/95 backdrop-blur-xl p-6 shadow-glow-lg">
                  <div className="grid grid-cols-3 gap-4">
                    {serviceMenuItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.key}
                          href={item.href}
                          className="group flex gap-3 rounded-lg p-3 hover:bg-white/5 transition-colors"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent group-hover:bg-accent/20">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {tServices(`${item.key}.title`)}
                            </p>
                            <p className="text-xs text-muted mt-0.5 line-clamp-2">
                              {tServices(`${item.key}.description`)}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <Link
                      href="/services"
                      className="flex items-center gap-2 text-sm font-medium text-accent hover:text-accent-alt transition-colors"
                    >
                      {t("viewAllServices")}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {navLinks.slice(2).map((link) => (
            <Link
              key={link.key}
              href={link.href}
              className="px-3 py-2 text-sm text-muted hover:text-foreground transition-colors"
            >
              {t(link.key)}
            </Link>
          ))}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>
          <ThemeToggle />
          <Button asChild className="hidden md:inline-flex" size="sm">
            <Link href="/contact">{t("getConsultation")}</Link>
          </Button>

          {/* Mobile Menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="xl:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="overflow-y-auto bg-background/90 backdrop-blur-2xl border-l border-white/10 w-[85vw] sm:w-[400px]">
              <SheetHeader className="pb-4 border-b border-white/10">
                <SheetTitle className="text-left">
                  <span className="gradient-text font-display text-2xl font-bold tracking-tight">
                    MERNcrest
                  </span>
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-2">
                <Link
                  href="/"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center rounded-xl px-4 py-3.5 text-base font-medium text-muted hover:text-foreground hover:bg-white/5 transition-colors"
                >
                  {t("home")}
                </Link>
                <Link
                  href="/about"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center rounded-xl px-4 py-3.5 text-base font-medium text-muted hover:text-foreground hover:bg-white/5 transition-colors"
                >
                  {t("about")}
                </Link>

                <button
                  onClick={() => setMobileServicesOpen(!mobileServicesOpen)}
                  className="flex items-center justify-between rounded-xl px-4 py-3.5 text-base font-medium text-muted hover:text-foreground hover:bg-white/5 transition-colors w-full"
                >
                  {t("services")}
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      mobileServicesOpen && "rotate-180"
                    )}
                  />
                </button>
                {mobileServicesOpen && (
                  <div className="ml-4 flex flex-col gap-1 border-l-2 border-accent/20 pl-4 py-2 mt-1 mb-2">
                    {serviceMenuItems.map((item) => (
                      <Link
                        key={item.key}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className="rounded-lg px-4 py-3 text-sm text-muted hover:text-foreground hover:bg-white/5 transition-colors"
                      >
                        {tServices(`${item.key}.title`)}
                      </Link>
                    ))}
                    <Link
                      href="/services"
                      onClick={() => setMobileOpen(false)}
                      className="rounded-lg px-4 py-3 text-sm font-medium text-accent hover:text-accent-alt transition-colors inline-flex items-center gap-2"
                    >
                      {t("viewAllServices")} →
                    </Link>
                  </div>
                )}

                {navLinks.slice(2).map((link) => (
                  <Link
                    key={link.key}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center rounded-xl px-4 py-3.5 text-base font-medium text-muted hover:text-foreground hover:bg-white/5 transition-colors"
                  >
                    {t(link.key)}
                  </Link>
                ))}

                <div className="mt-6 px-4 pt-6 border-t border-white/10 flex items-center justify-between">
                  <span className="text-sm text-muted">{t("language") || "Language"}</span>
                  <LanguageSwitcher />
                </div>
                <div className="mt-6 px-4 pb-8">
                  <Button asChild className="w-full">
                    <Link href="/contact" onClick={() => setMobileOpen(false)}>
                      {t("getConsultation")}
                    </Link>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
