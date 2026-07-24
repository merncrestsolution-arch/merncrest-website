"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  Menu,
  ChevronDown,
  ChevronRight,
  X,
  Phone,
  Layers,
  BookOpen,
  Boxes,
  Building2,
  BadgeDollarSign,
  Images,
  LifeBuoy,
  Mail,
  Info,
  Newspaper,
  Download,
  Briefcase,
  Handshake,
  Globe2,
  HardDrive,
  Palette,
  CloudCog,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { navLinks, productMenuItems, resourceLinks } from "@/lib/navigation";
import Image from "next/image";

const SCROLL_DELTA = 8;
const TOP_REVEAL = 24;

const exploreIcons: Record<string, ComponentType<{ className?: string }>> = {
  services: Layers,
  solutions: Boxes,
  products: Boxes,
  industries: Building2,
  pricing: BadgeDollarSign,
  priceBook: BookOpen,
  portfolio: Images,
  support: LifeBuoy,
  contact: Mail,
};

const resourceIcons: Record<string, ComponentType<{ className?: string }>> = {
  about: Info,
  knowledgeBase: BookOpen,
  blog: Newspaper,
  downloads: Download,
  careers: Briefcase,
  partners: Handshake,
};

const productIcons: Record<string, ComponentType<{ className?: string }>> = {
  domains: Globe2,
  hosting: HardDrive,
  software: Boxes,
  digital: Palette,
  cloud: CloudCog,
  security: ShieldCheck,
  email: Mail,
};

