"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Menu, ChevronDown } from "lucide-react";
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
import { SearchTrigger } from "./command-search";
import { navLinks, productMenuItems, resourceLinks } from "@/lib/navigation";
import Image from "next/image";

export function Navbar() {
  const t = useTranslations("nav");
  const tProducts = useTranslations("productsMenu");
  const [scrolled, setScrolled] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-[60] bg-[#0f0a1a] text-violet-100 text-center text-xs sm:text-sm py-1.5 px-4 border-b border-violet-500/25">
        Emergency support:{" "}
        <a href="tel:+94713838638" className="underline underline-offset-2 hover:text-white">
          +94 713 838 638
        </a>
        {" · "}
        <Link href="/support" className="underline underline-offset-2 hover:text-white">
          Support Center
        </Link>
      </div>

      <header
        className={cn(
          "fixed top-8 left-0 right-0 z-50 transition-all duration-300",
          scrolled
            ? "bg-[#050508]/90 backdrop-blur-xl border-b border-white/10 shadow-lg"
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
              <button className="flex items-center gap-1 px-3 py-2 text-sm text-muted hover:text-foreground">
                {t("products")}
                <ChevronDown className={cn("h-4 w-4 transition-transform", productsOpen && "rotate-180")} />
              </button>
              {productsOpen && (
                <div className="absolute left-0 top-full pt-2">
                  <div className="w-[520px] rounded-xl border border-white/10 bg-surface/95 backdrop-blur-xl p-5 shadow-glow-lg grid grid-cols-2 gap-2">
                    {productMenuItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link key={item.key} href={item.href} className="flex gap-3 rounded-lg p-3 hover:bg-white/5">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{tProducts(`${item.key}.title`)}</p>
                            <p className="text-xs text-muted line-clamp-1">{tProducts(`${item.key}.description`)}</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {navLinks.filter((l) => l.key !== "products").map((link) => (
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
              <button className="flex items-center gap-1 px-3 py-2 text-sm text-muted hover:text-foreground">
                {t("resources")}
                <ChevronDown className={cn("h-4 w-4", resourcesOpen && "rotate-180")} />
              </button>
              {resourcesOpen && (
                <div className="absolute right-0 top-full pt-2">
                  <div className="w-56 rounded-xl border border-white/10 bg-surface/95 p-2 shadow-glow-lg">
                    {resourceLinks.map((link) => (
                      <Link
                        key={link.key}
                        href={link.href}
                        className="block rounded-lg px-3 py-2 text-sm text-muted hover:text-foreground hover:bg-white/5"
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
            <SearchTrigger className="sm:hidden !px-2.5" />
            <SearchTrigger className="hidden sm:inline-flex" />
            <div className="hidden sm:block"><LanguageSwitcher /></div>
            <ThemeToggle />
            <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
              <Link href="/login">{t("login")}</Link>
            </Button>
            <Button asChild className="hidden md:inline-flex rounded-full shadow-glow" size="sm">
              <Link href="/contact">{t("getConsultation")}</Link>
            </Button>

            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="xl:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="overflow-y-auto bg-background/90 backdrop-blur-2xl border-l border-white/10 w-[85vw] sm:w-[400px]">
                <SheetHeader className="pb-4 border-b border-white/10">
                  <SheetTitle className="text-left">
                    <span className="gradient-text font-display text-2xl font-bold">MernCrest</span>
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-6 flex flex-col gap-1">
                  {[...navLinks, ...resourceLinks].map((link) => (
                    <Link
                      key={link.href + link.key}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="rounded-xl px-4 py-3 text-base font-medium text-muted hover:text-foreground hover:bg-white/5"
                    >
                      {t(link.key)}
                    </Link>
                  ))}
                  <div className="mt-4 px-4 flex flex-col gap-2">
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/login" onClick={() => setMobileOpen(false)}>{t("login")}</Link>
                    </Button>
                    <Button asChild className="w-full rounded-full">
                      <Link href="/contact" onClick={() => setMobileOpen(false)}>{t("getConsultation")}</Link>
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </header>
    </>
  );
}
