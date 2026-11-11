import React, { useState, useEffect, useRef, useMemo } from 'react';
import { EmaPlaque, PlaqueCategory, SacredStamp, WoodType, CordColor } from '../types';
import { shrineAudio } from '../audio/synth';
import { useLanguage } from '../i18n/LanguageContext';
import { Language } from '../i18n/translations';
import { getWoodTheme, getCordStyle } from './EmaCard';
import { closeTopLayer, isPointOutsideDialog } from '../utils/dialogUtils';
import {
  sanitizePlaqueText,
  detectSpamOrGibberish,
  validatePlaqueSubmission,
  recordPlaqueSubmission,
  getPlaqueCooldownStatus,
  computePlaqueProofOfWork
} from '../utils/antiSpam';
import {
  evaluateWithBottledMonitor,
  evaluatePlaqueSafetyAsync,
  prewarmGuardianSession
} from '../utils/aiGuardian';
import { 
  ToriiIcon, 
  EmaPlaqueIcon, 
  SacredSparkleIcon, 
  CloseSealIcon,
  CheckSealIcon
} from './CustomIcons';

interface HangEmaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTerms: () => void;
  onHangPlaque: (plaque: Omit<EmaPlaque, 'id' | 'coordinate' | 'createdAt' | 'bowCount'>) => void;
  nextCoordinate: number;
  initialOshiName?: string;
  existingPlaques?: EmaPlaque[];
}

const CATEGORIES: { id: PlaqueCategory; label: string }[] = [
  { id: 'vtuber', label: 'VTuber / Virtual Talent' },
  { id: 'anime', label: 'Anime / Manga / Character' },
  { id: 'esports', label: 'Gaming / Esports' },
  { id: 'music', label: 'Music / Band / Song' },
  { id: 'kpop', label: 'Pop / Idol Group' },
  { id: 'athlete', label: 'Sports / Athlete / Team' },
  { id: 'place', label: 'Place / City / Cafe' },
  { id: 'pet', label: 'Pet / Animal / Nature' },
  { id: 'tech', label: 'Tool / Craft / Open Source' },
  { id: 'creator', label: 'Creator / Writer / Artist' },
  { id: 'icon', label: 'Historical / Legend / Family' },
  { id: 'other', label: 'Anything Else' }
];

const STAMPS: SacredStamp[] = ['推', '神', '愛', '祈', '勝', '光', '寿', '絆'];

const STAMP_LABELS: Record<Language, Record<SacredStamp, string>> = {
  en: { '推': 'Oshi', '神': 'Kami', '愛': 'Love', '祈': 'Wish', '勝': 'Win', '光': 'Light', '寿': 'Bless', '絆': 'Bond' },
  ja: { '推': '推し', '神': '神推し', '愛': '愛', '祈': '祈願', '勝': '必勝', '光': '輝き', '寿': '寿', '絆': '絆' }
};

const WOOD_TYPES: { id: WoodType; name: string; jp: string; swatch: string }[] = [
  { id: 'hinoki', name: 'Hinoki Cypress', jp: '檜 (ヒノキ)', swatch: 'linear-gradient(135deg, #dec39f, #b89265)' },
  { id: 'sandalwood', name: 'Pale Sandalwood', jp: '白檀 (ビャクダン)', swatch: 'linear-gradient(135deg, #f3ead8, #d4c09e)' },
  { id: 'cedar', name: 'Aged Cedar', jp: '神代杉 (スギ)', swatch: 'linear-gradient(135deg, #4b3322, #26170e)' },
  { id: 'vermilion', name: 'Vermilion Lacquer', jp: '本朱塗 (漆)', swatch: 'linear-gradient(135deg, #992218, #570e08)' },
  { id: 'obsidian', name: 'Charred Sugi', jp: '焼杉 (クロ)', swatch: 'linear-gradient(135deg, #24262b, #0d0e11)' },
  { id: 'kinpaku', name: 'Kinpaku Gold', jp: '金箔 (ゴールド)', swatch: 'linear-gradient(135deg, #e3be66, #9e751e)' }
];

