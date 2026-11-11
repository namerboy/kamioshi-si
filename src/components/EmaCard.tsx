import React, { useState, useRef } from 'react';
import { EmaPlaque, WoodType, CordColor } from '../types';
import { CATEGORY_LABELS } from '../data/emaData';
import { shrineAudio } from '../audio/synth';
import { useLanguage } from '../i18n/LanguageContext';
import { hasRungBellForPlaque, encodePlaqueShareUrl } from '../utils/antiSpam';
import { SuzuBellIcon, LinkCrestIcon, CheckSealIcon } from './CustomIcons';

interface EmaCardProps {
  plaque: EmaPlaque;
  onBow: (id: string) => void;
  onSelect: (plaque: EmaPlaque) => void;
  windSwinging?: boolean;
  compact?: boolean;
  index?: number;
}

export interface WoodTheme {
  faceGradient: string;
  textureClass: string;
  textureUrl: string;
  edgeColor: string;
  roofColor: string;
  borderColor: string;
  textColor: string;
  mutedColor: string;
  inkColor: string;
  stampBg: string;
  stampBorder: string;
  grainOpacity: number;
  isLight: boolean;
}

export const getWoodTheme = (woodType: WoodType): WoodTheme => {
  switch (woodType) {
    case 'cedar':
      return {
        faceGradient: 'linear-gradient(155deg var(--in-oklab), #4b3322 0%, #362316 52%, #26170e 100%)',
        textureClass: 'ema-wood-surface ema-wood-cedar',
        textureUrl: '/textures/ema-cedar.jpg',
        edgeColor: '#1a0f08',
        roofColor: '#170d07',
        borderColor: '#6e4f37',
        textColor: '#f5ebd9',
        mutedColor: '#d4beaa',
        inkColor: '#fff8ed',
        stampBg: '#a32419',
        stampBorder: '#e05347',
        grainOpacity: 0.16,
        isLight: false
      };
    case 'vermilion':
      return {
        faceGradient: 'linear-gradient(155deg var(--in-oklab), #992218 0%, #78170f 52%, #570e08 100%)',
        textureClass: 'ema-wood-surface ema-wood-vermilion',
        textureUrl: '/textures/ema-vermilion.jpg',
        edgeColor: '#380703',
        roofColor: '#26180f',
        borderColor: '#d97706',
        textColor: '#fff5e6',
        mutedColor: '#f7d4bc',
        inkColor: '#ffffff',
        stampBg: '#d97706',
        stampBorder: '#fde68a',
        grainOpacity: 0.10,
        isLight: false
      };
    case 'obsidian':
      return {
        faceGradient: 'linear-gradient(155deg var(--in-oklab), #24262b 0%, #16181c 52%, #0d0e11 100%)',
        textureClass: 'ema-wood-surface ema-wood-obsidian',
        textureUrl: '/textures/ema-obsidian.jpg',
        edgeColor: '#060708',
        roofColor: '#362415',
        borderColor: '#4b505e',
        textColor: '#f3f4f6',
        mutedColor: '#b6bcc8',
        inkColor: '#ffffff',
        stampBg: '#b91c1c',
        stampBorder: '#f87171',
        grainOpacity: 0.14,
        isLight: false
      };
    case 'sandalwood':
      return {
        faceGradient: 'linear-gradient(155deg var(--in-oklab), #f3ead8 0%, #e5d6bc 52%, #d4c09e 100%)',
        textureClass: 'ema-wood-surface ema-wood-sandalwood',
        textureUrl: '/textures/ema-sandalwood.jpg',
        edgeColor: '#9e845c',
        roofColor: '#4a3520',
        borderColor: '#fff9ed',
        textColor: '#2b1a0c',
        mutedColor: '#5e452d',
        inkColor: '#170c04',
        stampBg: '#b91c1c',
        stampBorder: '#ef4444',
        grainOpacity: 0.12,
        isLight: true
      };
    case 'kinpaku':
      return {
        faceGradient: 'linear-gradient(155deg var(--in-oklab), #e3be66 0%, #c89d3c 50%, #9e751e 100%)',
        textureClass: 'ema-wood-surface ema-wood-kinpaku',
        textureUrl: '/textures/ema-kinpaku.jpg',
        edgeColor: '#5c410a',
        roofColor: '#21170b',
        borderColor: '#fef08a',
        textColor: '#211403',
        mutedColor: '#473009',
        inkColor: '#120a01',
        stampBg: '#991b1b',
        stampBorder: '#fca5a5',
        grainOpacity: 0.12,
        isLight: true
      };
    case 'hinoki':
    default:
      return {
        faceGradient: 'linear-gradient(155deg var(--in-oklab), #dec39f 0%, #cca97e 52%, #b89265 100%)',
        textureClass: 'ema-wood-surface ema-wood-hinoki',
        textureUrl: '/textures/ema-hinoki.jpg',
        edgeColor: '#785836',
        roofColor: '#3b2514',
        borderColor: '#f2dab8',
        textColor: '#241609',
        mutedColor: '#523921',
        inkColor: '#120903',
        stampBg: '#b91c1c',
        stampBorder: '#f87171',
        grainOpacity: 0.14,
        isLight: true
      };
  }
};

