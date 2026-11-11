import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { EmaPlaque, ReportReason, ShrineStats, ShrineTag } from './types';
import { INITIAL_EMA_PLAQUES } from './data/emaData';
import { CourtyardCanvas } from './components/CourtyardCanvas';
import { Header } from './components/Header';
import { EmaWall } from './components/EmaWall';
import { HangEmaModal } from './components/HangEmaModal';
import { SouvenirModal } from './components/SouvenirModal';
import { TermsModal } from './components/TermsModal';
import { LanguageProvider } from './i18n/LanguageContext';
import { ThemeProvider } from './theme/ThemeContext';
import {
  tryRecordBellRing,
  decodeSafePlaqueFromHash
} from './utils/antiSpam';
import {
  filterSafePlaques,
  getHiddenPlaqueIds,
  reportAndHidePlaque,
  clearHiddenPlaques
} from './utils/aiGuardian';
import {
  fetchShrinePage,
  fetchPlaqueByCoordinate,
  createShrinePlaque,
  ringShrinePlaqueBell,
  deleteOwnShrinePlaque,
  reportShrinePlaqueApi,
  computeLocalStats
} from './utils/shrineApi';

const LOCAL_STORAGE_KEY = 'kamioshi_fresh_v5';
const DEFAULT_DOC_TITLE = 'Kamioshi.si — Wooden Plaque Wall (絵馬掛け)';