const CORD_COLORS: { id: CordColor; color: string }[] = [
  { id: 'crimson', color: '#dc2626' },
  { id: 'gold', color: '#f59e0b' },
  { id: 'violet', color: '#9333ea' },
  { id: 'jade', color: '#10b981' }
];

const CORD_LABELS: Record<Language, Record<CordColor, string>> = {
  en: { crimson: 'Crimson', gold: 'Gold', violet: 'Violet', jade: 'Jade' },
  ja: { crimson: '深紅', gold: '金茶', violet: '紫', jade: '翡翠' }
};

interface InspirationPrompt {
  name: string;
  category: PlaqueCategory;
  message: string;
  location: string;
  stamp: SacredStamp;
  wood: WoodType;
  cord: CordColor;
}

const INSPIRATION_PROMPTS_EN: InspirationPrompt[] = [
  {
    name: 'Nujabes',
    category: 'music',
    message: 'Luv(sic) got me through every late-night study session. Rest in peace.',
    location: 'Seattle, WA',
    stamp: '愛',
    wood: 'cedar',
    cord: 'gold'
  },
  {
    name: 'Hoshimachi Suisei',
    category: 'vtuber',
    message: 'From DIY indie streams to Budokan. Always shining like a comet!',
    location: 'Tokyo, JP',
    stamp: '光',
    wood: 'obsidian',
    cord: 'violet'
  },
  {
    name: 'Blender 3D',
    category: 'tech',
    message: 'Free, open-source software that gave millions of artists a studio.',
    location: 'Amsterdam, NL',
    stamp: '神',
    wood: 'hinoki',
    cord: 'crimson'
  },
  {
    name: 'Frieren',
    category: 'anime',
    message: 'A reminder to cherish the small journeys and the people beside us.',
    location: 'Montreal, CA',
    stamp: '絆',
    wood: 'sandalwood',
    cord: 'jade'
  }
];

const INSPIRATION_PROMPTS_JA: InspirationPrompt[] = [
  {
    name: '星街すいせい',
    category: 'vtuber',
    message: '個人勢から武道館へ。彗星のように輝き続ける最高のアイドル！',
    location: '東京',
    stamp: '光',
    wood: 'obsidian',
    cord: 'violet'
  },
  {
    name: 'フリーレン',
    category: 'anime',
    message: 'くだらなくて楽しい旅をありがとう。ヒンメルの言葉を胸に。',
    location: '京都',
    stamp: '絆',
    wood: 'sandalwood',
    cord: 'jade'
  },
  {
    name: 'Blender 3D',
    category: 'tech',
    message: '世界中のクリエイターに表現の自由をくれた無償の神ツール。',
    location: '福岡',
    stamp: '神',
    wood: 'hinoki',
    cord: 'crimson'
  },
  {
    name: 'Nujabes',
    category: 'music',
    message: '徹夜の作業も彼のビートがあったから乗り越えられた。永遠の音楽。',
    location: '横浜',
    stamp: '愛',
    wood: 'cedar',
    cord: 'gold'
  }
];

