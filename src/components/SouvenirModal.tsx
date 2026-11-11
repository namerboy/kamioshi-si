import React, { useEffect, useRef, useState } from 'react';
import { EmaPlaque, ReportReason } from '../types';
import { CATEGORY_LABELS } from '../data/emaData';
import { shrineAudio } from '../audio/synth';
import { useLanguage } from '../i18n/LanguageContext';
import { hasRungBellForPlaque, encodePlaqueShareUrl } from '../utils/antiSpam';
import { getWoodTheme, getCordStyle } from './EmaCard';
import { closeTopLayer, isPointOutsideDialog } from '../utils/dialogUtils';
import { 
  ToriiIcon, 
  SuzuBellIcon, 
  LinkCrestIcon, 
  ScrollDownloadIcon,
  CloseSealIcon,
  CheckSealIcon,
  TrashSealIcon
} from './CustomIcons';

interface SouvenirModalProps {
  plaque: EmaPlaque | null;
  onClose: () => void;
  onBow: (id: string) => void;
  onDelete?: (id: string) => void;
  onReport?: (id: string, reason: ReportReason) => void;
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const chars = Array.from(text);
  let line = '';
  const lines: string[] = [];

  for (let i = 0; i < chars.length; i++) {
    const testLine = line + chars[i];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line.length > 0) {
      lines.push(line);
      line = chars[i];
    } else {
      line = testLine;
    }
  }
  if (line) lines.push(line);

  const displayLines = lines.slice(0, 4);
  const startY = y - ((displayLines.length - 1) * lineHeight) / 2;
  displayLines.forEach((l, idx) => {
    ctx.fillText(l.trim(), x, startY + idx * lineHeight);
  });
}

