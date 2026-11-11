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
  MidnightMoonIcon
} from './CustomIcons';

interface HeaderProps {
  onOpenHangModal: () => void;
  onOpenTermsModal: () => void;
  onOpenOmikujiModal?: () => void;
  onResetHome: () => void;
  totalVows: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenHangModal,
  onOpenTermsModal,
  onOpenOmikujiModal,
  onResetHome,
  totalVows
}) => {
  const { language, toggleLanguage, t } = useLanguage();
  const { theme, toggleTheme, isSakura } = useTheme();
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const toggleSound = () => {
    const isPlaying = shrineAudio.toggleMute();
    setIsPlayingAudio(isPlaying);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-zinc-950/85 backdrop-blur-xl border-b border-amber-900/25 shadow-lg">
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
              <span className="font-serif font-bold text-sm sm:text-lg tracking-wide text-amber-100 group-hover:text-white transition-colors truncate">
                kamioshi.si
              </span>
              <span className="hidden md:inline-block text-[11px] text-amber-300/80 font-mono px-2 py-0.5 rounded bg-amber-950/40 border border-amber-800/30">
                絵馬の壁
              </span>
            </div>
            <div className="text-[10px] sm:text-[11px] font-mono text-zinc-400 truncate">
              {totalVows === 0 ? t.header.subtitleEmpty : t.header.subtitleCount(totalVows)}
            </div>
          </div>
        </button>

        {/* Action Controls */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Subtle, Unintrusive Sound Icon (Looping Traditional Koto Music) */}
          <button
            type="button"
            onClick={toggleSound}
            aria-label={t.header.kotoAria}
            aria-pressed={isPlayingAudio}
            title={isPlayingAudio ? t.header.kotoTitleMute : t.header.kotoTitlePlay}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              isPlayingAudio
                ? 'text-amber-400/80 hover:text-amber-300 bg-amber-950/25'
                : 'text-zinc-600 hover:text-zinc-400 hover:bg-zinc-900/50 opacity-65 hover:opacity-100'
            }`}
          >
            {isPlayingAudio ? (
              <ZenAudioOnIcon size={14} color="currentColor" />
            ) : (
              <ZenAudioOffIcon size={14} color="currentColor" />
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
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-mono bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-amber-200 border border-zinc-800 hover:border-amber-700/50 transition-all active:scale-95 header-btn"
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
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-mono bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-amber-200 border border-zinc-800 hover:border-amber-700/50 transition-all active:scale-95 header-btn header-theme-toggle"
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

          {/* Omikuji Fortune Slip */}
          {onOpenOmikujiModal && (
            <button
              type="button"
              onClick={() => {
                shrineAudio.playWoodClack();
                onOpenOmikujiModal();
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-mono text-amber-300/90 hover:text-amber-200 hover:bg-amber-950/40 border border-transparent hover:border-amber-800/40 transition-colors"
              title={t.header.omikujiTitle}
            >
              <SacredSparkleIcon size={13} color="#f59e0b" />
              <span className="hidden md:inline">{t.header.omikujiBtn}</span>
            </button>
          )}

          {/* Terms & Conditions */}
          <button
            type="button"
            onClick={() => {
              shrineAudio.playWoodClack();
              onOpenTermsModal();
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-mono text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/70 border border-transparent hover:border-zinc-800 transition-colors"
            title={t.header.termsTitle}
          >
            <CharterScrollIcon size={14} />
            <span className="hidden sm:inline">{t.header.termsBtn}</span>
          </button>

          {/* Primary CTA: Hang a Plaque */}
          <button
            type="button"
            onClick={() => {
              shrineAudio.playWoodClack();
              onOpenHangModal();
            }}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-500 hover:to-red-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-red-950/40 transition-all active:scale-95"
          >
            <EmaPlaqueIcon size={15} color="#ffffff" />
            <span>{t.header.hangBtn}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
