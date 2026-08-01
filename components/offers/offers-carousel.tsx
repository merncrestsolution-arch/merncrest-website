"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PublicOffer } from "@/lib/offers/types";
import { OfferCard } from "./offer-card";

const AUTOPLAY_MS = 5000;
const SWIPE_THRESHOLD = 50;

function useVisibleCount() {
  const [count, setCount] = useState(3);

  useEffect(() => {
    function update() {
      const w = window.innerWidth;
      if (w < 768) setCount(1);
      else if (w < 1024) setCount(2);
      else setCount(3);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return count;
}

type OffersCarouselProps = {
  offers: PublicOffer[];
};

export function OffersCarousel({ offers }: OffersCarouselProps) {
  const visibleCount = useVisibleCount();
  const maxIndex = Math.max(0, offers.length - visibleCount);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [direction, setDirection] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback(
    (next: number) => {
      if (offers.length <= visibleCount) return;
      setDirection(next > index ? 1 : -1);
      if (next < 0) setIndex(maxIndex);
      else if (next > maxIndex) setIndex(0);
      else setIndex(next);
    },
    [index, maxIndex, offers.length, visibleCount]
  );

  const next = useCallback(() => goTo(index >= maxIndex ? 0 : index + 1), [goTo, index, maxIndex]);
  const prev = useCallback(() => goTo(index <= 0 ? maxIndex : index - 1), [goTo, index, maxIndex]);

  useEffect(() => {
    if (paused || offers.length <= visibleCount) return;
    timerRef.current = setInterval(next, AUTOPLAY_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, next, offers.length, visibleCount]);

  useEffect(() => {
    setIndex((i) => Math.min(i, maxIndex));
  }, [maxIndex]);

  function onDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x < -SWIPE_THRESHOLD) next();
    else if (info.offset.x > SWIPE_THRESHOLD) prev();
  }

  if (offers.length === 0) return null;

  const slideOffers =
    offers.length <= visibleCount
      ? offers
      : offers.slice(index, index + visibleCount).length === visibleCount
        ? offers.slice(index, index + visibleCount)
        : [...offers.slice(index), ...offers.slice(0, visibleCount - (offers.length - index))];

  const pageCount = Math.max(1, maxIndex + 1);
  const showNav = offers.length > visibleCount;

  return (
    <div
      className="offer-carousel-shell"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className={cn("relative", showNav && "px-1 sm:px-2 lg:px-4")}>
        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={`${index}-${visibleCount}`}
              custom={direction}
              initial={{ opacity: 0, x: direction >= 0 ? 32 : -32 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction >= 0 ? -32 : 32 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              drag={showNav ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.1}
              onDragEnd={onDragEnd}
              className={cn(
                "grid items-stretch gap-4 sm:gap-5 lg:gap-6",
                visibleCount === 1 && "grid-cols-1",
                visibleCount === 2 && "grid-cols-2",
                visibleCount === 3 && "grid-cols-3"
              )}
            >
              {slideOffers.map((offer, i) => (
                <OfferCard key={offer.id} offer={offer} priority={index === 0 && i === 0} />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {showNav && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous offers"
              className={cn(
                "offer-nav-btn absolute left-0 top-[42%] z-20 -translate-x-1/2 -translate-y-1/2",
                "hidden sm:flex"
              )}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next offers"
              className={cn(
                "offer-nav-btn absolute right-0 top-[42%] z-20 translate-x-1/2 -translate-y-1/2",
                "hidden sm:flex"
              )}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {showNav && (
        <div className="mt-6 flex items-center justify-center gap-2 lg:mt-8">
          {Array.from({ length: pageCount }).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => goTo(i)}
              className={cn(
                "rounded-full transition-all duration-300",
                i === index
                  ? "h-2 w-9 bg-gradient-to-r from-blue-600 via-violet-600 to-pink-600 shadow-sm"
                  : "h-2 w-2 bg-stitch-outline hover:bg-stitch-primary/50"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