export const getCordStyle = (cord?: CordColor) => {
  switch (cord) {
    case 'gold':
      return { main: '#d97706', knot: '#b45309', highlight: '#fde68a' };
    case 'violet':
      return { main: '#7c3aed', knot: '#5b21b6', highlight: '#ddd6fe' };
    case 'jade':
      return { main: '#059669', knot: '#065f46', highlight: '#a7f3d0' };
    case 'crimson':
    default:
      return { main: '#dc2626', knot: '#991b1b', highlight: '#fca5a5' };
  }
};

export const EmaCard: React.FC<EmaCardProps> = ({
  plaque,
  onBow,
  onSelect,
  windSwinging = false,
  compact = false,
  index = 0
}) => {
  const { t } = useLanguage();
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [isSwinging, setIsSwinging] = useState(false);
  const [hasBowedRecently, setHasBowedRecently] = useState(false);
  const [alreadyRung, setAlreadyRung] = useState(() => hasRungBellForPlaque(plaque.id));
  const [copiedLink, setCopiedLink] = useState(false);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, sheenX: 50, sheenY: 30, active: false });

  const isBellRung = alreadyRung || hasRungBellForPlaque(plaque.id);
  const categoryMeta = CATEGORY_LABELS[plaque.category] || CATEGORY_LABELS.other;
  const theme = getWoodTheme(plaque.woodType);
  const cord = getCordStyle(plaque.cordColor);

  // Dynamic relative timestamp calculation
  const { relativeTimeStr, isFreshlyHung } = React.useMemo(() => {
    const createdMs = new Date(plaque.createdAt).getTime();
    if (Number.isNaN(createdMs)) {
      return { relativeTimeStr: '', isFreshlyHung: false };
    }
    const diffSec = Math.max(0, Math.floor((Date.now() - createdMs) / 1000));
    if (diffSec < 90) {
      return { relativeTimeStr: t.card.justNow, isFreshlyHung: true };
    }
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) {
      return { relativeTimeStr: t.card.minutesAgo(diffMin), isFreshlyHung: diffMin <= 5 };
    }
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) {
      return { relativeTimeStr: t.card.hoursAgo(diffHours), isFreshlyHung: false };
    }
    const diffDays = Math.floor(diffHours / 24);
    return { relativeTimeStr: t.card.daysAgo(diffDays), isFreshlyHung: false };
  }, [plaque.createdAt, t]);

  const updateTiltFromPointer = (clientX: number, clientY: number) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const px = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const py = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
    const ry = (px - 0.5) * 11;
    const rx = (0.5 - py) * 9;
    setTilt({
      rx,
      ry,
      sheenX: Math.round(px * 100),
      sheenY: Math.round(py * 100),
      active: true
    });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    updateTiltFromPointer(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    updateTiltFromPointer(e.clientX, e.clientY);
  };

  const handlePointerLeave = () => {
    setTilt({ rx: 0, ry: 0, sheenX: 50, sheenY: 30, active: false });
  };

  const handleBowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.nativeEvent.isTrusted === false) return;

    shrineAudio.playWoodClack();
    shrineAudio.playShrineBell(680 + (plaque.coordinate % 5) * 40);
    setIsSwinging(true);
    setTimeout(() => setIsSwinging(false), 1050);

    if (!isBellRung) {
      setHasBowedRecently(true);
      setAlreadyRung(true);
      onBow(plaque.id);
      setTimeout(() => setHasBowedRecently(false), 1600);
    }
  };

  const handleQuickShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = encodePlaqueShareUrl(plaque);
    navigator.clipboard.writeText(url);
    shrineAudio.playWoodClack();
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 1800);
  };

  const isActivelySwinging = isSwinging || windSwinging;
  const safeTransitionId = plaque.id.replace(/[^a-zA-Z0-9_-]/g, '');

  return (
    <div className="ema-card-container w-full flex justify-center">
      <article
        ref={cardRef}
        onClick={() => {
          shrineAudio.playWoodClack();
          onSelect(plaque);
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerLeave}
        onPointerCancel={handlePointerLeave}
        onPointerLeave={handlePointerLeave}
        className={`group relative w-full flex flex-col items-center cursor-pointer select-none ${
          isActivelySwinging ? 'animate-ema-swing' : ''
        }`}
        style={{
          perspective: '1100px',
          animationDelay: windSwinging && !isSwinging ? `${(index % 6) * 75}ms` : '0ms',
          viewTransitionName: isActivelySwinging ? undefined : `ema-${safeTransitionId}`
        }}
      >
        {/* Floating +1 Chime Spark on Bell Ring */}
        {hasBowedRecently && (
          <div className="pointer-events-none absolute -top-3 z-30 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500 text-zinc-950 font-mono font-bold text-xs shadow-lg animate-float-spark">
            <SuzuBellIcon size={12} color="#09090b" />
            <span>+1</span>
          </div>
        )}

        {/* 1. Brass Peg & Braided Silk Cord (組紐) */}
        <div className="relative flex flex-col items-center -mb-3 z-20 pointer-events-none">
          {/* Brass Hook on Beam */}
          <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-b from-amber-300 via-amber-600 to-amber-900 border border-amber-200/60 shadow-md" />
          {/* Upper Braided Cord */}
          <div
            className="w-1 h-6 shadow-sm"
            style={{
              background: `repeating-linear-gradient(45deg, ${cord.main}, ${cord.main} 2px, ${cord.knot} 2px, ${cord.knot} 4px)`
            }}
          />
          {/* Traditional Agemaki Shrine Knot */}
          <div className="relative flex items-center justify-center -my-1">
            <div
              className="w-4 h-2.5 rounded-full border shadow-sm"
              style={{ backgroundColor: cord.knot, borderColor: cord.highlight }}
            />
            <div
              className="absolute w-2.5 h-3 rounded-sm rotate-45 border"
              style={{ backgroundColor: cord.main, borderColor: cord.highlight }}
            />
          </div>
          {/* Lower Cord Tail entering Grommet */}
          <div className="w-1 h-3.5" style={{ backgroundColor: cord.main }} />
        </div>

        {/* 2. 3D Tilting Wooden Ema Tablet */}
        <div
          className="relative w-full flex justify-center transition-transform duration-200 ease-out ema-pentagon-shadow"
          style={{
            transform: tilt.active
              ? `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) translateY(-3px)`
              : 'rotateX(0deg) rotateY(0deg) translateY(0px)',
            transformStyle: 'preserve-3d'
          }}
        >
          {/* 3D Wood Bottom Thickness Lip */}
          <div
            className={`${compact ? 'w-full max-w-[270px]' : 'w-full max-w-[330px] sm:w-80'} rounded-b-lg`}
            style={{
              backgroundColor: theme.edgeColor,
              paddingBottom: '6px',
              clipPath: 'polygon(50% 0%, 100% 13%, 100% 100%, 0% 100%, 0% 13%)'
            }}
          >
            {/* Main Pentagonal Plaque Face with Blender-baked 2.5D wood & bevel relief */}
            <div
              className={`ema-card-face relative w-full rounded-b-md overflow-hidden p-4 pt-3 flex flex-col justify-between ${theme.textureClass}`}
              style={{
                backgroundColor: theme.edgeColor,
                color: theme.textColor,
                minHeight: compact ? '200px' : '244px',
                clipPath: 'polygon(50% 0%, 100% 13%, 100% 100%, 0% 100%, 0% 13%)'
              }}
            >
              {/* Full 5-Sided Pentagonal SVG Border */}
              <svg
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 w-full h-full z-20"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <polygon
                  points="50,0.6 99.4,13.2 99.4,99.4 0.6,99.4 0.6,13.2"
                  fill="none"
                  stroke={theme.borderColor}
                  strokeWidth="1.5"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>

              {/* Interactive Specular Sunlight Sheen (scoped inside isolation: isolate) */}
              <div
                className="pointer-events-none absolute inset-0 transition-opacity duration-300 mix-blend-soft-light"
                style={{
                  opacity: tilt.active ? 0.45 : 0,
                  background: `radial-gradient(circle at ${tilt.sheenX}% ${tilt.sheenY}%, rgba(255, 250, 220, 0.72) 0%, transparent 62%)`
                }}
              />

              {/* Brass Grommet Eyelet Hole */}
              <div className="relative z-10 flex justify-center items-center pt-1.5 mb-1.5">
                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-amber-300 via-amber-700 to-amber-950 p-0.5 shadow-md flex items-center justify-center">
                  <div className="w-full h-full rounded-full bg-zinc-950 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cord.main }} />
                  </div>
                </div>
              </div>

              {/* Top Meta Row: Coordinate Number, Live Relative Time & Category Pill */}
              <div className="relative z-10 flex items-center justify-between gap-1.5 px-1 text-[11px] font-mono tracking-wider mb-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="font-bold opacity-90 shrink-0"
                    style={{ color: theme.mutedColor }}
                  >
                    #{plaque.coordinate.toLocaleString()}
                  </span>
                  {relativeTimeStr && (
                    <span
                      className="ema-card-time inline-flex items-center gap-1 text-[9px] opacity-75 truncate"
                      style={{ color: theme.mutedColor }}
                    >
                      {isFreshlyHung && (
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                      )}
                      <span>{relativeTimeStr}</span>
                    </span>
                  )}
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border shadow-sm shrink-0 ${categoryMeta.badgeClass}`}>
                  {categoryMeta.renderIcon({ size: 11 })}
                  <span className="ema-card-cat-label">{t.categories[plaque.category] || categoryMeta.label}</span>
                </span>
              </div>

              {/* Center: Oshi Name in Bold Calligraphic Serif (Fluid Container Scaling) */}
              <div className="relative z-10 my-1 text-center px-1.5">
                <h3
                  className="ema-card-title font-bold tracking-tight font-serif leading-tight break-words"
                  style={{
                    color: theme.inkColor,
                    textShadow: theme.isLight ? '0 1px 0 rgba(255,255,255,0.4)' : '0 1px 2px rgba(0,0,0,0.6)'
                  }}
                >
                  {plaque.kamioshiName}
                </h3>
              </div>

              {/* Heartfelt Message */}
              <div className="relative z-10 my-1.5 px-2 flex-grow flex items-center justify-center">
                <p
                  className="ema-card-message text-xs sm:text-[13px] italic leading-relaxed text-center font-sans"
                  style={{ color: theme.textColor }}
                >
                  “{plaque.message}”
                </p>
              </div>

              {/* Author, City & Double-Ringed Vermilion Hanko Seal */}
              <div
                className="relative z-10 pt-2 border-t flex items-end justify-between gap-2 px-1"
                style={{ borderColor: theme.isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)' }}
              >
                <div className="flex flex-col text-[11px] leading-tight min-w-0">
                  <span className="font-semibold truncate" style={{ color: theme.inkColor }}>
                    {plaque.authorName || t.card.defaultAuthor}
                  </span>
                  <span className="text-[10px] opacity-80 truncate mt-0.5" style={{ color: theme.mutedColor }}>
                    {plaque.location || t.card.defaultLocation}
                  </span>
                </div>

                {/* Traditional Double-Bordered Vermilion Hanko Stamp */}
                <div
                  className="ema-hanko-stamp flex-shrink-0 w-8 h-8 rounded-[4px] p-[2px] shadow-md transform -rotate-6 transition-transform group-hover:rotate-0"
                  style={{
                    backgroundColor: theme.stampBg,
                    border: `1.5px solid ${theme.stampBorder}`
                  }}
                  title={`Seal: ${plaque.stamp}`}
                >
                  <div className="w-full h-full border border-white/35 rounded-[2px] flex items-center justify-center font-serif text-white font-bold text-sm leading-none">
                    {plaque.stamp}
                  </div>
                </div>
              </div>

              {/* Interactive Action Bar: Ring Bell, Share Link, View Keepsake */}
              <div
                className="ema-card-actions relative z-10 mt-2.5 pt-2 border-t flex items-center justify-between gap-1.5 text-xs"
                style={{ borderColor: theme.isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)' }}
              >
                <button
                  type="button"
                  onClick={handleBowClick}
                  aria-pressed={isBellRung}
                  className={`inline-flex items-center gap-1.5 min-h-[28px] px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all duration-200 border ${
                    hasBowedRecently
                      ? 'bg-amber-500 text-zinc-950 border-amber-300 scale-105 shadow-md'
                      : isBellRung
                      ? theme.isLight
                        ? 'bg-amber-900/15 text-amber-950 border-amber-800/30'
                        : 'bg-amber-500/20 text-amber-200 border-amber-500/35'
                      : theme.isLight
                      ? 'bg-black/10 hover:bg-black/20 text-zinc-900 border-black/15'
                      : 'bg-white/10 hover:bg-white/20 text-white border-white/15'
                  }`}
                >
                  {isBellRung ? <CheckSealIcon size={12} /> : <SuzuBellIcon size={13} />}
                  <span className="ema-card-bell-label">{isBellRung ? t.card.bellRung : t.card.ringBell}</span>
                  <span className="font-mono text-[10px] opacity-90">({plaque.bowCount})</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleQuickShare}
                    className={`inline-flex items-center gap-1 min-h-[28px] px-2 py-1 rounded-md text-[10px] font-mono transition-colors ${
                      copiedLink
                        ? 'bg-emerald-600 text-white'
                        : theme.isLight
                        ? 'hover:bg-black/10 text-zinc-800'
                        : 'hover:bg-white/10 text-zinc-200'
                    }`}
                    title="Copy direct link to this plaque"
                  >
                    {copiedLink ? <CheckSealIcon size={11} /> : <LinkCrestIcon size={12} />}
                    <span className="ema-card-share-label">{copiedLink ? t.card.copied : t.card.share}</span>
                  </button>

                  <span
                    className="ema-card-keepsake-hint px-1.5 py-1 text-[10px] font-mono font-semibold opacity-75 group-hover:opacity-100 transition-opacity"
                    style={{ color: theme.mutedColor }}
                  >
                    {t.card.keepsake} →
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
};