export function Navbar() {
  const t = useTranslations("nav");
  const tProducts = useTranslations("productsMenu");
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false);
  const lastY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    lastY.current = window.scrollY;

    const update = () => {
      const y = window.scrollY;
      const delta = y - lastY.current;

      setScrolled(y > 12);

      if (mobileOpen || productsOpen || resourcesOpen || y < TOP_REVEAL) {
        setHidden(false);
      } else if (Math.abs(delta) > SCROLL_DELTA) {
        setHidden(delta > 0);
      }

      lastY.current = y;
      ticking.current = false;
    };

    const onScroll = () => {
      if (!ticking.current) {
        ticking.current = true;
        window.requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [mobileOpen, productsOpen, resourcesOpen]);

  const closeMobile = () => setMobileOpen(false);

  const exploreLinks = navLinks.filter(
    (l) => !["support", "contact"].includes(l.key)
  );
  const supportLinks = navLinks.filter((l) =>
    ["support", "contact"].includes(l.key)
  );

  return (
    <div
      className={cn(
        "fixed inset-x-0 top-0 z-[100] will-change-transform",
        "transition-[transform,opacity] duration-300 ease-out",
        hidden ? "-translate-y-full opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
      )}
    >
      <div
        className="text-center text-xs sm:text-sm py-1.5 px-4 border-b"
        style={{
          background: "var(--stitch-nav-banner)",
          color: "var(--stitch-nav-banner-text)",
          borderColor: "var(--stitch-hairline)",
        }}
      >
        Emergency support:{" "}
        <a href="tel:+94713838638" className="underline underline-offset-2 hover:opacity-80">
          +94 713 838 638
        </a>
        {" · "}
        <Link href="/support" className="underline underline-offset-2 hover:opacity-80">
          Support Center
        </Link>
      </div>

      <header
        className={cn(
          "relative z-[100] overflow-visible transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300 ease-out border-b",
          scrolled || productsOpen || resourcesOpen
            ? "backdrop-blur-xl shadow-[0_8px_30px_var(--stitch-glow)]"
            : "bg-transparent shadow-none"
        )}
        style={{
          background:
            scrolled || productsOpen || resourcesOpen
              ? "var(--stitch-nav-scrolled)"
              : "transparent",
          borderColor:
            scrolled || productsOpen || resourcesOpen
              ? "var(--stitch-hairline)"
              : "transparent",
        }}
      >
        <nav className="container-wide relative z-[100] mx-auto flex h-16 sm:h-20 items-center justify-between overflow-visible px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <Image
              src="/logo-merncrest.png"
              alt="MernCrest Solutions — Your Technology Partner"
              width={200}
              height={200}
              className="h-12 sm:h-14 md:h-16 w-auto object-contain transition-transform duration-300 group-hover:scale-[1.03]"
              priority
            />
          </Link>

          <div className="hidden xl:flex items-center gap-0.5">
            <div
              className="relative"
              onMouseEnter={() => setProductsOpen(true)}
              onMouseLeave={() => setProductsOpen(false)}
            >
              <button className="flex items-center gap-1 px-3 py-2 text-sm text-muted hover:text-foreground transition-colors">
                {t("products")}
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    productsOpen && "rotate-180"
                  )}
                />
              </button>
              {productsOpen && (
                <div className="absolute left-0 top-full z-[110] pt-2 animate-in fade-in-0 zoom-in-95 duration-150">
                  <div className="w-[520px] rounded-xl border border-stitch-outline bg-stitch-surface p-5 shadow-xl grid grid-cols-2 gap-2">
                    {productMenuItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.key}
                          href={item.href}
                          className="flex gap-3 rounded-lg p-3 hover:bg-glass transition-colors"
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {tProducts(`${item.key}.title`)}
                            </p>
                            <p className="text-xs text-muted line-clamp-1">
                              {tProducts(`${item.key}.description`)}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {navLinks
              .filter((l) => l.key !== "products")
              .map((link) => (
                <Link
                  key={link.key}
                  href={link.href}
                  className="px-3 py-2 text-sm text-muted hover:text-foreground transition-colors"
                >
                  {t(link.key)}
                </Link>
              ))}

            <div
              className="relative"
              onMouseEnter={() => setResourcesOpen(true)}
              onMouseLeave={() => setResourcesOpen(false)}
            >
              <button className="flex items-center gap-1 px-3 py-2 text-sm text-muted hover:text-foreground transition-colors">
                {t("resources")}
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    resourcesOpen && "rotate-180"
                  )}
                />
              </button>
              {resourcesOpen && (
                <div className="absolute right-0 top-full z-[110] pt-2 animate-in fade-in-0 zoom-in-95 duration-150">
                  <div className="w-56 rounded-xl border border-stitch-outline bg-stitch-surface p-2 shadow-xl">
                    {resourceLinks.map((link) => (
                      <Link
                        key={link.key}
                        href={link.href}
                        className="block rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-glass transition-colors"
                      >
                        {t(link.key)}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
              <Link href="/login">{t("login")}</Link>
            </Button>
            <Button asChild className="hidden md:inline-flex rounded-full shadow-glow" size="sm">
              <Link href="/contact">{t("getConsultation")}</Link>
            </Button>

            {/* Stitch mobile drawer — Lumina Enterprise / rose accent */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="xl:hidden h-11 w-11 rounded-full"
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                hideClose
                className="flex w-[min(100vw,390px)] flex-col gap-0 border-l border-slate-100 bg-white p-0 sm:max-w-[390px]"
              >
                <SheetHeader className="space-y-0 border-b border-slate-100 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <SheetTitle className="flex items-center gap-2 text-left">
                      <Image
                        src="/logo-merncrest.png"
                        alt="MernCrest"
                        width={140}
                        height={40}
                        className="h-9 w-auto object-contain"
                      />
                    </SheetTitle>
                    <button
                      type="button"
                      onClick={closeMobile}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-100 bg-slate-50 text-slate-700 transition active:scale-95"
                      aria-label="Close menu"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </SheetHeader>

                <a
                  href="tel:+94713838638"
                  className="flex items-center justify-center gap-2 border-b border-rose-100 bg-rose-50 px-4 py-2.5 text-[13px] font-medium text-rose-700"
                >
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  Emergency: +94 713 838 638
                </a>

                <div className="space-y-2 border-b border-slate-100 px-4 py-4">
                  <Button
                    asChild
                    className="h-12 w-full rounded-full bg-rose-600 text-[15px] font-semibold hover:bg-rose-700"
                  >
                    <Link href="/contact" onClick={closeMobile}>
                      {t("getConsultation")}
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="h-12 w-full rounded-full border-slate-200 text-[15px] font-semibold"
                  >
                    <Link href="/login" onClick={closeMobile}>
                      {t("login")}
                    </Link>
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-4">
                  <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                    Explore
                  </p>
                  <div className="mb-5 space-y-0.5">
                    {exploreLinks.map((link) => {
                      if (link.key === "products") {
                        return (
                          <div key={link.key}>
                            <button
                              type="button"
                              onClick={() => setMobileProductsOpen((v) => !v)}
                              className="flex min-h-12 w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition active:bg-slate-50"
                            >
                              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                                <Boxes className="h-4 w-4" />
                              </span>
                              <span className="flex-1 text-[15px] font-medium text-slate-900">
                                {t("products")}
                              </span>
                              <ChevronDown
                                className={cn(
                                  "h-4 w-4 text-slate-400 transition-transform",
                                  mobileProductsOpen && "rotate-180"
                                )}
                              />
                            </button>
                            {mobileProductsOpen && (
                              <div className="mb-1 ml-4 space-y-0.5 border-l border-slate-100 pl-3">
                                {productMenuItems.map((item) => {
                                  const Icon = productIcons[item.key] || Boxes;
                                  return (
                                    <Link
                                      key={item.key}
                                      href={item.href}
                                      onClick={closeMobile}
                                      className="flex min-h-11 items-center gap-3 rounded-xl px-2 py-1.5 transition active:bg-slate-50"
                                    >
                                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-50/80 text-rose-600">
                                        <Icon className="h-3.5 w-3.5" />
                                      </span>
                                      <span className="flex-1 text-[14px] font-medium text-slate-800">
                                        {tProducts(`${item.key}.title`)}
                                      </span>
                                      <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                                    </Link>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      }
                      const Icon = exploreIcons[link.key] || Layers;
                      return (
                        <Link
                          key={link.key}
                          href={link.href}
                          onClick={closeMobile}
                          className="flex min-h-12 items-center gap-3 rounded-xl px-2 py-2 transition active:bg-slate-50"
                        >
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="flex-1 text-[15px] font-medium text-slate-900">
                            {t(link.key)}
                          </span>
                          <ChevronRight className="h-4 w-4 text-slate-300" />
                        </Link>
                      );
                    })}
                  </div>

                  <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                    Support
                  </p>
                  <div className="mb-5 space-y-0.5">
                    {supportLinks.map((link) => {
                      const Icon = exploreIcons[link.key] || LifeBuoy;
                      return (
                        <Link
                          key={link.key}
                          href={link.href}
                          onClick={closeMobile}
                          className="flex min-h-12 items-center gap-3 rounded-xl px-2 py-2 transition active:bg-slate-50"
                        >
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="flex-1 text-[15px] font-medium text-slate-900">
                            {t(link.key)}
                          </span>
                          <ChevronRight className="h-4 w-4 text-slate-300" />
                        </Link>
                      );
                    })}
                  </div>

                  <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                    Company
                  </p>
                  <div className="space-y-0.5">
                    {resourceLinks.map((link) => {
                      const Icon = resourceIcons[link.key] || Info;
                      return (
                        <Link
                          key={link.key}
                          href={link.href}
                          onClick={closeMobile}
                          className="flex min-h-12 items-center gap-3 rounded-xl px-2 py-2 transition active:bg-slate-50"
                        >
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="flex-1 text-[15px] font-medium text-slate-900">
                            {t(link.key)}
                          </span>
                          <ChevronRight className="h-4 w-4 text-slate-300" />
                        </Link>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-[12px] text-slate-400">
                  <span>Your Technology Partner</span>
                  <span className="font-medium tracking-wide text-slate-500">EN</span>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </header>
    </div>
  );
}