export const HangEmaModal: React.FC<HangEmaModalProps> = ({
  isOpen,
  onClose,
  onOpenTerms,
  onHangPlaque,
  nextCoordinate,
  initialOshiName = '',
  existingPlaques = []
}) => {
  const { t, language } = useLanguage();
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const pointerDownOutsideRef = useRef(false);
  const openedAtRef = useRef<number>(Date.now());
  const interactionCountRef = useRef<number>(0);

  const [kamioshiName, setKamioshiName] = useState('');
  const [category, setCategory] = useState<PlaqueCategory>('vtuber');
  const [message, setMessage] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [location, setLocation] = useState('');
  const [stamp, setStamp] = useState<SacredStamp>('推');
  const [woodType, setWoodType] = useState<WoodType>('hinoki');
  const [cordColor, setCordColor] = useState<CordColor>('crimson');
  const [agreedTerms, setAgreedTerms] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [promptIndex, setPromptIndex] = useState(0);

  // Anti-bot & anti-spam state
  const [honeypot, setHoneypot] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      openedAtRef.current = Date.now();
      interactionCountRef.current = initialOshiName ? 1 : 0;
      setErrorMessage(null);
      setHoneypot('');
      const status = getPlaqueCooldownStatus();
      setCooldownSeconds(status.canSubmit ? 0 : status.waitSeconds);
      if (initialOshiName) {
        setKamioshiName(initialOshiName);
      }
      // Pre-warm on-device LanguageModel session in background when modal opens
      prewarmGuardianSession().catch(() => {});
    }
  }, [isOpen, initialOshiName]);

  useEffect(() => {
    if (!isOpen || cooldownSeconds <= 0) return;
    const timer = window.setInterval(() => {
      const status = getPlaqueCooldownStatus();
      setCooldownSeconds(status.canSubmit ? 0 : status.waitSeconds);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isOpen, cooldownSeconds]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.removeAttribute('data-closing');
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      closeTopLayer(dialog);
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleNativeClose = () => {
      dialog.returnValue = '';
      onClose();
    };

    const handleCancel = (e: Event) => {
      e.preventDefault();
      closeTopLayer(dialog).then(() => {
        onClose();
      });
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (!('closedBy' in HTMLDialogElement.prototype)) {
        pointerDownOutsideRef.current = isPointOutsideDialog(e, dialog);
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (!('closedBy' in HTMLDialogElement.prototype)) {
        if (pointerDownOutsideRef.current && isPointOutsideDialog(e, dialog)) {
          closeTopLayer(dialog).then(() => {
            onClose();
          });
        }
        pointerDownOutsideRef.current = false;
      }
    };

    dialog.addEventListener('close', handleNativeClose);
    dialog.addEventListener('cancel', handleCancel);
    dialog.addEventListener('pointerdown', handlePointerDown);
    dialog.addEventListener('pointerup', handlePointerUp);

    return () => {
      dialog.removeEventListener('close', handleNativeClose);
      dialog.removeEventListener('cancel', handleCancel);
      dialog.removeEventListener('pointerdown', handlePointerDown);
      dialog.removeEventListener('pointerup', handlePointerUp);
    };
  }, [onClose]);

  const handleRequestClose = () => {
    const dialog = dialogRef.current;
    if (!dialog) {
      onClose();
      return;
    }
    closeTopLayer(dialog).then(() => {
      onClose();
    });
  };

  const recordUserInteraction = () => {
    interactionCountRef.current += 1;
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  // Validate on blur to avoid premature warnings while typing (Forms §4)
  const handleFieldBlur = (value: string, maxLen: number) => {
    const cleaned = sanitizePlaqueText(value, maxLen);
    if (!cleaned) return;
    const check = detectSpamOrGibberish(cleaned);
    if (check.isSpam) {
      setErrorMessage(
        language === 'ja'
          ? 'スパムまたは不自然な連続文字が検出されました。'
          : 'Spam or repetitive character flood detected. Please write a genuine message.'
      );
      return;
    }
    const safety = evaluateWithBottledMonitor(kamioshiName, message, authorName, location);
    if (!safety.allowed) {
      setErrorMessage(
        language === 'ja'
          ? safety.reasonJa || '温かい言葉を刻んでください。'
          : safety.reasonEn || 'Please write a respectful dedication.'
      );
    }
  };

  const handleCycleInspiration = () => {
    shrineAudio.playWoodClack();
    recordUserInteraction();
    const inspirationList = language === 'ja' ? INSPIRATION_PROMPTS_JA : INSPIRATION_PROMPTS_EN;
    const item = inspirationList[promptIndex % inspirationList.length];
    setPromptIndex((prev) => prev + 1);
    setKamioshiName(item.name);
    setCategory(item.category);
    setMessage(item.message);
    setLocation(item.location);
    setStamp(item.stamp);
    setWoodType(item.wood);
    setCordColor(item.cord);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !agreedTerms) return;

    const validation = validatePlaqueSubmission({
      kamioshiName,
      message,
      authorName,
      location,
      honeypot,
      openedAt: openedAtRef.current,
      interactionCount: interactionCountRef.current,
      isTrustedEvent: e.nativeEvent.isTrusted !== false,
      existingPlaques,
      language
    });

    if (!validation.valid) {
      if (validation.silentDrop) {
        handleRequestClose();
        return;
      }
      setErrorMessage(validation.errorMessage || 'Invalid submission.');
      const status = getPlaqueCooldownStatus();
      if (!status.canSubmit) {
        setCooldownSeconds(status.waitSeconds);
      }
      return;
    }

    const cleanName = sanitizePlaqueText(kamioshiName, 44);
    const cleanMsg = sanitizePlaqueText(message, 140);
    const cleanAuth = sanitizePlaqueText(authorName, 30);
    const cleanLoc = sanitizePlaqueText(location, 30);

    setIsSubmitting(true);
    setErrorMessage(null);

    // Run hybrid on-device LanguageModel + Bottled AI safety monitor & SHA-256 Proof-of-Work in parallel
    const abortCtrl = new AbortController();
    const [aiVerdict] = await Promise.all([
      evaluatePlaqueSafetyAsync(cleanName, cleanMsg, cleanAuth, cleanLoc, abortCtrl.signal),
      computePlaqueProofOfWork(`${cleanName}:${nextCoordinate}:${openedAtRef.current}`)
    ]);

    if (!aiVerdict.allowed) {
      setIsSubmitting(false);
      setErrorMessage(
        language === 'ja'
          ? aiVerdict.reasonJa || '温かい応援の言葉を刻んでください。不適切な内容は奉納できません。'
          : aiVerdict.reasonEn || 'Please write a respectful dedication without insults or inappropriate language.'
      );
      return;
    }

    shrineAudio.playWoodClack();
    shrineAudio.playShrineBell(528);
    recordPlaqueSubmission();

    const defaultMsg = language === 'ja' ? `${cleanName}をずっと応援しています！` : `Always cheering for ${cleanName}!`;
    const defaultAuthor = language === 'ja' ? '名無しのファン' : 'Anonymous Fan';
    const defaultLocation = language === 'ja' ? '世界のどこか' : 'Somewhere on Earth';

    setTimeout(() => {
      onHangPlaque({
        kamioshiName: cleanName,
        category,
        message: cleanMsg || defaultMsg,
        authorName: cleanAuth || defaultAuthor,
        location: cleanLoc || defaultLocation,
        countryCode: language === 'ja' ? 'JP' : 'EARTH',
        language: language === 'ja' ? 'Japanese' : 'Universal',
        stamp,
        woodType,
        cordColor,
        isOwn: true
      });
      setKamioshiName('');
      setMessage('');
      setIsSubmitting(false);
      handleRequestClose();
    }, 280);
  };

  const theme = getWoodTheme(woodType);
  const cord = getCordStyle(cordColor);
  const selectedCategoryLabel = t.categories[category] || category;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="hang-ema-dialog-title"
      {...({ closedby: 'any' } as React.DialogHTMLAttributes<HTMLDialogElement>)}
      className="w-full max-w-4xl bg-transparent p-0"
    >
      <form
        onSubmit={handleSubmit}
        className="flex flex-col w-full max-h-[92dvh] sm:max-h-[88dvh] rounded-t-3xl sm:rounded-2xl bg-zinc-900 border border-amber-900/40 shadow-2xl text-zinc-100 overflow-hidden"
      >
        {/* Mobile Bottom-Sheet Grab Handle Indicator */}
        <div className="sm:hidden shrink-0 flex justify-center pt-2 pb-0.5 bg-zinc-950/95">
          <div className="w-10 h-1 rounded-full bg-zinc-700/80" />
        </div>

        {/* 1. Pinned Modal Header */}
        <div className="shrink-0 flex items-center justify-between gap-2 px-4 sm:px-6 py-3 sm:py-3.5 border-b border-zinc-800 bg-zinc-950/95">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-amber-950/50 border border-amber-700/40 flex items-center justify-center shrink-0">
              <ToriiIcon size={18} color="#f59e0b" />
            </div>
            <div className="min-w-0">
              <h2 id="hang-ema-dialog-title" className="text-sm sm:text-lg font-bold font-serif text-amber-100 truncate">
                {t.hangModal.title}
              </h2>
              <p className="text-[11px] text-zinc-400 truncate">
                {t.hangModal.plaqueNumber(nextCoordinate)} • {t.hangModal.freeForever}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCycleInspiration}
              className="inline-flex items-center gap-1.5 min-h-[34px] px-2.5 py-1.5 rounded-lg bg-amber-950/50 hover:bg-amber-900/60 border border-amber-700/40 text-amber-300 text-xs font-medium transition-colors"
              title={t.hangModal.exampleIdeaBtn}
            >
              <SacredSparkleIcon size={12} color="#fcd34d" />
              <span>{t.hangModal.exampleIdeaBtn}</span>
            </button>

            <button
              type="button"
              onClick={handleRequestClose}
              aria-label={t.hangModal.closeAria}
              className="w-8 h-8 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 flex items-center justify-center transition-colors"
            >
              <CloseSealIcon size={16} />
            </button>
          </div>
        </div>

        {/* Mobile-First Pinned Live Carved Preview Bar (Always visible on mobile/tablet < lg while typing) */}
        <div className="lg:hidden shrink-0 px-3.5 py-2.5 border-b border-zinc-800/90 bg-zinc-950/90">
          <div
            className={`relative rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-3 overflow-hidden shadow-md ${theme.textureClass}`}
            style={{
              backgroundColor: theme.edgeColor,
              color: theme.textColor,
              border: `1.5px solid ${theme.borderColor}`
            }}
          >
            {/* Left: Silk Cord Knot Indicator + Live Oshi & Message */}
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="flex flex-col items-center shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-amber-200" />
                <div
                  className="w-3 h-3 -mt-0.5 rounded-sm rotate-45 border shadow-sm"
                  style={{ backgroundColor: cord.main, borderColor: cord.highlight }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-[10px] font-mono opacity-85">
                  <span className="font-bold">#{nextCoordinate.toLocaleString()}</span>
                  <span>•</span>
                  <span className="truncate">{selectedCategoryLabel}</span>
                </div>
                <div
                  className="font-serif font-bold text-sm truncate leading-snug"
                  style={{ color: theme.inkColor }}
                >
                  {kamioshiName || t.hangModal.previewDefaultOshi}
                </div>
                <div className="text-[11px] italic truncate opacity-90">
                  “{message || t.hangModal.previewDefaultMsg}”
                </div>
              </div>
            </div>

            {/* Right: Live Vermilion Hanko Stamp */}
            <div
              className="ema-hanko-stamp w-8 h-8 shrink-0 rounded-[4px] p-[1.5px] flex items-center justify-center shadow-md"
              style={{ backgroundColor: theme.stampBg, border: `1.5px solid ${theme.stampBorder}` }}
            >
              <div className="w-full h-full border border-white/35 rounded-[2px] flex items-center justify-center text-xs font-serif text-white font-bold">
                {stamp}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Scrollable Middle Body */}
        <div className="flex-1 min-h-0 overflow-y-auto modal-scroller p-4 sm:p-6">
          {/* Visually hidden anti-bot honeypot field (Forms §6 & §8) */}
          <div className="visually-hidden" aria-hidden="true">
            <label htmlFor="shrine-website-url">Website</label>
            <input
              id="shrine-website-url"
              name="website_url"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          {/* Dynamic validation / rate-limit alert (Forms §2 & §4) */}
          <div id="hang-ema-form-error" aria-live="assertive" className="empty:hidden mb-4">
            {errorMessage && (
              <div className="px-3.5 py-2.5 rounded-xl bg-red-950/70 border border-red-700/60 text-red-200 text-xs font-medium flex items-center justify-between gap-2">
                <span>{errorMessage}</span>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="text-red-300 hover:text-white text-[11px] underline shrink-0"
                >
                  ×
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Form Inputs (7 cols on desktop) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Oshi Name */}
              <div>
                <label htmlFor="oshi-name-input" className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  {t.hangModal.nameLabel} <span className="text-red-400">*</span>
                </label>
                <input
                  id="oshi-name-input"
                  name="kamioshiName"
                  type="text"
                  required
                  autoFocus
                  ref={(el) => el?.setAttribute('autofocus', '')}
                  maxLength={44}
                  aria-describedby={errorMessage ? 'hang-ema-form-error' : undefined}
                  value={kamioshiName}
                  onChange={(e) => {
                    recordUserInteraction();
                    setKamioshiName(e.target.value);
                  }}
                  onBlur={(e) => handleFieldBlur(e.target.value, 44)}
                  placeholder={t.hangModal.namePlaceholder}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 focus:border-amber-500 text-base sm:text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition-colors"
                />
              </div>

              {/* Category */}
              <div>
                <label htmlFor="oshi-category-select" className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  {t.hangModal.categoryLabel}
                </label>
                <select
                  id="oshi-category-select"
                  name="category"
                  value={category}
                  onChange={(e) => {
                    recordUserInteraction();
                    setCategory(e.target.value as PlaqueCategory);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-base sm:text-sm text-zinc-100 focus:border-amber-500 outline-none transition-colors"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {t.categories[c.id] || c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Message / Wish */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="oshi-message-input" className="block text-xs font-semibold text-zinc-300">
                    {t.hangModal.messageLabel}
                  </label>
                  <span className="text-[11px] font-mono text-zinc-500">
                    {message.length}/140
                  </span>
                </div>
                <textarea
                  id="oshi-message-input"
                  name="message"
                  rows={3}
                  maxLength={140}
                  aria-describedby={errorMessage ? 'hang-ema-form-error' : undefined}
                  value={message}
                  onChange={(e) => {
                    recordUserInteraction();
                    setMessage(e.target.value);
                  }}
                  onBlur={(e) => handleFieldBlur(e.target.value, 140)}
                  placeholder={t.hangModal.messagePlaceholder}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 focus:border-amber-500 text-base sm:text-sm text-zinc-100 placeholder:text-zinc-500 outline-none resize-none transition-colors"
                />
              </div>

              {/* Author & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label htmlFor="oshi-author-input" className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    {t.hangModal.authorLabel}
                  </label>
                  <input
                    id="oshi-author-input"
                    name="authorName"
                    type="text"
                    maxLength={30}
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    value={authorName}
                    onChange={(e) => {
                      recordUserInteraction();
                      setAuthorName(e.target.value);
                    }}
                    onBlur={(e) => handleFieldBlur(e.target.value, 30)}
                    placeholder={t.hangModal.authorPlaceholder}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 focus:border-amber-500 text-base sm:text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="oshi-location-input" className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    {t.hangModal.locationLabel}
                  </label>
                  <input
                    id="oshi-location-input"
                    name="location"
                    type="text"
                    maxLength={30}
                    value={location}
                    onChange={(e) => {
                      recordUserInteraction();
                      setLocation(e.target.value);
                    }}
                    onBlur={(e) => handleFieldBlur(e.target.value, 30)}
                    placeholder={t.hangModal.locationPlaceholder}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 focus:border-amber-500 text-base sm:text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Timber Finish Selection */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  {t.hangModal.woodLabel}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {WOOD_TYPES.map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => {
                        shrineAudio.playWoodClack();
                        setWoodType(w.id);
                      }}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-center gap-2.5 ${
                        woodType === w.id
                          ? 'border-amber-400 bg-amber-950/35 text-amber-100 shadow-sm'
                          : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-md border border-white/25 shrink-0 shadow-inner ema-wood-surface ema-wood-${w.id}`}
                        style={{ backgroundColor: '#26170e' }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-[11px] leading-tight truncate">{w.name}</div>
                        <div className="text-[10px] opacity-70">{w.jp}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Silk Cord Color Selection (Full Width 4-Col Grid so labels never crush) */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  {t.hangModal.cordLabel}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {CORD_COLORS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        shrineAudio.playWoodClack();
                        setCordColor(c.id);
                      }}
                      className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                        cordColor === c.id
                          ? 'border-amber-400 bg-amber-950/35 text-amber-100 shadow-sm'
                          : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full shrink-0 border border-white/30"
                        style={{ backgroundColor: c.color }}
                      />
                      <span>{CORD_LABELS[language][c.id]}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Hanko Stamp & Realistic 3D Plaque Preview (5 cols on desktop) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              {/* Hanko Seal Selector */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  {t.hangModal.hankoLabel}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {STAMPS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        shrineAudio.playWoodClack();
                        setStamp(s);
                      }}
                      className={`py-2 px-1.5 rounded-xl border font-serif text-center transition-all flex flex-col items-center justify-center ${
                        stamp === s
                          ? 'bg-red-700 text-white border-red-400 shadow-md scale-[1.02]'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                      }`}
                      title={STAMP_LABELS[language][s]}
                    >
                      <span className="font-bold text-base leading-tight">{s}</span>
                      <span className="text-[10px] font-sans opacity-85 mt-0.5">
                        {STAMP_LABELS[language][s]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Realistic 3D Plaque Preview */}
              <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950/90 border border-zinc-800/90 flex flex-col items-center">
                <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 mb-1.5">
                  {t.hangModal.previewLabel}
                </span>

                {/* Silk Cord & Agemaki Knot */}
                <div className="flex flex-col items-center -mb-2.5 z-10 pointer-events-none">
                  <div className="w-3 h-3 rounded-full bg-amber-600 border border-amber-200 shadow-sm" />
                  <div className="w-1 h-4" style={{ backgroundColor: cord.main }} />
                  <div
                    className="w-3.5 h-2 -my-1 rounded-sm rotate-45 border"
                    style={{ backgroundColor: cord.knot, borderColor: cord.highlight }}
                  />
                  <div className="w-1 h-3" style={{ backgroundColor: cord.main }} />
                </div>

                {/* 3D Wood Bottom Thickness Lip + Pentagonal Plaque Face */}
                <div className="w-full max-w-[290px] ema-pentagon-shadow">
                  <div
                    className="w-full rounded-b-lg"
                    style={{
                      backgroundColor: theme.edgeColor,
                      paddingBottom: '6px',
                      clipPath: 'polygon(50% 0%, 100% 13%, 100% 100%, 0% 100%, 0% 13%)'
                    }}
                  >
                    <div
                      className={`relative w-full px-4 pb-3.5 pt-2 rounded-b-md flex flex-col justify-between overflow-hidden ${theme.textureClass}`}
                      style={{
                        backgroundColor: theme.edgeColor,
                        color: theme.textColor,
                        minHeight: '205px',
                        clipPath: 'polygon(50% 0%, 100% 13%, 100% 100%, 0% 100%, 0% 13%)'
                      }}
                    >
                      {/* Full 5-Sided Pentagonal SVG Border */}
                      <svg
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

                      {/* Brass Grommet Eyelet at Peak (pushes metadata safely below the 13% roof slope) */}
                      <div className="relative z-10 flex justify-center items-center pt-1.5 mb-2">
                        <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-amber-300 via-amber-700 to-amber-950 p-0.5 shadow-md flex items-center justify-center">
                          <div className="w-full h-full rounded-full bg-zinc-950 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cord.main }} />
                          </div>
                        </div>
                      </div>

                      {/* Plaque Coordinate & Category Row (Safely below the diagonal roof corners) */}
                      <div className="relative z-10 flex justify-between items-center text-[10px] font-mono opacity-85 px-1">
                        <span className="font-bold">#{nextCoordinate.toLocaleString()}</span>
                        <span className="uppercase tracking-wider truncate max-w-[130px]">
                          {selectedCategoryLabel}
                        </span>
                      </div>

                      {/* Oshi Name */}
                      <div
                        className="relative z-10 text-center font-bold font-serif text-base sm:text-lg leading-snug break-words my-2 px-1"
                        style={{ color: theme.inkColor }}
                      >
                        {kamioshiName || t.hangModal.previewDefaultOshi}
                      </div>

                      {/* Message Preview */}
                      <div className="relative z-10 text-xs italic text-center line-clamp-2 break-words px-2 opacity-90">
                        “{message || t.hangModal.previewDefaultMsg}”
                      </div>

                      {/* Author & Hanko Stamp Footer */}
                      <div
                        className="relative z-10 flex justify-between items-end border-t pt-2 mt-2.5 text-[10px]"
                        style={{ borderColor: theme.isLight ? 'rgba(0,0,0,0.14)' : 'rgba(255,255,255,0.14)' }}
                      >
                        <div className="min-w-0 pr-2 leading-tight">
                          <div className="font-semibold truncate" style={{ color: theme.inkColor }}>
                            {authorName || t.hangModal.previewDefaultAuthor}
                          </div>
                          <div className="opacity-80 truncate">{location || t.hangModal.previewDefaultLoc}</div>
                        </div>
                        <div
                          className="ema-hanko-stamp w-7 h-7 shrink-0 rounded-[3px] p-[1.5px] flex items-center justify-center shadow-sm"
                          style={{ backgroundColor: theme.stampBg, border: `1px solid ${theme.stampBorder}` }}
                        >
                          <div className="w-full h-full border border-white/35 rounded-[1px] flex items-center justify-center text-xs font-serif text-white font-bold">
                            {stamp}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Pinned Modal Footer with Terms & Submit CTA */}
        <div className="shrink-0 px-4 sm:px-6 pt-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] sm:pb-3.5 border-t border-zinc-800 bg-zinc-950/95 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <label className="flex items-start sm:items-center gap-2.5 text-xs text-zinc-400 cursor-pointer select-none">
            <input
              type="checkbox"
              name="agreedTerms"
              checked={agreedTerms}
              onChange={(e) => {
                recordUserInteraction();
                setAgreedTerms(e.target.checked);
              }}
              className="mt-0.5 sm:mt-0 w-4 h-4 rounded border-zinc-700 bg-zinc-950 text-amber-500 focus:ring-amber-500 shrink-0"
            />
            <span className="leading-snug">
              {t.hangModal.termsAgreeText}{' '}
              <button
                type="button"
                onClick={onOpenTerms}
                className="text-amber-300 hover:text-amber-200 underline underline-offset-2 font-medium"
              >
                {t.hangModal.termsLink}
              </button>{' '}
              {t.hangModal.termsSuffix}
            </span>
          </label>

          <div className="flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleRequestClose}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
            >
              {t.hangModal.cancelBtn}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || cooldownSeconds > 0}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-500 hover:to-red-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-red-950/40 transition-all disabled:opacity-45 disabled:cursor-not-allowed active:scale-95"
            >
              {isSubmitting ? <CheckSealIcon size={15} /> : <EmaPlaqueIcon size={15} color="#ffffff" />}
              <span>
                {isSubmitting
                  ? t.hangModal.submittingBtn
                  : cooldownSeconds > 0
                  ? t.hangModal.cooldownBtn(cooldownSeconds)
                  : t.hangModal.submitBtn}
              </span>
            </button>
          </div>
        </div>
      </form>
    </dialog>
  );
};