export const App: React.FC = () => {
  const [plaques, setPlaques] = useState<EmaPlaque[]>(INITIAL_EMA_PLAQUES);
  const [stats, setStats] = useState<ShrineStats>(() => computeLocalStats(INITIAL_EMA_PLAQUES));
  const [topRevered, setTopRevered] = useState<EmaPlaque[]>([]);
  const [popularTags, setPopularTags] = useState<ShrineTag[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [hiddenVersion, setHiddenVersion] = useState(0);
  const [selectedPlaque, setSelectedPlaque] = useState<EmaPlaque | null>(null);
  const [isHangModalOpen, setIsHangModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [initialOshiName, setInitialOshiName] = useState<string>('');

  // Shared filter & sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'bows'>('newest');

  // Subtle swing when hanging a new plaque or triggering a shrine breeze
  const [windSwinging, setWindSwinging] = useState(false);
  const windTimeoutRef = useRef<number | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Debounce search query (220ms) so fast typing does not waste D1 row reads
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 220);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  // Load first page from Cloudflare D1 (or local fallback) when filters/sort change
  const loadFirstPage = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await fetchShrinePage({
        category: selectedCategory,
        sort: sortBy,
        q: debouncedQuery,
        cursor: null
      });
      setPlaques(result.plaques);
      setNextCursor(result.nextCursor);
      setHasMore(result.hasMore);
      if (result.stats) setStats(result.stats);
      if (result.topRevered) setTopRevered(result.topRevered);
      if (result.popularTags) setPopularTags(result.popularTags);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, sortBy, debouncedQuery]);

  useEffect(() => {
    loadFirstPage();
  }, [loadFirstPage]);

  // Load next page of 24 plaques via keyset cursor
  const handleLoadMore = useCallback(async () => {
    if (!hasMore || !nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const result = await fetchShrinePage({
        category: selectedCategory,
        sort: sortBy,
        q: debouncedQuery,
        cursor: nextCursor
      });
      setPlaques((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const newItems = result.plaques.filter((p) => !existingIds.has(p.id));
        return [...prev, ...newItems];
      });
      setNextCursor(result.nextCursor);
      setHasMore(result.hasMore);
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, nextCursor, isLoadingMore, selectedCategory, sortBy, debouncedQuery]);

  const triggerShrineBreeze = () => {
    setWindSwinging(true);
    window.dispatchEvent(new CustomEvent('shrine-breeze'));
    if (windTimeoutRef.current) {
      window.clearTimeout(windTimeoutRef.current);
    }
    windTimeoutRef.current = window.setTimeout(() => {
      setWindSwinging(false);
    }, 2200);
  };

  const handleFocusSearch = () => {
    if (searchInputRef.current) {
      searchInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      window.setTimeout(() => {
        searchInputRef.current?.focus({ preventScroll: true });
      }, 220);
    }
  };

  // Visible plaques filtered through the Bottled AI Guardian & user's local hidden list
  const visiblePlaques = useMemo(() => {
    return filterSafePlaques(plaques);
  }, [plaques, hiddenVersion]);

  const visibleTopRevered = useMemo(() => {
    return filterSafePlaques(topRevered);
  }, [topRevered, hiddenVersion]);

  const hiddenCount = useMemo(() => {
    return getHiddenPlaqueIds().size;
  }, [hiddenVersion]);

  // O(1) next coordinate from D1 pre-aggregated stats (no array spread)
  const nextCoordinate = (stats.maxCoordinate || 0) + 1;

  // Handle URL hash routing on initial load and hashchange (e.g., #ema=1 or #ema=13&p=...)
  useEffect(() => {
    const handleHash = async () => {
      const hash = window.location.hash;
      if (!hash.startsWith('#ema=')) return;

      const decoded = decodeSafePlaqueFromHash(hash, plaques);
      if (decoded) {
        setSelectedPlaque(decoded);
        return;
      }

      // Direct D1 coordinate lookup when only #ema=<number> is present
      const params = new URLSearchParams(hash.slice(1));
      const coordNum = parseInt(params.get('ema') || '', 10);
      if (!isNaN(coordNum) && coordNum > 0) {
        const remotePlaque = await fetchPlaqueByCoordinate(coordNum);
        if (remotePlaque) {
          setSelectedPlaque(remotePlaque);
        }
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [plaques]);

  // Dynamically update document title when inspecting a plaque
  useEffect(() => {
    if (selectedPlaque) {
      document.title = `${selectedPlaque.kamioshiName} (Plaque #${selectedPlaque.coordinate}) — Kamioshi.si`;
    } else {
      document.title = DEFAULT_DOC_TITLE;
    }
  }, [selectedPlaque]);

  // Reset filters and scroll to top when clicking Header logo
  const handleResetHome = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSortBy('newest');
    setSelectedPlaque(null);
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle ringing bell on a plaque (optimistic UI + D1 atomic increment)
  const handleBow = (id: string) => {
    if (!tryRecordBellRing(id, true)) {
      return;
    }
    setPlaques((prev) =>
      prev.map((p) => (p.id === id ? { ...p, bowCount: p.bowCount + 1 } : p))
    );
    setTopRevered((prev) =>
      prev.map((p) => (p.id === id ? { ...p, bowCount: p.bowCount + 1 } : p))
    );
    setStats((prev) => ({
      ...prev,
      totalBells: prev.totalBells + 1
    }));
    setSelectedPlaque((prev) =>
      prev && prev.id === id ? { ...prev, bowCount: prev.bowCount + 1 } : prev
    );

    ringShrinePlaqueBell(id).then((serverBows) => {
      if (typeof serverBows === 'number') {
        setPlaques((prev) =>
          prev.map((p) => (p.id === id ? { ...p, bowCount: serverBows } : p))
        );
        setSelectedPlaque((prev) =>
          prev && prev.id === id ? { ...prev, bowCount: serverBows } : prev
        );
      }
    });
  };

  // Handle dedicating a new plaque (saved to Cloudflare D1 + local ownership record)
  const handleHangPlaque = async (
    newPlaqueData: Omit<EmaPlaque, 'id' | 'coordinate' | 'createdAt' | 'bowCount'>
  ) => {
    const { plaque: createdPlaque, stats: updatedStats } = await createShrinePlaque(newPlaqueData);

    setPlaques((prev) => [createdPlaque, ...prev.filter((p) => p.id !== createdPlaque.id)]);
    if (updatedStats) {
      setStats(updatedStats);
    } else {
      setStats((prev) => ({
        ...prev,
        totalPlaques: prev.totalPlaques + 1,
        totalBells: prev.totalBells + 1,
        maxCoordinate: Math.max(prev.maxCoordinate, createdPlaque.coordinate),
        categoryCounts: {
          ...prev.categoryCounts,
          all: (prev.categoryCounts.all || 0) + 1,
          [createdPlaque.category]: (prev.categoryCounts[createdPlaque.category] || 0) + 1
        }
      }));
    }

    setTopRevered((prev) =>
      [...prev.filter((p) => p.id !== createdPlaque.id), createdPlaque]
        .sort((a, b) => b.bowCount - a.bowCount)
        .slice(0, 3)
    );

    triggerShrineBreeze();
    setSelectedPlaque(createdPlaque);
  };

  // Delete an individual plaque owned by the current visitor
  const handleDeletePlaque = async (id: string) => {
    setPlaques((prev) => prev.filter((p) => p.id !== id));
    setTopRevered((prev) => prev.filter((p) => p.id !== id));
    setSelectedPlaque(null);

    const res = await deleteOwnShrinePlaque(id);
    if (res.stats) {
      setStats(res.stats);
    }
  };

  // Report & quarantine/hide a plaque from the user's local wall + notify D1 moderation counter
  const handleReportPlaque = (id: string, reason: ReportReason) => {
    reportAndHidePlaque(id, reason);
    reportShrinePlaqueApi(id, reason);
    setHiddenVersion((v) => v + 1);
    setSelectedPlaque(null);
  };

  // Restore hidden plaques
  const handleRestoreHidden = () => {
    clearHiddenPlaques();
    setHiddenVersion((v) => v + 1);
  };

  // Clear local browser cache from Terms & Conditions modal
  const handleClearPlaques = () => {
    setSelectedPlaque(null);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch {
      // ignore
    }
    loadFirstPage();
  };

  const openHangModal = (prefillOshi = '') => {
    setInitialOshiName(prefillOshi);
    setIsHangModalOpen(true);
  };

  return (
    <ThemeProvider>
      <LanguageProvider>
        <div className="min-h-[100dvh] bg-[#0c0a09] text-zinc-100 flex flex-col font-sans selection:bg-amber-600 selection:text-white relative shrine-app-shell">
          {/* 0. Blender-Rendered 3D Falling Pink Sakura Petals Background */}
          <CourtyardCanvas />

          {/* 1. Header Navigation & Mobile Thumb-Zone Bottom Dock */}
          <Header
            onOpenHangModal={() => openHangModal('')}
            onOpenTermsModal={() => setIsTermsModalOpen(true)}
            onResetHome={handleResetHome}
            onFocusSearch={handleFocusSearch}
            totalVows={stats.totalPlaques}
          />

          {/* 2. Main Ema Wall Grid */}
          <main className="flex-grow relative z-10">
            <EmaWall
              plaques={visiblePlaques}
              stats={stats}
              topRevered={visibleTopRevered}
              popularTags={popularTags}
              hasMore={hasMore}
              isLoading={isLoading}
              isLoadingMore={isLoadingMore}
              onLoadMore={handleLoadMore}
              sortBy={sortBy}
              setSortBy={setSortBy}
              windSwinging={windSwinging}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              searchInputRef={searchInputRef}
              onTriggerBreeze={triggerShrineBreeze}
              onBow={handleBow}
              onSelectPlaque={(plaque) => setSelectedPlaque(plaque)}
              onOpenHangModal={(prefill) => openHangModal(prefill || '')}
              onOpenTermsModal={() => setIsTermsModalOpen(true)}
            />
          </main>

          {/* 3. Hang Ema Plaque Modal */}
          <HangEmaModal
            isOpen={isHangModalOpen}
            onClose={() => setIsHangModalOpen(false)}
            onOpenTerms={() => setIsTermsModalOpen(true)}
            onHangPlaque={handleHangPlaque}
            nextCoordinate={nextCoordinate}
            initialOshiName={initialOshiName}
            existingPlaques={visiblePlaques}
          />

          {/* 4. Souvenir & Keepsake View Modal */}
          <SouvenirModal
            plaque={selectedPlaque}
            onClose={() => setSelectedPlaque(null)}
            onBow={handleBow}
            onDelete={handleDeletePlaque}
            onReport={handleReportPlaque}
          />

          {/* 5. Terms, Disclaimers & AI Safety Charter Modal */}
          <TermsModal
            isOpen={isTermsModalOpen}
            onClose={() => setIsTermsModalOpen(false)}
            plaques={visiblePlaques}
            hiddenCount={hiddenCount}
            onRestoreHidden={handleRestoreHidden}
            onClearPlaques={handleClearPlaques}
          />
        </div>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;
