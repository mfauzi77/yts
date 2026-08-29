import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HorizontalShelfProps {
  title: string;
  subtitle?: string;
  onSeeAll?: () => void;
  children: React.ReactNode;
}

export const HorizontalShelf: React.FC<HorizontalShelfProps> = ({
  title,
  subtitle,
  onSeeAll,
  children,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="space-y-3">
      {/* Shelf Header */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-white hover:underline cursor-pointer tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-[11px] sm:text-xs text-[#9ca3af] mt-0.5">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {onSeeAll && (
            <button
              onClick={onSeeAll}
              className="text-xs font-bold text-[#888888] hover:text-white transition-colors mr-2 uppercase tracking-wider"
            >
              Lihat Semua
            </button>
          )}

          {/* Desktop Left/Right Scroll Arrows */}
          <div className="hidden sm:flex items-center gap-1">
            <button
              onClick={() => scroll('left')}
              className="w-7 h-7 rounded-full bg-[#181818] hover:bg-[#282828] text-white flex items-center justify-center transition-colors active:scale-95"
              aria-label="Geser ke Kiri"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-7 h-7 rounded-full bg-[#181818] hover:bg-[#282828] text-white flex items-center justify-center transition-colors active:scale-95"
              aria-label="Geser ke Kanan"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Scroll Catalog */}
      <div
        ref={scrollContainerRef}
        className="flex items-stretch gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-2 pt-1 -mx-1 px-1"
      >
        {children}
      </div>
    </section>
  );
};
