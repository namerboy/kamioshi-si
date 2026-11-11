import React, { useState } from 'react';
import { shrineAudio } from '../audio/synth';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../theme/ThemeContext';
import { 
  ToriiIcon, 
  ZenAudioOnIcon, 
  ZenAudioOffIcon, 
  EmaPlaqueIcon, 
  CharterScrollIcon,
  LanguageGlobeIcon,
  SacredSparkleIcon,
  SakuraSunIcon,
  MidnightMoonIcon,
  BrushSearchIcon,
  ContactEnvelopeIcon
} from './CustomIcons';

interface HeaderProps {
  onOpenHangModal: () => void;
  onOpenTermsModal: () => void;
  onOpenContactModal?: () => void;
  onResetHome: () => void;
  onFocusSearch?: () => void;
  totalVows: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenHangModal,
  onOpenTermsModal,
  onOpenContactModal,
  onResetHome,
  onFocusSearch,
  totalVows
}) => {
  const { language, toggleLanguage, t } = useLanguage();
  const { toggleTheme, isSakura } = useTheme();
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const toggleSound = () => {
    const isPlaying = shrineAudio.toggleMute();
    setIsPlayingAudio(isPlaying);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-zinc-950/85 backdrop-blur-xl border-b border-amber-900/25 shadow-lg pt-[env(safe-area-inset-top)]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
          {/* Clickable Brand Crest */}
          <button
            type="button"
            onClick={() => {
              shrineAudio.playWoodClack();
              onResetHome();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="group flex items-center gap-2.5 sm:gap-3 text-left focus:outline-none min-w-0"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-gradient-to-br from-amber-600/30 via-red-800/30 to-zinc-900 border border-amber-500/40 flex items-center justify-center shadow-md group-hover:border-amber-400 transition-colors">
              <ToriiIcon size={20} color="#f59e0b" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-base sm:text-lg tracking-wide text-amber-100 group-hover:text-white transition-colors truncate">
                  kamioshi.si
                </span>
                <span className="hidden md:inline-block text-[11px] text-amber-300/80 font-mono px-2 py-0.5 rounded bg-amber-950/40 border border-amber-800/30">
                  絵馬の壁
                </span>
              </div>
              <div className="text-[10px] sm:text-[11px] font-mono text-zinc-400 truncate flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="truncate">
                  {totalVows === 0 ? t.header.subtitleEmpty : t.header.subtitleCount(totalVows)}
                </span>
              </div>
            </div>
          </button>

          {/* Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Subtle, Unintrusive Sound Icon (Looping Traditional Koto Music) */}
            <button
              type="button"
              onClick={toggleSound}
              aria-label={t.header.kotoAria}
              aria-pressed={isPlayingAudio}
              title={isPlayingAudio ? t.header.kotoTitleMute : t.header.kotoTitlePlay}
              className={`min-w-[36px] min-h-[36px] rounded-xl flex items-center justify-center transition-all ${
                isPlayingAudio
                  ? 'text-amber-400 hover:text-amber-300 bg-amber-950/40 border border-amber-700/40'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/60 border border-transparent opacity-80 hover:opacity-100'
              }`}
            >
              {isPlayingAudio ? (
                <ZenAudioOnIcon size={15} color="currentColor" />
              ) : (
                <ZenAudioOffIcon size={15} color="currentColor" />
              )}
            </button>

            {/* Language Toggle: English <-> Japanese */}
            <button
              type="button"
              onClick={() => {
                shrineAudio.playWoodClack();
                toggleLanguage();
              }}
              aria-label={t.header.langToggleAria}
              className="inline-flex items-center justify-center gap-1.5 min-h-[36px] px-2.5 py-1.5 rounded-xl text-xs font-mono bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-amber-200 border border-zinc-800 hover:border-amber-700/50 transition-all active:scale-95 header-btn"
              title={language === 'en' ? '日本語に切り替え' : 'Switch to English'}
            >
              <LanguageGlobeIcon size={14} color="#f59e0b" />
              <span lang={language === 'en' ? 'ja' : 'en'} className="font-semibold text-[11px] sm:text-xs">
                {language === 'en' ? '日本語' : 'EN'}
              </span>
            </button>

            {/* Theme Toggle: Midnight 🌙 <-> Sakura 🌸 */}
            <button
              type="button"
              onClick={() => {
                shrineAudio.playWoodClack();
                toggleTheme();
              }}
              aria-label={t.header.themeToggleAria}
              aria-pressed={isSakura}
              className="inline-flex items-center justify-center gap-1.5 min-h-[36px] px-2.5 py-1.5 rounded-xl text-xs font-mono bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-amber-200 border border-zinc-800 hover:border-amber-700/50 transition-all active:scale-95 header-btn header-theme-toggle"
              title={isSakura ? t.header.themeMidnightTitle : t.header.themeSakuraTitle}
            >
              {isSakura ? (
                <SakuraSunIcon size={14} color="#f43f5e" />
              ) : (
                <MidnightMoonIcon size={13} color="#f59e0b" />
              )}
              <span className="font-semibold text-[11px] sm:text-xs">
                {isSakura ? t.header.themeSakuraBtn : t.header.themeMidnightBtn}
              </span>
            </button>

            {/* Terms & Conditions */}
            <button
              type="button"
              onClick={() => {
                shrineAudio.playWoodClack();
                onOpenTermsModal();
              }}
              className="hidden sm:inline-flex items-center gap-1.5 min-h-[36px] px-2.5 py-1.5 rounded-xl text-xs font-mono text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/70 border border-transparent hover:border-zinc-800 transition-colors"
              title={t.header.termsTitle}
            >
              <CharterScrollIcon size={14} />
              <span className="hidden md:inline">{t.header.termsBtn}</span>
            </button>

            {/* Contact / Shrine Inquiries */}
            {onOpenContactModal && (
              <button
                type="button"
                onClick={() => {
                  shrineAudio.playWoodClack();
                  onOpenContactModal();
                }}
                className="hidden sm:inline-flex items-center gap-1.5 min-h-[36px] px-2.5 py-1.5 rounded-xl text-xs font-mono text-zinc-400 hover:text-amber-200 hover:bg-zinc-900/70 border border-transparent hover:border-zinc-800 transition-colors"
                title={t.header.contactTitle}
              >
                <ContactEnvelopeIcon size={14} color="#f59e0b" />
                <span className="hidden lg:inline">{t.header.contactBtn}</span>
              </button>
            )}

            {/* Primary CTA: Hang a Plaque */}
            <button
              type="button"
              onClick={() => {
                shrineAudio.playWoodClack();
                onOpenHangModal();
              }}
              className="hidden sm:inline-flex items-center gap-2 min-h-[38px] px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-500 hover:to-red-500 text-white font-semibold text-sm shadow-lg shadow-red-950/40 transition-all active:scale-95"
            >
              <EmaPlaqueIcon size={15} color="#ffffff" />
              <span>{t.header.hangBtn}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile-First Thumb-Zone Bottom Dock (Visible on Mobile < 640px) */}
      <nav
        aria-label="Primary Mobile"
        className="sm:hidden fixed inset-x-0 bottom-0 z-40 bg-zinc-950/92 backdrop-blur-xl border-t border-amber-900/35 shadow-[0_-8px_30px_rgba(0,0,0,0.6)] mobile-bottom-dock"
      >
        <div className="grid grid-cols-4 items-center px-3 pt-1.5 pb-[max(0.45rem,env(safe-area-inset-bottom))]">
          {/* 1. Wall / Home */}
          <button
            type="button"
            onClick={() => {
              shrineAudio.playWoodClack();
              onResetHome();
            }}
            className="flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl text-zinc-400 hover:text-amber-300 active:scale-95 transition-all mobile-dock-item"
          >
            <ToriiIcon size={17} color="currentColor" />
            <span className="text-[10px] font-mono font-medium leading-tight">{t.header.mobileDockWall}</span>
          </button>

          {/* 2. Search */}
          <button
            type="button"
            onClick={() => {
              shrineAudio.playWoodClack();
              if (onFocusSearch) {
                onFocusSearch();
              }
            }}
            className="flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl text-zinc-400 hover:text-amber-300 active:scale-95 transition-all mobile-dock-item"
          >
            <BrushSearchIcon size={16} color="currentColor" />
            <span className="text-[10px] font-mono font-medium leading-tight">{t.header.mobileDockSearch}</span>
          </button>

          {/* 3. Center Elevated Primary CTA: Carve Plaque */}
          <div className="flex justify-center -mt-4">
            <button
              type="button"
              onClick={() => {
                shrineAudio.playWoodClack();
                onOpenHangModal();
              }}
              className="flex flex-col items-center justify-center gap-0.5 px-3.5 py-2 rounded-2xl bg-gradient-to-br from-amber-500 via-red-600 to-red-700 text-white shadow-lg shadow-red-950/60 border border-amber-300/40 active:scale-95 transition-transform"
            >
              <EmaPlaqueIcon size={18} color="#ffffff" />
              <span className="text-[10px] font-serif font-bold tracking-wide leading-tight">
                {t.header.mobileDockCarve}
              </span>
            </button>
          </div>

          {/* 4. Charter & Local Backup */}
          <button
            type="button"
            onClick={() => {
              shrineAudio.playWoodClack();
              onOpenTermsModal();
            }}
            className="flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl text-zinc-400 hover:text-amber-300 active:scale-95 transition-all mobile-dock-item"
          >
            <CharterScrollIcon size={16} color="currentColor" />
            <span className="text-[10px] font-mono font-medium leading-tight">{t.header.mobileDockTerms}</span>
          </button>
        </div>
      </nav>
    </>
  );
};