export const SouvenirModal: React.FC<SouvenirModalProps> = ({
  plaque,
  onClose,
  onBow,
  onDelete,
  onReport
}) => {
  const { t, language } = useLanguage();
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [hasBowed, setHasBowed] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [reportingOpen, setReportingOpen] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason>('harassment');

  const handleRequestClose = () => {
    setConfirmDelete(false);
    setReportingOpen(false);
    closeTopLayer(dialogRef.current).then(() => {
      onClose();
    });
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (plaque && !dialog.open) {
      dialog.showModal();
    } else if (!plaque && dialog.open) {
      closeTopLayer(dialog);
    }
  }, [plaque]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event) => {
      e.preventDefault();
      handleRequestClose();
    };

    const handleClose = () => {
      dialog.returnValue = '';
      onClose();
    };

    let pressedOutside = false;
    const handlePointerDown = (e: PointerEvent) => {
      if (!('closedBy' in HTMLDialogElement.prototype)) {
        pressedOutside = isPointOutsideDialog(e, dialog);
      }
    };
    const handlePointerUp = (e: PointerEvent) => {
      if (!('closedBy' in HTMLDialogElement.prototype) && pressedOutside && isPointOutsideDialog(e, dialog)) {
        handleRequestClose();
      }
      pressedOutside = false;
    };

    dialog.addEventListener('cancel', handleCancel);
    dialog.addEventListener('close', handleClose);
    dialog.addEventListener('pointerdown', handlePointerDown);
    dialog.addEventListener('pointerup', handlePointerUp);

    return () => {
      dialog.removeEventListener('cancel', handleCancel);
      dialog.removeEventListener('close', handleClose);
      dialog.removeEventListener('pointerdown', handlePointerDown);
      dialog.removeEventListener('pointerup', handlePointerUp);
    };
  }, [onClose]);

  if (!plaque) {
    return <dialog ref={dialogRef} aria-label="Plaque details" />;
  }

  const categoryMeta = CATEGORY_LABELS[plaque.category] || CATEGORY_LABELS.other;
  const theme = getWoodTheme(plaque.woodType);
  const cord = getCordStyle(plaque.cordColor);
  const isBellRung = hasBowed || hasRungBellForPlaque(plaque.id);

  const handleBow = (e: React.MouseEvent) => {
    if (e.nativeEvent.isTrusted === false) return;
    shrineAudio.playWoodClack();
    shrineAudio.playShrineBell(880);
    if (!isBellRung) {
      setHasBowed(true);
      onBow(plaque.id);
      setTimeout(() => setHasBowed(false), 1800);
    }
  };

  const shareUrl = encodePlaqueShareUrl(plaque);
  const tweetText = t.souvenirModal.shareTweetText(plaque.kamioshiName, plaque.coordinate);
  const xShareHref = `https://x.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(shareUrl)}`;
  const lineShareHref = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}`;
  const supportsWebShare = typeof navigator !== 'undefined' && 'share' in navigator;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    shrineAudio.playWoodClack();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (!supportsWebShare) return;
    shrineAudio.playWoodClack();
    try {
      await navigator.share({
        title: `${plaque.kamioshiName} — Plaque #${plaque.coordinate}`,
        text: tweetText,
        url: shareUrl
      });
    } catch {
      // user cancelled share sheet
    }
  };

  const handleConfirmDelete = () => {
    if (!onDelete) return;
    shrineAudio.playWoodClack();
    onDelete(plaque.id);
    handleRequestClose();
  };

  const handleConfirmReport = () => {
    if (!onReport) return;
    shrineAudio.playWoodClack();
    onReport(plaque.id, reportReason);
    handleRequestClose();
  };

  // Render high-res keepsake photo card on HTML5 Canvas using Blender-rendered 2.5D wood slab
  const handleDownloadKeepsake = async () => {
    setDownloading(true);
    shrineAudio.playWoodClack();

    // Load Blender-baked wood texture for high-res Canvas compositing
    const woodImg = await new Promise<HTMLImageElement | null>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = theme.textureUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1350;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      setDownloading(false);
      return;
    }

    // 1. Deep Shrine Courtyard Background
    const bgGrad = ctx.createLinearGradient(0, 0, 1200, 1350);
    bgGrad.addColorStop(0, '#140f0c');
    bgGrad.addColorStop(0.5, '#211812');
    bgGrad.addColorStop(1, '#0e0a08');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1200, 1350);

    // 2. Volumetric Komorebi Sunbeams
    ctx.save();
    const sunGrad = ctx.createLinearGradient(150, 0, 850, 1100);
    sunGrad.addColorStop(0, 'rgba(251, 191, 36, 0.14)');
    sunGrad.addColorStop(0.6, 'rgba(217, 119, 6, 0.05)');
    sunGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(620, 0);
    ctx.lineTo(1150, 1350);
    ctx.lineTo(250, 1350);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 3. Top Cedar Cross-Beam (Ema-kake)
    const beamGrad = ctx.createLinearGradient(0, 165, 0, 215);
    beamGrad.addColorStop(0, '#452712');
    beamGrad.addColorStop(0.5, '#2d180a');
    beamGrad.addColorStop(1, '#1a0d05');
    ctx.fillStyle = beamGrad;
    ctx.fillRect(80, 165, 1040, 44);
    ctx.strokeStyle = '#784721';
    ctx.lineWidth = 2;
    ctx.strokeRect(80, 165, 1040, 44);

    // Header Title Above Beam
    ctx.fillStyle = '#fef3c7';
    ctx.font = 'bold 36px "Cinzel", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('⛩️ kamioshi.si', 600, 95);

    ctx.fillStyle = '#c4a88b';
    ctx.font = '20px monospace';
    ctx.fillText(`PLAQUE #${plaque.coordinate.toLocaleString()} • ${categoryMeta.label.toUpperCase()}`, 600, 135);

    // 4. Brass Hook & Braided Silk Cord
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(600, 192, 11, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = cord.main;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(600, 200);
    ctx.lineTo(600, 325);
    ctx.stroke();

    // Knot
    ctx.fillStyle = cord.knot;
    ctx.beginPath();
    ctx.arc(600, 265, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = cord.highlight;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 5. 3D Wooden Plaque Geometry
    const px = 170;
    const py = 290;
    const pw = 860;
    const ph = 790;

    // 3D Bottom Lip Shadow & Thickness
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.78)';
    ctx.shadowBlur = 50;
    ctx.shadowOffsetY = 28;

    ctx.fillStyle = theme.edgeColor;
    ctx.beginPath();
    ctx.moveTo(px + pw / 2, py + 14);
    ctx.lineTo(px + pw, py + 124);
    ctx.lineTo(px + pw, py + ph + 16);
    ctx.lineTo(px, py + ph + 16);
    ctx.lineTo(px, py + 124);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Main Plaque Face
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(px + pw / 2, py);
    ctx.lineTo(px + pw, py + 110);
    ctx.lineTo(px + pw, py + ph);
    ctx.lineTo(px, py + ph);
    ctx.lineTo(px, py + 110);
    ctx.closePath();
    ctx.clip();

    if (woodImg) {
      ctx.drawImage(woodImg, px, py, pw, ph);
    } else {
      const woodGrad = ctx.createLinearGradient(px, py, px + pw, py + ph);
      if (plaque.woodType === 'cedar') {
        woodGrad.addColorStop(0, '#4b3322');
        woodGrad.addColorStop(0.5, '#362316');
        woodGrad.addColorStop(1, '#26170e');
      } else if (plaque.woodType === 'vermilion') {
        woodGrad.addColorStop(0, '#992218');
        woodGrad.addColorStop(0.5, '#78170f');
        woodGrad.addColorStop(1, '#570e08');
      } else if (plaque.woodType === 'obsidian') {
        woodGrad.addColorStop(0, '#24262b');
        woodGrad.addColorStop(0.5, '#16181c');
        woodGrad.addColorStop(1, '#0d0e11');
      } else if (plaque.woodType === 'sandalwood') {
        woodGrad.addColorStop(0, '#f3ead8');
        woodGrad.addColorStop(0.5, '#e5d6bc');
        woodGrad.addColorStop(1, '#d4c09e');
      } else if (plaque.woodType === 'kinpaku') {
        woodGrad.addColorStop(0, '#e3be66');
        woodGrad.addColorStop(0.5, '#c89d3c');
        woodGrad.addColorStop(1, '#9e751e');
      } else {
        woodGrad.addColorStop(0, '#dec39f');
        woodGrad.addColorStop(0.5, '#cca97e');
        woodGrad.addColorStop(1, '#b89265');
      }
      ctx.fillStyle = woodGrad;
      ctx.fillRect(px, py, pw, ph);

      // Dark Roof Cap (Yane) fallback only when 3D texture is unavailable
      ctx.fillStyle = theme.roofColor;
      ctx.beginPath();
      ctx.moveTo(px + pw / 2, py);
      ctx.lineTo(px + pw, py + 110);
      ctx.lineTo(px + pw, py + 132);
      ctx.lineTo(px + pw / 2, py + 24);
      ctx.lineTo(px, py + 132);
      ctx.lineTo(px, py + 110);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();

    // Plaque Outline
    ctx.strokeStyle = theme.borderColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(px + pw / 2, py);
    ctx.lineTo(px + pw, py + 110);
    ctx.lineTo(px + pw, py + ph);
    ctx.lineTo(px, py + ph);
    ctx.lineTo(px, py + 110);
    ctx.closePath();
    ctx.stroke();

    // Brass Grommet Eyelet
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.arc(600, py + 66, 17, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#140c06';
    ctx.beginPath();
    ctx.arc(600, py + 66, 11, 0, Math.PI * 2);
    ctx.fill();

    // 6. Typography & Inscription
    ctx.fillStyle = theme.inkColor;
    ctx.font = 'bold 58px "Cinzel", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(plaque.kamioshiName, 600, py + 215, 760);

    // Wrapped Message
    ctx.fillStyle = theme.textColor;
    ctx.font = 'italic 33px "Inter", sans-serif';
    wrapCanvasText(ctx, `“${plaque.message}”`, 600, py + 390, 720, 48);

    // Bottom Divider
    ctx.strokeStyle = theme.isLight ? 'rgba(0,0,0,0.16)' : 'rgba(255,255,255,0.16)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px + 75, py + 575);
    ctx.lineTo(px + pw - 75, py + 575);
    ctx.stroke();

    // Author, Location, Date
    ctx.fillStyle = theme.inkColor;
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(plaque.authorName || 'Fan', px + 75, py + 635);

    ctx.fillStyle = theme.mutedColor;
    ctx.font = '23px sans-serif';
    ctx.fillText(`${plaque.location} • ${new Date(plaque.createdAt).toLocaleDateString()}`, px + 75, py + 675);

    ctx.font = '20px monospace';
    ctx.fillText(`🔔 ${plaque.bowCount} Bells Rung`, px + 75, py + 715);

    // Double-Bordered Vermilion Hanko Stamp
    const stampX = px + pw - 185;
    const stampY = py + 605;
    ctx.fillStyle = theme.stampBg;
    ctx.fillRect(stampX, stampY, 108, 108);
    ctx.strokeStyle = theme.stampBorder;
    ctx.lineWidth = 3;
    ctx.strokeRect(stampX, stampY, 108, 108);
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(stampX + 6, stampY + 6, 96, 96);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 60px serif';
    ctx.textAlign = 'center';
    ctx.fillText(plaque.stamp, stampX + 54, stampY + 76);

    // Footer Watermark
    ctx.fillStyle = '#8a7968';
    ctx.font = '20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`kamioshi.si/#ema=${plaque.coordinate}`, 600, 1285);

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `kamioshi_${plaque.coordinate}_${plaque.kamioshiName.replace(/\s+/g, '_')}.png`;
    link.href = dataUrl;
    link.click();

    setTimeout(() => setDownloading(false), 500);
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="souvenir-dialog-title"
      {...({ closedby: 'any' } as React.DialogHTMLAttributes<HTMLDialogElement>)}
      className="w-full max-w-xl bg-transparent p-0"
    >
      <div className="flex flex-col w-full max-h-[92dvh] sm:max-h-[88dvh] rounded-t-3xl sm:rounded-2xl bg-zinc-900 border border-amber-900/40 shadow-2xl text-zinc-100 overflow-hidden">
        {/* Mobile Bottom-Sheet Grab Handle Indicator */}
        <div className="sm:hidden shrink-0 flex justify-center pt-2 pb-0.5 bg-zinc-950/95">
          <div className="w-10 h-1 rounded-full bg-zinc-700/80" />
        </div>

        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-3.5 border-b border-zinc-800 bg-zinc-950/95">
          <div className="flex items-center gap-2.5 min-w-0">
            <ToriiIcon size={20} color="#f59e0b" />
            <div className="min-w-0">
              <h2 id="souvenir-dialog-title" className="font-serif font-bold text-amber-100 text-sm sm:text-base truncate">
                {t.souvenirModal.title(plaque.coordinate)}
              </h2>
              <p className="text-xs text-zinc-400 truncate">
                {plaque.kamioshiName} • {t.categories[plaque.category] || categoryMeta.label}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRequestClose}
            aria-label={t.souvenirModal.closeAria}
            className="w-8 h-8 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 flex items-center justify-center transition-colors shrink-0"
          >
            <CloseSealIcon size={16} />
          </button>
        </div>

        {/* Main 3D Plaque Showcase */}
        <div className="flex-1 min-h-0 overflow-y-auto modal-scroller p-4 sm:p-8 flex flex-col items-center bg-gradient-to-b from-zinc-950/80 via-zinc-900/50 to-zinc-950/80 relative">
          {/* Subtle Warm Sunbeam Glow */}
          <div
            className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-20 blur-3xl"
            style={{ background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)' }}
          />

          {/* Braided Silk Cord */}
          <div className="relative z-10 flex flex-col items-center -mb-2.5">
            <div className="w-3.5 h-3.5 rounded-full bg-amber-600 border border-amber-300 shadow" />
            <div className="w-1 h-7" style={{ backgroundColor: cord.main }} />
            <div
              className="w-4 h-3 -my-1 rounded-sm rotate-45 border shadow-sm"
              style={{ backgroundColor: cord.knot, borderColor: cord.highlight }}
            />
            <div className="w-1 h-4" style={{ backgroundColor: cord.main }} />
          </div>

          {/* 3D Wood Bottom Lip + Face */}
          <div className="relative z-10 w-full max-w-md ema-pentagon-shadow">
            <div
              className="w-full rounded-b-xl"
              style={{
                backgroundColor: theme.edgeColor,
                paddingBottom: '7px',
                clipPath: 'polygon(50% 0%, 100% 13%, 100% 100%, 0% 100%, 0% 13%)'
              }}
            >
              <div
                className={`relative w-full p-5 sm:p-6 pt-4 rounded-b-lg flex flex-col justify-between overflow-hidden ${theme.textureClass}`}
                style={{
                  backgroundColor: theme.edgeColor,
                  color: theme.textColor,
                  minHeight: '275px',
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

                {/* Eyelet Hole */}
                <div className="relative z-10 flex justify-center pt-1 mb-2.5">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-br from-amber-300 via-amber-700 to-amber-950 p-0.5 shadow-md flex items-center justify-center">
                    <div className="w-full h-full rounded-full bg-zinc-950 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cord.main }} />
                    </div>
                  </div>
                </div>

                <div className="relative z-10 flex justify-between items-center text-xs font-mono opacity-85 px-1">
                  <span className="font-bold">#{plaque.coordinate.toLocaleString()}</span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${categoryMeta.badgeClass}`}>
                    {categoryMeta.renderIcon({ size: 12 })}
                    <span>{t.categories[plaque.category] || categoryMeta.label}</span>
                  </span>
                </div>

                <div className="relative z-10 my-4 text-center px-2">
                  <h3 className="text-xl sm:text-3xl font-serif font-bold tracking-tight break-words" style={{ color: theme.inkColor }}>
                    {plaque.kamioshiName}
                  </h3>
                </div>

                <div className="relative z-10 px-3 sm:px-4 my-2 text-center flex-grow flex items-center justify-center">
                  <p className="text-sm sm:text-base italic leading-relaxed break-words">
                    “{plaque.message}”
                  </p>
                </div>

                <div
                  className="relative z-10 pt-3 mt-2 border-t flex items-end justify-between px-1"
                  style={{ borderColor: theme.isLight ? 'rgba(0,0,0,0.14)' : 'rgba(255,255,255,0.14)' }}
                >
                  <div className="flex flex-col text-xs leading-snug min-w-0 pr-2">
                    <span className="font-semibold truncate" style={{ color: theme.inkColor }}>
                      {plaque.authorName || t.card.defaultAuthor}
                    </span>
                    <span className="opacity-80 truncate">{plaque.location || t.card.defaultLocation}</span>
                    <span className="text-[10px] opacity-65 mt-0.5">
                      {t.souvenirModal.signed(new Date(plaque.createdAt).toLocaleDateString(language === 'ja' ? 'ja-JP' : 'en-US'))}
                    </span>
                  </div>

                  <div
                    className="ema-hanko-stamp w-9 h-9 shrink-0 rounded-[4px] p-[2px] shadow-md flex items-center justify-center"
                    style={{ backgroundColor: theme.stampBg, border: `1.5px solid ${theme.stampBorder}` }}
                    title={`Seal: ${plaque.stamp}`}
                  >
                    <div className="w-full h-full border border-white/35 rounded-[2px] flex items-center justify-center font-serif text-white font-bold text-base">
                      {plaque.stamp}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="shrink-0 px-4 sm:px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-5 border-t border-zinc-800 bg-zinc-950/95 space-y-3">
          {/* Expandable Report / Quarantine Drawer */}
          {reportingOpen && onReport && (
            <div className="p-3.5 rounded-xl bg-zinc-900 border border-red-800/50 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-red-200">{t.souvenirModal.reportTitle}</span>
                <button
                  type="button"
                  onClick={() => setReportingOpen(false)}
                  className="text-zinc-400 hover:text-white"
                >
                  {t.souvenirModal.reportCancelBtn}
                </button>
              </div>
              <select
                name="reportReason"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value as ReportReason)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-zinc-200 text-xs outline-none focus:border-amber-500"
              >
                <option value="harassment">{t.souvenirModal.reportReasons.harassment}</option>
                <option value="doxxing">{t.souvenirModal.reportReasons.doxxing}</option>
                <option value="hate_or_harm">{t.souvenirModal.reportReasons.hate_or_harm}</option>
                <option value="spam">{t.souvenirModal.reportReasons.spam}</option>
                <option value="hide_only">{t.souvenirModal.reportReasons.hide_only}</option>
              </select>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleConfirmReport}
                  className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold transition-colors"
                >
                  {t.souvenirModal.reportConfirmBtn}
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={handleBow}
                aria-pressed={isBellRung}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
                  hasBowed
                    ? 'bg-amber-500 text-zinc-950 border-amber-300 scale-105'
                    : isBellRung
                    ? 'bg-amber-950/60 text-amber-200 border-amber-700/50'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border-zinc-700'
                }`}
              >
                {isBellRung && !hasBowed ? (
                  <CheckSealIcon size={14} color="#fcd34d" />
                ) : (
                  <SuzuBellIcon size={15} color={hasBowed ? '#09090b' : '#f59e0b'} />
                )}
                <span>
                  {isBellRung
                    ? t.souvenirModal.bellRung(plaque.bowCount)
                    : t.souvenirModal.ringBell(plaque.bowCount)}
                </span>
              </button>

              {onReport && !reportingOpen && (
                <button
                  type="button"
                  onClick={() => setReportingOpen(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl bg-zinc-900 hover:bg-amber-950/50 text-zinc-400 hover:text-amber-200 border border-zinc-800 hover:border-amber-800/50 text-xs transition-colors"
                  title={t.souvenirModal.reportTitle}
                >
                  <span>🚩</span>
                  <span className="hidden sm:inline">{t.souvenirModal.reportBtn}</span>
                </button>
              )}

              {onDelete && (
                !confirmDelete ? (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl bg-zinc-900 hover:bg-red-950/50 text-zinc-400 hover:text-red-300 border border-zinc-800 hover:border-red-800/50 text-xs transition-colors"
                    title={t.souvenirModal.removeTitle}
                  >
                    <TrashSealIcon size={14} />
                  </button>
                ) : (
                  <div className="inline-flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleConfirmDelete}
                      className="px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold"
                    >
                      {t.souvenirModal.removeConfirm}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="px-2 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-xs"
                    >
                      {t.souvenirModal.removeKeep}
                    </button>
                  </div>
                )
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 ml-auto">
              {/* Privacy-Preserving Static Share Links (Privacy §4 — No JS SDK tracking) */}
              <a
                href={xShareHref}
                rel="noopener noreferrer"
                target="_blank"
                onClick={() => shrineAudio.playWoodClack()}
                className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-colors"
              >
                <span>𝕏</span>
                <span className="hidden sm:inline">{t.souvenirModal.shareXBtn}</span>
              </a>

              <a
                href={lineShareHref}
                rel="noopener noreferrer"
                target="_blank"
                onClick={() => shrineAudio.playWoodClack()}
                className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/70 text-emerald-200 text-xs font-semibold border border-emerald-700/50 transition-colors"
              >
                <span>{t.souvenirModal.shareLineBtn}</span>
              </a>

              {supportsWebShare && (
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-colors"
                >
                  <span>{t.souvenirModal.nativeShareBtn}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-colors"
              >
                {copied ? <CheckSealIcon size={14} color="#34d399" /> : <LinkCrestIcon size={14} />}
                <span>{copied ? t.souvenirModal.copiedBtn : t.souvenirModal.shareBtn}</span>
              </button>

              <button
                type="button"
                autoFocus
                ref={(el) => el?.setAttribute('autofocus', '')}
                onClick={handleDownloadKeepsake}
                disabled={downloading}
                className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-500 hover:to-red-500 text-white text-xs font-semibold shadow-lg shadow-red-950/40 transition-all disabled:opacity-50 active:scale-95"
              >
                <ScrollDownloadIcon size={14} />
                <span>{downloading ? t.souvenirModal.renderingBtn : t.souvenirModal.downloadBtn}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
};
