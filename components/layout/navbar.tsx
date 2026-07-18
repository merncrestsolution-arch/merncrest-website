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
import { navLinks, productMenuItems, serviceMenuItems } from "@/lib/navigation";
import Image from "next/image";

export function Navbar() {
  const t = useTranslations("nav");
  const tProducts = useTranslations("productsMenu");
  const tServices = useTranslations("servicesMenu");
  const [scrolled, setScrolled] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-[#061018]/85 backdrop-blur-xl border-b border-white/10 shadow-lg"
          : "bg-transparent"
      )}
    >
      <nav className="container-wide mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <Image
            src="/logo.png.svg"
            alt="MernCrest Solutions"
            width={160}
            height={44}
            className="h-12 sm:h-14 w-auto object-contain group-hover:scale-105 transition-transform duration-300 dark:hidden"
            priority
          />
          <Image
            src="/logo-dark.svg.svg"
            alt="MernCrest Solutions"
            width={160}
            height={44}
            className="h-12 sm:h-14 w-auto object-contain group-hover:scale-105 transition-transform duration-300 hidden dark:block"
            priority
          />
        </Link>

        <div className="hidden xl:flex items-center gap-0.5">
          <div
            className="relative"
            onMouseEnter={() => setProductsOpen(true)}
            onMouseLeave={() => setProductsOpen(false)}
          >
            <button
              className="flex items-center gap-1 px-3 py-2 text-sm text-muted hover:text-foreground transition-colors"
              aria-expanded={productsOpen}
            >
              {t("products")}
              <ChevronDown className={cn("h-4 w-4 transition-transform", productsOpen && "rotate-180")} />
            </button>

            {productsOpen && (
              <div className="absolute left-0 top-full pt-2">
                <div className="w-[560px] rounded-xl border border-white/10 bg-surface/95 backdrop-blur-xl p-5 shadow-glow-lg">
                  <div className="grid grid-cols-2 gap-2">
                    {productMenuItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.key}
                          href={item.href}
                          className="group flex gap-3 rounded-lg p-3 hover:bg-white/5 transition-colors"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent group-hover:bg-accent/20">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {tProducts(`${item.key}.title`)}
                            </p>
                            <p className="text-xs text-muted mt-0.5 line-clamp-1">
                              {tProducts(`${item.key}.description`)}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/10 flex gap-4">
                    <Link href="/products" className="flex items-center gap-2 text-sm font-medium text-accent hover:opacity-80">
                      {t("viewAllProducts")} <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link href="/services" className="text-sm text-muted hover:text-foreground">
                      {t("services")}
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {navLinks.slice(1).map((link) => (
            <Link
              key={link.key}
              href={link.href}
              className="px-3 py-2 text-sm text-muted hover:text-foreground transition-colors"
            >
              {t(link.key)}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
            <Link href="/login">{t("login")}</Link>
          </Button>
          <Button asChild className="hidden md:inline-flex" size="sm">
            <Link href="/register">{t("getStarted")}</Link>
          </Button>

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
                    MernCrest
                  </span>
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-1">
                <button
                  onClick={() => setMobileProductsOpen(!mobileProductsOpen)}
                  className="flex items-center justify-between rounded-xl px-4 py-3.5 text-base font-medium text-muted hover:text-foreground hover:bg-white/5 w-full"
                >
                  {t("products")}
                  <ChevronDown className={cn("h-4 w-4 transition-transform", mobileProductsOpen && "rotate-180")} />
                </button>
                {mobileProductsOpen && (
                  <div className="ml-4 flex flex-col gap-1 border-l-2 border-accent/20 pl-4 py-2 mb-2">
                    {productMenuItems.map((item) => (
                      <Link
                        key={item.key}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className="rounded-lg px-4 py-2.5 text-sm text-muted hover:text-foreground hover:bg-white/5"
                      >
                        {tProducts(`${item.key}.title`)}
                      </Link>
                    ))}
                    {serviceMenuItems.slice(0, 3).map((item) => (
                      <Link
                        key={item.key}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className="rounded-lg px-4 py-2.5 text-sm text-muted hover:text-foreground hover:bg-white/5"
                      >
                        {tServices(`${item.key}.title`)}
                      </Link>
                    ))}
                  </div>
                )}

                {navLinks.slice(1).map((link) => (
                  <Link
                    key={link.key}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-xl px-4 py-3.5 text-base font-medium text-muted hover:text-foreground hover:bg-white/5"
                  >
                    {t(link.key)}
                  </Link>
                ))}

                <div className="mt-4 px-4 flex flex-col gap-2">
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/login" onClick={() => setMobileOpen(false)}>{t("login")}</Link>
                  </Button>
                  <Button asChild className="w-full">
                    <Link href="/register" onClick={() => setMobileOpen(false)}>{t("getStarted")}</Link>
                  </Button>
                </div>
                <div className="mt-4 px-4 pt-4 border-t border-white/10 flex items-center justify-between">
                  <span className="text-sm text-muted">{t("language")}</span>
                  <LanguageSwitcher />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
