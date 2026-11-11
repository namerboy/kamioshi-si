import React, { useEffect, useRef, useState } from 'react';
import { EmaPlaque, ShrineStats, ShrineTag } from '../types';
import { EmaCard } from './EmaCard';
import { CATEGORY_LABELS } from '../data/emaData';
import { shrineAudio } from '../audio/synth';
import { useLanguage } from '../i18n/LanguageContext';
import { 
  BrushSearchIcon, 
  EmaPlaqueIcon, 
  SuzuBellIcon, 
  ShideStreamer,
  CharterScrollIcon,
  ToriiIcon,
  SacredSparkleIcon,
  ContactEnvelopeIcon
} from './CustomIcons';

interface EmaWallProps {
  plaques: EmaPlaque[];
  stats: ShrineStats;
  topRevered: EmaPlaque[];
  popularTags: ShrineTag[];
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  sortBy: 'newest' | 'oldest' | 'bows';
  setSortBy: (s: 'newest' | 'oldest' | 'bows') => void;
  onBow: (id: string) => void;
  onSelectPlaque: (plaque: EmaPlaque) => void;
  onOpenHangModal: (prefillName?: string) => void;
  onOpenTermsModal: () => void;
  onOpenContactModal?: () => void;
  onTriggerBreeze?: () => void;
  searchInputRef?: React.RefObject<HTMLInputElement>;
  windSwinging: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
}

const runViewTransition = (updateFn: () => void, focusElement?: HTMLElement | null) => {
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (typeof document === 'undefined' || !('startViewTransition' in document) || prefersReducedMotion) {
    updateFn();
    focusElement?.focus({ preventScroll: true });
    return;
  }

  const transition = (
    document as Document & {
      startViewTransition: (cb: () => void) => { finished: Promise<void> };
    }
  ).startViewTransition(() => {
    updateFn();
  });

  if (focusElement) {
    transition.finished.finally(() => {
      focusElement.focus({ preventScroll: true });
    });
  }
};

