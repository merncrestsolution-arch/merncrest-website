"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { CornerDownLeft, Search, Sparkles } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { searchSiteIndex, type SearchItem } from "@/lib/search-index";

type SearchContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
};

const SearchContext = createContext<SearchContextValue | null>(null);

export function useCommandSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error("useCommandSearch must be used within CommandSearchProvider");
  return ctx;
}

export function CommandSearchProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((v) => !v), []);

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const value = useMemo(() => ({ open, setOpen, toggle }), [open, toggle]);

  return (
    <SearchContext.Provider value={value}>
      {children}
      <CommandSearchDialog />
    </SearchContext.Provider>
  );
}

function CommandSearchDialog() {
  const { open, setOpen } = useCommandSearch();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const results = useMemo(() => searchSiteIndex(query, 10), [query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  function go(item: SearchItem) {
    setOpen(false);
    router.push(item.href);
  }

  function onKeyDown(e: ReactKeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[active]) {
      e.preventDefault();
      go(results[active]);
    }
  }

  const groups = useMemo(() => {
    const map = new Map<string, SearchItem[]>();
    results.forEach((item) => {
      const list = map.get(item.category) || [];
      list.push(item);
      map.set(item.category, list);
    });
    return Array.from(map.entries());
  }, [results]);

  let flatIndex = -1;

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0" />
        <Dialog.Content
          className="fixed left-1/2 top-[12%] z-[121] w-[min(100vw-1.5rem,640px)] -translate-x-1/2 overflow-hidden rounded-2xl border border-violet-500/25 bg-[#0c0a14]/95 shadow-glow-lg outline-none backdrop-blur-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95"
          onKeyDown={onKeyDown}
        >
          <Dialog.Title className="sr-only">Site search</Dialog.Title>
          <Dialog.Description className="sr-only">
            Search pages, products, services, and portals
          </Dialog.Description>

          <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
            <Search className="h-5 w-5 text-violet-400 shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search domains, hosting, ERP, support…"
              className="flex-1 bg-transparent text-base text-white placeholder:text-white/40 outline-none"
              autoComplete="off"
              spellCheck={false}
            />
            <kbd className="hidden sm:inline-flex items-center rounded-md border border-white/15 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-white/50">
              ESC
            </kbd>
          </div>

          <div className="max-h-[min(60vh,420px)] overflow-y-auto p-2">
            {results.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-white/50">
                No matches for “{query}”
              </div>
            ) : (
              groups.map(([category, items]) => (
                <div key={category} className="mb-2">
                  <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-300/70">
                    {category}
                  </p>
                  <ul className="space-y-0.5">
                    {items.map((item) => {
                      flatIndex += 1;
                      const index = flatIndex;
                      const Icon = item.icon;
                      const isActive = index === active;
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            onMouseEnter={() => setActive(index)}
                            onClick={() => go(item)}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                              isActive
                                ? "bg-gradient-to-r from-violet-600/30 to-indigo-600/20 text-white"
                                : "text-white/80 hover:bg-white/5"
                            )}
                          >
                            <span
                              className={cn(
                                "flex h-9 w-9 items-center justify-center rounded-lg border",
                                isActive
                                  ? "border-violet-400/40 bg-violet-500/20 text-violet-200"
                                  : "border-white/10 bg-white/5 text-white/60"
                              )}
                            >
                              <Icon className="h-4 w-4" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-medium truncate">{item.title}</span>
                              <span className="block text-xs text-white/45 truncate">
                                {item.description}
                              </span>
                            </span>
                            {isActive && (
                              <CornerDownLeft className="h-3.5 w-3.5 text-white/40 shrink-0" />
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))
            )}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-white/10 bg-black/30 px-4 py-2.5 text-[11px] text-white/40">
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-violet-400" />
              Instant navigation across the platform
            </span>
            <span className="hidden sm:inline">↑↓ navigate · ↵ open</span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Compact search trigger for navbar / app headers */
export function SearchTrigger({ className }: { className?: string }) {
  const { setOpen } = useCommandSearch();

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={cn(
        "group inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 text-sm text-white/55 shadow-sm transition-all hover:border-violet-400/40 hover:bg-white/[0.07] hover:text-white",
        className
      )}
      aria-label="Open search"
    >
      <Search className="h-3.5 w-3.5 text-violet-300/80" />
      <span className="hidden lg:inline min-w-[7.5rem] text-left">Search…</span>
      <kbd className="hidden md:inline-flex items-center gap-0.5 rounded-md border border-white/10 bg-black/30 px-1.5 py-0.5 text-[10px] font-medium text-white/45">
        <span className="text-[9px]">⌘</span>K
      </kbd>
    </button>
  );
}
