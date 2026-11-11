import React, { useEffect, useRef, useState } from 'react';
import { shrineAudio } from '../audio/synth';
import { useLanguage } from '../i18n/LanguageContext';
import { closeTopLayer, isPointOutsideDialog } from '../utils/dialogUtils';
import {
  ToriiIcon,
  CloseSealIcon,
  SacredSparkleIcon,
  EmaPlaqueIcon
} from './CustomIcons';

interface OmikujiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenHangModal: () => void;
}

export const OmikujiModal: React.FC<OmikujiModalProps> = ({
  isOpen,
  onClose,
  onOpenHangModal
}) => {
  const { t, language } = useLanguage();
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [fortuneIndex, setFortuneIndex] = useState<number | null>(null);

  const handleRequestClose = () => {
    closeTopLayer(dialogRef.current).then(() => {
      onClose();
    });
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      closeTopLayer(dialog);
    }
  }, [isOpen]);

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

  const handleDrawFortune = () => {
    if (isShaking) return;
    setIsShaking(true);
    shrineAudio.playWoodClack();
    setTimeout(() => shrineAudio.playWoodClack(), 140);
    setTimeout(() => {
      shrineAudio.playShrineBell(784);
      const count = t.omikujiModal.fortunes.length;
      const randomIdx = Math.floor(Math.random() * count);
      setFortuneIndex(randomIdx);
      setIsShaking(false);
    }, 450);
  };

  const currentFortune =
    fortuneIndex !== null ? t.omikujiModal.fortunes[fortuneIndex % t.omikujiModal.fortunes.length] : null;
  const todayStr = new Date().toLocaleDateString(language === 'ja' ? 'ja-JP' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="omikuji-dialog-title"
      {...({ closedby: 'any' } as React.DialogHTMLAttributes<HTMLDialogElement>)}
      className="w-full max-w-lg bg-transparent p-0"
    >
      <div className="flex flex-col w-full max-h-[90dvh] sm:max-h-[88dvh] rounded-2xl bg-zinc-900 border border-amber-800/50 shadow-2xl text-zinc-100 overflow-hidden">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-zinc-800 bg-zinc-950/95">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-amber-950/60 border border-amber-700/40 flex items-center justify-center text-amber-400 shrink-0">
              <SacredSparkleIcon size={17} color="#f59e0b" />
            </div>
            <div className="min-w-0">
              <h2 id="omikuji-dialog-title" className="text-sm sm:text-base font-serif font-bold text-amber-100 truncate">
                {t.omikujiModal.title}
              </h2>
              <p className="text-[11px] text-zinc-400 truncate">
                {t.omikujiModal.subtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRequestClose}
            aria-label={t.omikujiModal.closeAria}
            className="w-8 h-8 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 flex items-center justify-center transition-colors shrink-0"
          >
            <CloseSealIcon size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto modal-scroller p-5 sm:p-6 space-y-5">
          {!currentFortune ? (
            <div className="py-6 text-center space-y-4">
              <div
                className={`mx-auto w-20 h-28 rounded-2xl bg-gradient-to-b from-amber-800 via-amber-950 to-zinc-950 border-2 border-amber-600/50 shadow-xl flex flex-col items-center justify-center ${
                  isShaking ? 'animate-bounce' : ''
                }`}
              >
                <span className="font-serif font-bold text-amber-200 text-lg tracking-widest writing-vertical">
                  御神籤
                </span>
              </div>
              <div className="space-y-1.5 max-w-sm mx-auto">
                <h3 className="font-serif font-bold text-amber-100 text-base sm:text-lg">
                  {t.omikujiModal.drawPromptTitle}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {t.omikujiModal.drawPromptDesc}
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  autoFocus
                  ref={(el) => el?.setAttribute('autofocus', '')}
                  onClick={handleDrawFortune}
                  disabled={isShaking}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-500 hover:to-red-500 text-white font-serif font-bold text-sm shadow-lg transition-all active:scale-95"
                >
                  <SacredSparkleIcon size={16} color="#ffffff" />
                  <span>{isShaking ? t.omikujiModal.shakingBtn : t.omikujiModal.drawBtn}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Traditional Washi Paper Fortune Slip */}
              <div className="relative rounded-xl bg-[#f7f1e3] text-zinc-900 p-5 border-2 border-red-800/70 shadow-xl space-y-3.5">
                <div className="flex items-center justify-between border-b border-red-900/20 pb-2.5">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-red-800 font-bold block">
                      {currentFortune.rankSub}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-serif font-bold text-red-700">
                      {currentFortune.rank}
                    </h3>
                  </div>

                  {/* Digital Goshuin Seal */}
                  <div className="text-right flex items-center gap-2">
                    <div className="text-[10px] font-mono text-zinc-600 leading-tight">
                      <div className="font-bold text-red-900">{t.omikujiModal.goshuinLabel}</div>
                      <div>{todayStr}</div>
                    </div>
                    <div className="w-11 h-11 rounded border-2 border-red-700 bg-red-600/90 text-white flex flex-col items-center justify-center font-serif font-bold text-xs leading-none shadow-sm shrink-0">
                      <span>神推</span>
                      <span className="text-[10px] mt-0.5">参拝</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-serif font-bold text-sm sm:text-base text-zinc-900">
                    {currentFortune.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed">
                    {currentFortune.blessing}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-red-900/15 text-xs">
                  <div className="p-2.5 rounded-lg bg-amber-950/5 border border-amber-900/15">
                    <span className="text-[10px] font-mono font-bold text-red-800 block">
                      {t.omikujiModal.luckyItemLabel}
                    </span>
                    <span className="font-medium text-zinc-800 mt-0.5 block">
                      {currentFortune.luckyItem}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-amber-950/5 border border-amber-900/15">
                    <span className="text-[10px] font-mono font-bold text-red-800 block">
                      {t.omikujiModal.adviceLabel}
                    </span>
                    <span className="font-medium text-zinc-800 mt-0.5 block">
                      {currentFortune.oshiAdvice}
                    </span>
                  </div>
                </div>

                <div className="text-[10px] font-mono text-zinc-500 text-center pt-1">
                  {t.omikujiModal.goshuinSub}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleDrawFortune}
                  className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-colors"
                >
                  {t.omikujiModal.redrawBtn}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    shrineAudio.playWoodClack();
                    handleRequestClose();
                    onOpenHangModal();
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-500 hover:to-red-500 text-white text-xs font-semibold shadow-md transition-all"
                >
                  <EmaPlaqueIcon size={14} color="#ffffff" />
                  <span>{t.omikujiModal.hangForOshiBtn}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-4 sm:px-6 py-3 border-t border-zinc-800 bg-zinc-950/95 flex items-center justify-between text-[11px] font-mono text-zinc-500">
          <span className="inline-flex items-center gap-1.5">
            <ToriiIcon size={13} color="#f59e0b" />
            <span>kamioshi.si • {todayStr}</span>
          </span>
          <button
            type="button"
            onClick={handleRequestClose}
            className="text-zinc-400 hover:text-white underline"
          >
            {t.omikujiModal.closeAria}
          </button>
        </div>
      </div>
    </dialog>
  );
};