export const EmaWall: React.FC<EmaWallProps> = ({
  plaques,
  stats,
  topRevered,
  popularTags,
  hasMore,
  isLoading,
  isLoadingMore,
  onLoadMore,
  sortBy,
  setSortBy,
  onBow,
  onSelectPlaque,
  onOpenHangModal,
  onOpenTermsModal,
  onOpenContactModal,
  searchInputRef,
  windSwinging,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory
}) => {
  const { t, language } = useLanguage();
  const [compactView, setCompactView] = useState(false);
  const rackHeadingRef = useRef<HTMLSpanElement | null>(null);
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);

  // Automatic infinite scroll using IntersectionObserver (loads 24 plaques per page from D1)
  useEffect(() => {
    const sentinel = loadMoreSentinelRef.current;
    if (!sentinel || !hasMore || isLoading || isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMore();
        }
      },
      { rootMargin: '360px 0px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoading, isLoadingMore, onLoadMore]);

  const totalPlaques = stats.totalPlaques;
  const uniqueLocations = stats.uniqueLocations;
  const totalBells = stats.totalBells;
  const categoryCounts = stats.categoryCounts;
  const nextCoord = stats.maxCoordinate + 1;

  const currentCategoryLabel =
    t.categories[selectedCategory] || CATEGORY_LABELS[selectedCategory]?.label || selectedCategory;

  return (
    <div className="relative z-10 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 sm:space-y-8">
      {/* 1. Grand Shrine Pavilion Hero with Shimenawa & Shide Streamers */}
      <section className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-amber-800/40 bg-zinc-950/85 shadow-2xl shrine-hero-section">
        {/* Photorealistic Shrine Courtyard Backdrop */}
        <div
          className="absolute inset-0 opacity-25 bg-cover bg-center pointer-events-none scale-105 shrine-hero-backdrop"
          style={{ backgroundImage: `url('/shrine_courtyard.jpg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/60 via-zinc-950/75 to-zinc-950 pointer-events-none shrine-hero-overlay" />

        {/* Architectural Shimenawa Top Timber & Sacred Paper Shide Streamers */}
        <div className="relative z-20 w-full">
          <div
            className="h-3 sm:h-3.5 w-full border-b border-amber-700/50 shadow-md"
            style={{
              background: 'repeating-linear-gradient(60deg, #5c3a1e, #5c3a1e 12px, #3d2410 12px, #3d2410 24px)'
            }}
          />
          <div className="flex justify-around items-start px-6 sm:px-20 -mt-1 pointer-events-none">
            <ShideStreamer />
            <ShideStreamer className="hidden sm:block [animation-delay:0.8s]" />
            <ShideStreamer className="[animation-delay:1.6s]" />
            <ShideStreamer className="hidden md:block [animation-delay:2.3s]" />
            <ShideStreamer className="[animation-delay:0.4s]" />
          </div>
        </div>

        {/* Hero Copy & Interactive Pavilion Controls */}
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 pb-7 sm:pb-9 pt-2 sm:pt-3 text-center space-y-4 sm:space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-700/40 text-amber-300 text-[11px] sm:text-xs font-mono shadow-sm">
            <ToriiIcon size={14} color="#f59e0b" />
            <span>{t.hero.badge}</span>
          </div>

          <h1
            className="font-serif font-bold text-amber-50 tracking-tight leading-tight drop-shadow shrine-hero-title"
            style={{ fontSize: 'clamp(1.75rem, 1.1rem + 3vw, 3.5rem)' }}
          >
            {t.hero.title}
          </h1>

          <p className="text-xs sm:text-base text-zinc-300 leading-relaxed max-w-2xl mx-auto shrine-hero-desc">
            {t.hero.desc}
          </p>

          {/* Live Dynamic Stats Bar (O(1) Pre-Aggregated from D1) */}
          <div className="pt-1 flex items-center justify-center gap-4 sm:gap-10 text-xs font-mono text-zinc-400">
            <div className="flex flex-col items-center">
              <span className="text-amber-400 font-bold text-sm sm:text-lg">
                {totalPlaques.toLocaleString()}
              </span>
              <span className="text-[11px] sm:text-xs">{t.hero.statPlaques(totalPlaques)}</span>
            </div>
            <div className="text-zinc-700">•</div>
            <div className="flex flex-col items-center">
              <span className="text-amber-400 font-bold text-sm sm:text-lg">
                {uniqueLocations.toLocaleString()}
              </span>
              <span className="text-[11px] sm:text-xs">{t.hero.statCities(uniqueLocations)}</span>
            </div>
            <div className="text-zinc-700">•</div>
            <div className="flex flex-col items-center">
              <span className="text-amber-400 font-bold text-sm sm:text-lg">
                {totalBells.toLocaleString()}
              </span>
              <span className="text-[11px] sm:text-xs">{t.hero.statBells(totalBells)}</span>
            </div>
          </div>

          {/* Primary Hero Action Button */}
          <div className="pt-2 flex items-center justify-center max-w-md mx-auto">
            <button
              type="button"
              onClick={() => {
                shrineAudio.playWoodClack();
                onOpenHangModal();
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-9 py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 via-red-600 to-red-700 hover:from-amber-500 hover:to-red-500 text-white font-serif font-bold text-sm sm:text-base shadow-xl shadow-red-950/60 border border-amber-400/30 transition-all hover:-translate-y-0.5 active:scale-95"
            >
              <EmaPlaqueIcon size={18} color="#ffffff" />
              <span>{t.hero.hangCta}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Search, Filter & Rack Layout Controls */}
      <section className="bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-800/90 p-3.5 sm:p-5 shadow-xl space-y-3.5 shrine-filter-section">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-full md:max-w-md">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
              <BrushSearchIcon size={16} />
            </div>
            <input
              ref={searchInputRef}
              type="search"
              name="q"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.filter.searchPlaceholder}
              aria-label={t.filter.searchAria}
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              className="w-full pl-10 pr-16 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700/80 focus:border-amber-500 text-base sm:text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition-colors shrine-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  shrineAudio.playWoodClack();
                  runViewTransition(() => setSearchQuery(''), searchInputRef?.current);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-[11px] text-zinc-300 hover:text-white transition-colors"
              >
                {t.filter.clear}
              </button>
            )}
          </div>

          {/* Sort & Density Controls */}
          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 text-xs">
            <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
              <button
                type="button"
                onClick={(e) => {
                  shrineAudio.playWoodClack();
                  runViewTransition(() => setSortBy('newest'), e.currentTarget);
                }}
                className={`min-h-[30px] px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                  sortBy === 'newest'
                    ? 'bg-amber-950/70 text-amber-300 border border-amber-700/50 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {t.filter.sortNewest}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  shrineAudio.playWoodClack();
                  runViewTransition(() => setSortBy('oldest'), e.currentTarget);
                }}
                className={`min-h-[30px] px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                  sortBy === 'oldest'
                    ? 'bg-amber-950/70 text-amber-300 border border-amber-700/50 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {t.filter.sortOldest}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  shrineAudio.playWoodClack();
                  runViewTransition(() => setSortBy('bows'), e.currentTarget);
                }}
                className={`inline-flex items-center gap-1 min-h-[30px] px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                  sortBy === 'bows'
                    ? 'bg-amber-950/70 text-amber-300 border border-amber-700/50 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <SuzuBellIcon size={12} color="#f59e0b" />
                <span>{t.filter.sortBows}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={(e) => {
                shrineAudio.playWoodClack();
                runViewTransition(() => setCompactView((v) => !v), e.currentTarget);
              }}
              aria-pressed={compactView}
              className={`min-h-[34px] px-3 py-2 rounded-xl font-mono text-[11px] border transition-colors ${
                compactView
                  ? 'bg-amber-950/50 text-amber-300 border-amber-700/50'
                  : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border-zinc-800'
              }`}
              title="Toggle between Standard and Compact rack view"
            >
              {compactView ? t.filter.viewCompact : t.filter.viewStandard}
            </button>
          </div>
        </div>

        {/* Category Filter Pills (Mobile Horizontal Snap Rail) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1 snap-x snap-proximity overscroll-x-contain">
          {Object.entries(CATEGORY_LABELS).map(([key, meta]) => {
            const isSelected = selectedCategory === key;
            const count = categoryCounts[key] || 0;
            const labelText = t.categories[key] || meta.label;
            return (
              <button
                key={key}
                type="button"
                onClick={(e) => {
                  shrineAudio.playWoodClack();
                  runViewTransition(() => setSelectedCategory(key), e.currentTarget);
                }}
                aria-pressed={isSelected}
                className={`snap-start shrink-0 inline-flex items-center gap-1.5 min-h-[34px] px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                  isSelected
                    ? 'bg-amber-500 text-zinc-950 border-amber-400 font-semibold shadow-md'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                {meta.renderIcon({ size: 14, color: isSelected ? '#09090b' : 'currentColor' })}
                <span>{labelText}</span>
                {count > 0 && (
                  <span
                    className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      isSelected ? 'bg-black/20 text-zinc-950 font-bold' : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {count.toLocaleString()}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Top Revered Spotlight & Popular Kamioshi Tags Bar */}
        {(topRevered.length > 0 || popularTags.length > 0) && !searchQuery && selectedCategory === 'all' && (
          <div className="pt-2 border-t border-zinc-800/80 flex flex-wrap items-center gap-2 text-xs">
            {topRevered.length > 0 && (
              <>
                <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-amber-400 font-semibold mr-1">
                  <SuzuBellIcon size={13} color="#f59e0b" />
                  <span>{t.rack.topReveredTitle}:</span>
                </span>
                {topRevered.map((p, idx) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      shrineAudio.playWoodClack();
                      onSelectPlaque(p);
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-950/90 hover:bg-amber-950/50 border border-zinc-800 hover:border-amber-700/50 text-zinc-200 hover:text-amber-200 transition-colors"
                  >
                    <span className="font-mono text-[10px] text-amber-400 font-bold">#{idx + 1}</span>
                    <span className="font-serif font-semibold truncate max-w-[140px]">{p.kamioshiName}</span>
                    <span className="font-mono text-[10px] text-zinc-400">({p.bowCount})</span>
                  </button>
                ))}
              </>
            )}

            {popularTags.length > 3 && (
              <>
                <span className="text-zinc-700 hidden sm:inline">•</span>
                <span className="inline-flex items-center gap-1 font-mono text-[11px] text-zinc-400">
                  <SacredSparkleIcon size={12} color="#f59e0b" />
                  <span>{language === 'ja' ? '人気のタグ:' : 'Tags:'}</span>
                </span>
                {popularTags.slice(0, 6).map((tag) => (
                  <button
                    key={tag.tagNorm}
                    type="button"
                    onClick={() => {
                      shrineAudio.playWoodClack();
                      setSearchQuery(tag.displayName);
                    }}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-950/70 hover:bg-zinc-800 border border-zinc-800/80 text-[11px] text-zinc-300 hover:text-amber-300 transition-colors"
                  >
                    <span className="truncate max-w-[110px]">#{tag.displayName}</span>
                    {tag.plaqueCount > 1 && (
                      <span className="font-mono text-[10px] text-zinc-500">{tag.plaqueCount}</span>
                    )}
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </section>

      {/* 3. The Carved Wooden Ema-Kake Hanging Rack (絵馬掛け) */}
      <section className="relative pt-2 sm:pt-4">
        {/* Top Carved Cedar Crossbeam with Ornamental Iron Brackets */}
        <div
          className="relative w-full h-7 rounded-md shadow-xl flex items-center justify-between px-2 sm:px-3 border-y border-amber-700/50 overflow-hidden shrine-rack-beam"
          style={{
            background: 'linear-gradient(180deg, #523015 0%, #381e0b 55%, #241206 100%)'
          }}
        >
          {/* Left Traditional Black & Gold Iron Fitting (Kazari-kanagu) */}
          <div className="w-6 sm:w-8 h-full bg-zinc-900 border-r border-amber-500/40 flex items-center justify-center shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          </div>
          <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono tracking-widest uppercase text-amber-200/70 select-none truncate px-2">
            <ToriiIcon size={12} color="#fbbf24" />
            <span ref={rackHeadingRef} tabIndex={-1} className="truncate outline-none">
              {t.rack.beamLabel}
            </span>
          </div>
          {/* Right Traditional Black & Gold Iron Fitting */}
          <div className="w-6 sm:w-8 h-full bg-zinc-900 border-l border-amber-500/40 flex items-center justify-center shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          </div>
        </div>

        {plaques.length > 0 ? (
          <>
            <div
              className={`grid ${
                compactView
                  ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-y-7 sm:gap-y-10 gap-x-2.5 sm:gap-x-4'
                  : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-y-8 sm:gap-y-12 gap-x-5 sm:gap-x-6'
              } justify-items-center pt-1 pb-6`}
            >
              {plaques.map((plaque, idx) => (
                <EmaCard
                  key={plaque.id}
                  plaque={plaque}
                  onBow={onBow}
                  onSelect={onSelectPlaque}
                  windSwinging={windSwinging}
                  compact={compactView}
                  index={idx % 24}
                />
              ))}

              {/* Interactive "Hang Next Plaque" Open Hook on the Beam */}
              <div className="w-full flex flex-col items-center">
                <div className="w-3.5 h-3.5 rounded-full bg-amber-800/70 border border-amber-600/50 -mb-1" />
                <div className="w-0.5 h-8 bg-amber-800/40" />
                <button
                  type="button"
                  onClick={() => {
                    shrineAudio.playWoodClack();
                    onOpenHangModal();
                  }}
                  className="group relative w-full max-w-[310px] sm:w-80 min-h-[235px] rounded-b-lg bg-zinc-900/35 hover:bg-amber-950/25 p-6 pt-8 flex flex-col items-center justify-center text-center transition-all duration-300 text-amber-700/60 hover:text-amber-400/90 shrine-open-hook-card"
                  style={{
                    clipPath: 'polygon(50% 0%, 100% 13%, 100% 100%, 0% 100%, 0% 13%)'
                  }}
                >
                  {/* 5-Sided Pentagonal Dashed SVG Outline */}
                  <svg
                    className="pointer-events-none absolute inset-0 w-full h-full"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                  >
                    <polygon
                      points="50,1 99,13.5 99,99 1,99 1,13.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray="6 4"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>

                  <div className="w-11 h-11 rounded-2xl bg-amber-950/60 border border-amber-700/50 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform mb-3">
                    <EmaPlaqueIcon size={22} />
                  </div>
                  <span className="font-serif font-bold text-amber-200 text-base">
                    {t.rack.openHookTitle(nextCoord)}
                  </span>
                  <span className="text-xs text-zinc-400 mt-1 max-w-[200px]">
                    {t.rack.openHookDesc}
                  </span>
                </button>
              </div>
            </div>

            {/* Keyset Pagination / Infinite Scroll Sentinel for 100k+ Scale */}
            {hasMore && (
              <div
                ref={loadMoreSentinelRef}
                className="pt-2 pb-6 flex flex-col items-center justify-center gap-2"
              >
                <button
                  type="button"
                  disabled={isLoadingMore}
                  onClick={() => {
                    shrineAudio.playWoodClack();
                    onLoadMore();
                  }}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-amber-700/40 text-amber-200 text-xs font-mono shadow-md transition-all disabled:opacity-50"
                >
                  <ToriiIcon size={14} color="#f59e0b" />
                  <span>
                    {isLoadingMore
                      ? language === 'ja'
                        ? '絵馬を読み込み中...'
                        : 'Loading more plaques...'
                      : language === 'ja'
                      ? 'さらに絵馬を表示する'
                      : 'Load More Plaques'}
                  </span>
                </button>
                <span className="text-[11px] font-mono text-zinc-500">
                  {language === 'ja'
                    ? `${plaques.length.toLocaleString()} / ${totalPlaques.toLocaleString()} 枚を表示中`
                    : `Showing ${plaques.length.toLocaleString()} of ${totalPlaques.toLocaleString()} plaques`}
                </span>
              </div>
            )}
          </>
        ) : (
          /* Inviting Empty Rack State with Interactive Hook #1 */
          <div className="py-8 sm:py-10 flex flex-col items-center">
            <div className="w-full flex flex-col items-center -mt-4 mb-6">
              <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-b from-amber-300 to-amber-800 border border-amber-200 shadow" />
              <div className="w-1 h-7 bg-red-700/70" />
              <button
                type="button"
                onClick={() => {
                  shrineAudio.playWoodClack();
                  onOpenHangModal(searchQuery.trim() || undefined);
                }}
                className="group relative w-full max-w-[310px] sm:w-80 min-h-[255px] rounded-b-xl bg-gradient-to-b from-amber-950/30 to-zinc-900/75 hover:from-amber-900/40 hover:to-zinc-900 p-6 pt-9 flex flex-col items-center justify-between text-center shadow-2xl transition-all duration-300 hover:-translate-y-1 text-amber-500/60 hover:text-amber-400"
                style={{
                  clipPath: 'polygon(50% 0%, 100% 13%, 100% 100%, 0% 100%, 0% 13%)'
                }}
              >
                {/* 5-Sided Pentagonal Dashed SVG Outline */}
                <svg
                  className="pointer-events-none absolute inset-0 w-full h-full"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <polygon
                    points="50,1 99,13.5 99,99 1,99 1,13.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray="6 4"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>

                <span className="text-[11px] font-mono text-amber-400/90 tracking-wider">
                  {t.rack.emptySpotAvailable(nextCoord)}
                </span>

                <div className="my-2 flex flex-col items-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-red-600/20 border border-amber-500/40 flex items-center justify-center text-amber-300 group-hover:scale-110 transition-transform mb-3 shadow-inner">
                    <EmaPlaqueIcon size={28} color="#f59e0b" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-serif font-bold text-amber-100">
                    {isLoading
                      ? language === 'ja'
                        ? '境内の絵馬を読み込み中...'
                        : 'Loading shrine wall...'
                      : searchQuery
                      ? t.rack.emptyNoMatchTitle(searchQuery)
                      : selectedCategory !== 'all'
                      ? t.rack.emptyNoCatTitle(currentCategoryLabel)
                      : t.rack.emptyReadyTitle}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1.5 max-w-[220px] leading-relaxed">
                    {searchQuery
                      ? t.rack.emptyNoMatchDesc(searchQuery)
                      : t.rack.emptyReadyDesc}
                  </p>
                </div>

                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-red-600 text-white text-xs font-semibold shadow-md group-hover:from-amber-500 group-hover:to-red-500 transition-all">
                  <EmaPlaqueIcon size={14} color="#ffffff" />
                  <span>{searchQuery ? t.rack.emptyCarveQuery(searchQuery) : t.rack.emptyCarveFirst}</span>
                </span>
              </button>
            </div>

            {(searchQuery || selectedCategory !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  shrineAudio.playWoodClack();
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="text-xs font-mono text-amber-400 hover:text-amber-300 underline underline-offset-4"
              >
                {t.rack.resetFilters}
              </button>
            )}
          </div>
        )}
      </section>

      {/* 4. Polished Footer with Working Links (Extra mobile bottom padding for thumb dock) */}
      <footer className="pt-8 sm:pt-12 pb-24 sm:pb-8 border-t border-zinc-800/80 text-xs text-zinc-400">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2.5">
            <ToriiIcon size={18} color="#f59e0b" />
            <span className="font-medium text-zinc-300">{t.footer.brandTag}</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 font-mono text-[11px]">
            <button
              type="button"
              onClick={() => {
                shrineAudio.playWoodClack();
                onOpenHangModal();
              }}
              className="hover:text-amber-300 transition-colors inline-flex items-center gap-1"
            >
              <EmaPlaqueIcon size={13} />
              <span>{t.footer.hangLink}</span>
            </button>

            <span className="text-zinc-700">•</span>

            <button
              type="button"
              onClick={() => {
                shrineAudio.playWoodClack();
                onOpenTermsModal();
              }}
              className="hover:text-amber-300 transition-colors inline-flex items-center gap-1 underline underline-offset-4"
            >
              <CharterScrollIcon size={13} />
              <span>{t.footer.termsLink}</span>
            </button>

            {onOpenContactModal && (
              <>
                <span className="text-zinc-700">•</span>
                <button
                  type="button"
                  onClick={() => {
                    shrineAudio.playWoodClack();
                    onOpenContactModal();
                  }}
                  className="hover:text-amber-300 transition-colors inline-flex items-center gap-1 underline underline-offset-4"
                >
                  <ContactEnvelopeIcon size={13} color="#f59e0b" />
                  <span>{t.footer.contactLink}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};
