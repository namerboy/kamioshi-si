import React, { useState, useEffect, useRef, useMemo } from 'react';
import { EmaPlaque, ReportReason } from './types';
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
  sanitizeStoredPlaques,
  tryRecordBellRing,
  decodeSafePlaqueFromHash
} from './utils/antiSpam';
import {
  filterSafePlaques,
  getHiddenPlaqueIds,
  reportAndHidePlaque,
  clearHiddenPlaques
} from './utils/aiGuardian';

const LOCAL_STORAGE_KEY = 'kamioshi_fresh_v5';
const DEFAULT_DOC_TITLE = 'Kamioshi.si — Wooden Plaque Wall (絵馬掛け)';

export const App: React.FC = () => {
  const [plaques, setPlaques] = useState<EmaPlaque[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const sanitized = sanitizeStoredPlaques(JSON.parse(saved));
        if (sanitized) return sanitized;
      }
    } catch {
      // safe fallback
    }
    return INITIAL_EMA_PLAQUES;
  });

  const [hiddenVersion, setHiddenVersion] = useState(0);
  const [selectedPlaque, setSelectedPlaque] = useState<EmaPlaque | null>(null);
  const [isHangModalOpen, setIsHangModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [initialOshiName, setInitialOshiName] = useState<string>('');

  // Shared filter state so Header Home button & EmaWall stay in sync
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Subtle swing when hanging a new plaque or triggering a shrine breeze
  const [windSwinging, setWindSwinging] = useState(false);
  const windTimeoutRef = useRef<number | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  // Live cross-tab synchronization via storage event
  useEffect(() => {
    const handleStorageSync = (e: StorageEvent) => {
      if (e.key === LOCAL_STORAGE_KEY && e.newValue) {
        try {
          const sanitized = sanitizeStoredPlaques(JSON.parse(e.newValue));
          if (sanitized) setPlaques(sanitized);
        } catch {
          // ignore malformed cross-tab data
        }
      } else if (e.key === LOCAL_STORAGE_KEY && e.newValue === null) {
        setPlaques([]);
      }
    };
    window.addEventListener('storage', handleStorageSync);
    return () => window.removeEventListener('storage', handleStorageSync);
  }, []);

  // Visible plaques filtered through the Bottled AI Guardian & user's local hidden list
  const visiblePlaques = useMemo(() => {
    return filterSafePlaques(plaques);
  }, [plaques, hiddenVersion]);

  const hiddenCount = useMemo(() => {
    return getHiddenPlaqueIds().size;
  }, [hiddenVersion]);

  // Compute next coordinate number (starts at #1 if empty, otherwise max + 1)
  const nextCoordinate =
    plaques.length > 0
      ? Math.max(...plaques.map((p) => p.coordinate || 0)) + 1
      : 1;

  // Handle URL hash routing on initial load and hashchange (e.g., #ema=1 or #ema=13&p=...)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#ema=')) {
        const decoded = decodeSafePlaqueFromHash(hash, plaques);
        if (decoded) {
          setSelectedPlaque(decoded);
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
    setSelectedPlaque(null);
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle ringing bell on a plaque (rate-limited & deduplicated per plaque)
  const handleBow = (id: string) => {
    if (!tryRecordBellRing(id, true)) {
      return;
    }
    setPlaques((prev) => {
      const updated = prev.map((p) => (p.id === id ? { ...p, bowCount: p.bowCount + 1 } : p));
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // quota fallback
      }
      return updated;
    });
    setSelectedPlaque((prev) =>
      prev && prev.id === id ? { ...prev, bowCount: prev.bowCount + 1 } : prev
    );
  };

  // Handle dedicating a new plaque
  const handleHangPlaque = (
    newPlaqueData: Omit<EmaPlaque, 'id' | 'coordinate' | 'createdAt' | 'bowCount'>
  ) => {
    const newPlaque: EmaPlaque = {
      ...newPlaqueData,
      id: `ema_${Date.now()}`,
      coordinate: nextCoordinate,
      bowCount: 1,
      createdAt: new Date().toISOString()
    };

    setPlaques((prev) => {
      const updated = [newPlaque, ...prev];
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated.slice(0, 200)));
      } catch {
        // storage quota fallback
      }
      return updated;
    });

    triggerShrineBreeze();

    setSelectedPlaque(newPlaque);
  };

  // Delete an individual plaque
  const handleDeletePlaque = (id: string) => {
    setPlaques((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // quota fallback
      }
      return updated;
    });
    setSelectedPlaque(null);
  };

  // Report & quarantine/hide a plaque from the user's local wall
  const handleReportPlaque = (id: string, reason: ReportReason) => {
    reportAndHidePlaque(id, reason);
    setHiddenVersion((v) => v + 1);
    setSelectedPlaque(null);
  };

  // Restore hidden plaques
  const handleRestoreHidden = () => {
    clearHiddenPlaques();
    setHiddenVersion((v) => v + 1);
  };

  // Clear all local plaques from Terms & Conditions modal
  const handleClearPlaques = () => {
    setPlaques([]);
    setSelectedPlaque(null);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch {
      // ignore
    }
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
          totalVows={visiblePlaques.length}
        />

        {/* 2. Main Ema Wall Grid */}
        <main className="flex-grow relative z-10">
          <EmaWall
            plaques={visiblePlaques}
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
