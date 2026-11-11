import React, { useEffect, useRef, useState } from 'react';
import { EmaPlaque } from '../types';
import { shrineAudio } from '../audio/synth';
import { useLanguage } from '../i18n/LanguageContext';
import { closeTopLayer, isPointOutsideDialog } from '../utils/dialogUtils';
import { 
  ToriiIcon, 
  CharterScrollIcon, 
  CloseSealIcon, 
  ScrollDownloadIcon, 
  TrashSealIcon,
  CheckSealIcon
} from './CustomIcons';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  plaques: EmaPlaque[];
  hiddenCount: number;
  onRestoreHidden: () => void;
  onClearPlaques: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({
  isOpen,
  onClose,
  plaques,
  hiddenCount,
  onRestoreHidden,
  onClearPlaques
}) => {
  const { t } = useLanguage();
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [clearedNotice, setClearedNotice] = useState(false);
  const [restoredNotice, setRestoredNotice] = useState(false);

  const handleRequestClose = () => {
    setConfirmingClear(false);
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

  const handleExportJson = () => {
    shrineAudio.playWoodClack();
    const dataStr = JSON.stringify(plaques, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kamioshi_plaques_backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleRestoreHiddenClick = () => {
    shrineAudio.playWoodClack();
    onRestoreHidden();
    setRestoredNotice(true);
    setTimeout(() => setRestoredNotice(false), 2500);
  };

  const handleConfirmClear = () => {
    shrineAudio.playWoodClack();
    onClearPlaques();
    setConfirmingClear(false);
    setClearedNotice(true);
    setTimeout(() => setClearedNotice(false), 2500);
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="terms-dialog-title"
      {...({ closedby: 'any' } as React.DialogHTMLAttributes<HTMLDialogElement>)}
      className="w-full max-w-2xl bg-transparent p-0"
    >
      <div className="flex flex-col w-full max-h-[92dvh] sm:max-h-[88dvh] rounded-t-3xl sm:rounded-2xl bg-zinc-900 border border-amber-900/40 shadow-2xl text-zinc-100 overflow-hidden">
        {/* Mobile Bottom-Sheet Grab Handle Indicator */}
        <div className="sm:hidden shrink-0 flex justify-center pt-2 pb-0.5 bg-zinc-950/95">
          <div className="w-10 h-1 rounded-full bg-zinc-700/80" />
        </div>

        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-3.5 border-b border-zinc-800 bg-zinc-950/95">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-amber-950/50 border border-amber-700/40 flex items-center justify-center text-amber-400 shrink-0">
              <CharterScrollIcon size={18} />
            </div>
            <div className="min-w-0">
              <h2 id="terms-dialog-title" className="text-sm sm:text-lg font-serif font-bold text-amber-100 truncate">
                {t.termsModal.title}
              </h2>
              <p className="text-[11px] text-zinc-400 truncate">
                {t.termsModal.subtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRequestClose}
            aria-label={t.termsModal.closeAria}
            className="w-8 h-8 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 flex items-center justify-center transition-colors shrink-0"
          >
            <CloseSealIcon size={16} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 min-h-0 overflow-y-auto modal-scroller p-4 sm:p-6 space-y-5 text-xs sm:text-sm leading-relaxed text-zinc-300">
          {/* 1. Honest Nature of the Project */}
          <div className="p-4 rounded-xl bg-amber-950/25 border border-amber-700/30 flex items-start gap-3">
            <div className="mt-0.5 text-amber-400 shrink-0">
              <ToriiIcon size={20} />
            </div>
            <div>
              <h3 className="font-serif font-bold text-amber-200 text-sm">
                {t.termsModal.sec1Title}
              </h3>
              <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                {t.termsModal.sec1Body}
              </p>
            </div>
          </div>

          {/* 2. Automated Bottled AI Safety Monitor & Rules */}
          <div className="space-y-1.5">
            <h3 className="font-serif font-bold text-amber-100 text-sm">
              {t.termsModal.sec2Title}
            </h3>
            <p className="text-xs text-zinc-400">
              {t.termsModal.sec2Intro}
            </p>
            <ul className="list-disc list-inside text-xs text-zinc-300 space-y-1 pl-1">
              {t.termsModal.sec2Rules.map((rule, idx) => (
                <li key={idx}>{rule}</li>
              ))}
            </ul>
          </div>

          {/* 3. Non-Affiliation & Trademarks */}
          <div className="space-y-1.5">
            <h3 className="font-serif font-bold text-amber-100 text-sm">
              {t.termsModal.sec3Title}
            </h3>
            <p className="text-xs text-zinc-400">
              {t.termsModal.sec3Body}
            </p>
          </div>

          {/* 4. Disclaimer of Liability */}
          <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-1.5">
            <h3 className="font-serif font-bold text-amber-100 text-sm">
              {t.termsModal.sec4Title}
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {t.termsModal.sec4Body}
            </p>
          </div>

          {/* 5. User Responsibility & Indemnification */}
          <div className="space-y-1.5">
            <h3 className="font-serif font-bold text-amber-100 text-sm">
              {t.termsModal.sec5Title}
            </h3>
            <p className="text-xs text-zinc-400">
              {t.termsModal.sec5Body}
            </p>
          </div>

          {/* 6. Interactive Local Data Controls */}
          <div className="pt-3 border-t border-zinc-800/80 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="font-serif font-bold text-amber-100 text-sm">
                  {t.termsModal.sec6Title(plaques.length, hiddenCount)}
                </h3>
                <p className="text-[11px] text-zinc-500">
                  {t.termsModal.sec6Desc}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {hiddenCount > 0 && (
                  <button
                    type="button"
                    onClick={handleRestoreHiddenClick}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/50 hover:bg-amber-900/60 text-amber-200 text-xs font-medium border border-amber-700/40 transition-colors"
                  >
                    <span>{t.termsModal.restoreHiddenBtn(hiddenCount)}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleExportJson}
                  disabled={plaques.length === 0}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ScrollDownloadIcon size={13} />
                  <span>{t.termsModal.exportJsonBtn}</span>
                </button>

                {!confirmingClear ? (
                  <button
                    type="button"
                    onClick={() => setConfirmingClear(true)}
                    disabled={plaques.length === 0}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/50 text-red-300 text-xs font-medium border border-red-800/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <TrashSealIcon size={13} />
                    <span>{t.termsModal.resetWallBtn}</span>
                  </button>
                ) : (
                  <div className="inline-flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleConfirmClear}
                      className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-sm transition-colors"
                    >
                      {t.termsModal.confirmResetBtn}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingClear(false)}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors"
                    >
                      {t.termsModal.cancelBtn}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {clearedNotice && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                <CheckSealIcon size={14} />
                <span>{t.termsModal.clearedNotice}</span>
              </div>
            )}

            {restoredNotice && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                <CheckSealIcon size={14} />
                <span>{t.termsModal.restoredNotice}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 px-4 sm:px-6 pt-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] sm:pb-3.5 border-t border-zinc-800 bg-zinc-950/95 flex items-center justify-between">
          <span className="text-[11px] font-mono text-zinc-500">
            {t.termsModal.footerEdition}
          </span>
          <button
            type="button"
            autoFocus
            ref={(el) => el?.setAttribute('autofocus', '')}
            onClick={handleRequestClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-500 hover:to-red-500 text-white text-xs sm:text-sm font-semibold shadow-md transition-all"
          >
            {t.termsModal.gotItBtn}
          </button>
        </div>
      </div>
    </dialog>
  );
};
