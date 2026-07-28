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
import {
  CornerDownLeft,
  FileText,
  FolderKanban,
  Globe2,
  Search,
  Server,
  Users,
} from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import type { StaffSearchResult } from "@/app/api/staff/search/route";

type SearchContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
};

const SearchContext = createContext<SearchContextValue | null>(null);

export function useStaffSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error("useStaffSearch must be used within StaffSearchProvider");
  return ctx;
}

const TYPE_ICONS = {
  client: Users,
  project: FolderKanban,
  invoice: FileText,
  domain: Globe2,
  hosting: Server,
};

const TYPE_LABELS = {
  client: "Clients",
  project: "Projects",
  invoice: "Invoices",
  domain: "Domains",
  hosting: "Hosting",
};

export function StaffSearchProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((v) => !v), []);

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "/" && !e.metaKey && !e.ctrlKey) {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const value = useMemo(() => ({ open, setOpen, toggle }), [open, toggle]);

  return (
    <SearchContext.Provider value={value}>
      {children}
      <StaffSearchDialog />
    </SearchContext.Provider>
  );
}

function StaffSearchDialog() {
  const { open, setOpen } = useStaffSearch();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [results, setResults] = useState<StaffSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      setResults([]);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setActive(0);
      return;
    }

    const t = setTimeout(() => {
      setLoading(true);
      fetch(`/api/staff/search?q=${encodeURIComponent(query.trim())}`)
        .then(async (r) => {
          const d = await r.json();
          if (d.success && d.data) setResults(d.data);
          else setResults([]);
        })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 200);

    return () => clearTimeout(t);
  }, [query]);

  function go(item: StaffSearchResult) {
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
    const map = new Map<string, StaffSearchResult[]>();
    results.forEach((item) => {
      const label = TYPE_LABELS[item.type];
      const list = map.get(label) || [];
      list.push(item);
      map.set(label, list);
    });
    return Array.from(map.entries());
  }, [results]);

  let flatIndex = -1;

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-md" />
        <Dialog.Content
          className="fixed left-1/2 top-[12%] z-[121] w-[min(100vw-1.5rem,640px)] -translate-x-1/2 overflow-hidden rounded-2xl border border-[var(--sp-border)] bg-[var(--sp-surface)] shadow-2xl outline-none"
          onKeyDown={onKeyDown}
        >
          <Dialog.Title className="sr-only">Staff search</Dialog.Title>
          <Dialog.Description className="sr-only">
            Search clients, projects, invoices, and domains
          </Dialog.Description>

          <div className="flex items-center gap-3 border-b border-[var(--sp-border)] px-4 py-3">
            <Search className="h-5 w-5 text-violet-400 shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search clients, projects, invoices, domains…"
              className="flex-1 bg-transparent text-base text-[var(--sp-text)] placeholder:text-[var(--sp-muted)] outline-none"
              autoComplete="off"
              spellCheck={false}
            />
            <kbd className="hidden sm:inline-flex items-center rounded-md border border-[var(--sp-border)] px-1.5 py-0.5 text-[10px] text-[var(--sp-muted)]">
              ESC
            </kbd>
          </div>

          <div className="max-h-[min(60vh,420px)] overflow-y-auto p-2">
            {query.trim().length < 2 ? (
              <div className="px-4 py-10 text-center text-sm text-[var(--sp-muted)]">
                Type at least 2 characters to search
              </div>
            ) : loading ? (
              <div className="px-4 py-10 text-center text-sm text-[var(--sp-muted)]">Searching…</div>
            ) : results.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-[var(--sp-muted)]">
                No matches for &ldquo;{query}&rdquo;
              </div>
            ) : (
              groups.map(([category, items]) => (
                <div key={category} className="mb-2">
                  <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--sp-muted)]">
                    {category}
                  </p>
                  <ul className="space-y-0.5">
                    {items.map((item) => {
                      flatIndex += 1;
                      const index = flatIndex;
                      const Icon = TYPE_ICONS[item.type];
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
                                ? "bg-violet-500/15 text-[var(--sp-text)]"
                                : "text-[var(--sp-text)] hover:bg-[var(--sp-surface-2)]"
                            )}
                          >
                            <span
                              className={cn(
                                "flex h-9 w-9 items-center justify-center rounded-lg border",
                                isActive
                                  ? "border-violet-400/40 bg-violet-500/20 text-violet-300"
                                  : "border-[var(--sp-border)] bg-[var(--sp-surface-2)] text-[var(--sp-muted)]"
                              )}
                            >
                              <Icon className="h-4 w-4" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-medium truncate">{item.title}</span>
                              <span className="block text-xs text-[var(--sp-muted)] truncate">
                                {item.subtitle}
                              </span>
                            </span>
                            {isActive && (
                              <CornerDownLeft className="h-3.5 w-3.5 text-[var(--sp-muted)] shrink-0" />
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

          <div className="flex items-center justify-between gap-3 border-t border-[var(--sp-border)] px-4 py-2.5 text-[11px] text-[var(--sp-muted)]">
            <span>Clients · Projects · Invoices · Domains</span>
            <span className="hidden sm:inline">↑↓ navigate · ↵ open · / focus</span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function StaffSearchTrigger({ className }: { className?: string }) {
  const { setOpen } = useStaffSearch();

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={cn("stitch-search-wrap cursor-pointer", className)}
      aria-label="Open search"
    >
      <Search className="stitch-search-icon" />
      <span className="text-sm text-[var(--sp-muted)]">Search clients, projects, invoices…</span>
      <span className="stitch-search-kbd">/</span>
    </button>
  );
}
