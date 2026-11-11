import React, { useEffect, useRef, useState } from 'react';
import { shrineAudio } from '../audio/synth';
import { useLanguage } from '../i18n/LanguageContext';
import { closeTopLayer, isPointOutsideDialog } from '../utils/dialogUtils';
import {
  ContactEnvelopeIcon,
  CloseSealIcon,
  CheckSealIcon,
  ToriiIcon,
  SacredSparkleIcon
} from './CustomIcons';

// Obfuscated FormSubmit target so scrapers/crawlers cannot extract the raw email from the client bundle
const getMaskedTarget = () => {
  const chunks = ['YXNtcnRpc', '3R4eXpAZ21', 'haWwuY29t'];
  try {
    return atob(chunks.join(''));
  } catch {
    return '';
  }
};

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefillSubject?: string;
  prefillMessage?: string;
}

export const ContactModal: React.FC<ContactModalProps> = ({
  isOpen,
  onClose,
  prefillSubject,
  prefillMessage
}) => {
  const { t, language } = useLanguage();
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState<'general' | 'removal' | 'feature' | 'bug' | 'partnership'>('general');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Set prefilled subject / message if provided (e.g. from plaque report / inquiry)
  useEffect(() => {
    if (prefillSubject) {
      if (prefillSubject.includes('Removal') || prefillSubject.includes('削除')) {
        setTopic('removal');
      }
    }
    if (prefillMessage && !message) {
      setMessage(prefillMessage);
    }
  }, [prefillSubject, prefillMessage]);

  const handleRequestClose = () => {
    closeTopLayer(dialogRef.current).then(() => {
      onClose();
      // Reset success state after closing
      window.setTimeout(() => {
        setIsSuccess(false);
        setErrorMessage(null);
      }, 300);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();

    if (!trimmedEmail) {
      setErrorMessage(language === 'ja' ? '返信先メールアドレスをご入力ください。' : 'Please provide your email address.');
      return;
    }
    if (!trimmedMessage || trimmedMessage.length < 5) {
      setErrorMessage(language === 'ja' ? 'メッセージを5文字以上ご入力ください。' : 'Message must be at least 5 characters long.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const topicLabel = t.contactModal.topicOptions[topic] || topic;
      const payload = {
        name: name.trim() || undefined,
        email: trimmedEmail,
        subject: `${topicLabel}${name ? ` - from ${name}` : ''}`,
        message: trimmedMessage,
        honeypot
      };

      // 1. Primary path: Submit via Cloudflare Pages Function (email is 100% masked on edge)
      let delivered = false;
      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          delivered = true;
        }
      } catch {
        // Fall back below if edge was throttled
      }

      // 2. Direct browser AJAX fallback (using masked target string from user's personal IP)
      if (!delivered) {
        const target = getMaskedTarget();
        if (target) {
          const directRes = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(target)}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json'
            },
            body: JSON.stringify({
              name: payload.name || 'Kamioshi Visitor',
              email: payload.email,
              _subject: `[kamioshi.si] ${payload.subject}`,
              message: payload.message,
              _captcha: 'false',
              _template: 'table'
            })
          });

          if (directRes.ok) {
            delivered = true;
          }
        }
      }

      if (delivered) {
        shrineAudio.playWoodClack();
        shrineAudio.playShrineBell(528);
        setIsSuccess(true);
        setMessage('');
      } else {
        setErrorMessage(
          language === 'ja'
            ? 'メッセージの送信に失敗しました。少し時間をおいてから再度お試しください。'
            : 'Unable to send message at this moment. Please try again shortly.'
        );
      }
    } catch {
      setErrorMessage(
        language === 'ja'
          ? '通信エラーが発生しました。インターネット接続を確認してください。'
          : 'Network error. Please check your connection and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForAnother = () => {
    setIsSuccess(false);
    setErrorMessage(null);
    setMessage('');
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="contact-modal-title"
      className="m-0 sm:m-auto p-0 max-w-full sm:max-w-xl w-full bg-transparent text-zinc-100 backdrop:bg-black/80 backdrop:backdrop-blur-sm transition-all outline-none"
    >
      <div className="relative w-full rounded-t-3xl sm:rounded-3xl bg-zinc-950 border-t sm:border border-amber-800/40 p-5 sm:p-7 shadow-2xl space-y-5 max-h-[92dvh] overflow-y-auto">
        {/* Mobile Swipe / Grab Bar */}
        <div className="sm:hidden w-12 h-1.5 rounded-full bg-zinc-700/80 mx-auto -mt-1 mb-3" />

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-700/50 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
              <ContactEnvelopeIcon size={20} color="#f59e0b" />
            </div>
            <div>
              <h2 id="contact-modal-title" className="font-serif font-bold text-lg sm:text-xl text-amber-100">
                {t.contactModal.title}
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                {t.contactModal.subtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRequestClose}
            aria-label={t.contactModal.closeAria}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <CloseSealIcon size={18} />
          </button>
        </div>

        {/* Success Confirmation View */}
        {isSuccess ? (
          <div className="py-6 sm:py-8 flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-950/70 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-950/40">
              <CheckSealIcon size={28} color="#10b981" />
            </div>
            <div className="space-y-1.5 max-w-sm">
              <h3 className="font-serif font-bold text-lg text-emerald-300">
                {t.contactModal.successTitle}
              </h3>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                {t.contactModal.successDesc}
              </p>
            </div>

            <div className="pt-3 flex flex-col sm:flex-row items-center gap-2.5 w-full max-w-xs">
              <button
                type="button"
                onClick={handleRequestClose}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-500 hover:to-red-500 text-white font-medium text-xs font-mono shadow-md transition-all"
              >
                {t.contactModal.closeBtn}
              </button>
              <button
                type="button"
                onClick={handleResetForAnother}
                className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-medium text-xs font-mono border border-zinc-800 transition-colors"
              >
                {t.contactModal.sendAnotherBtn}
              </button>
            </div>
          </div>
        ) : (
          /* Contact Form View */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Honeypot field (hidden from users, traps automated bots) */}
            <input
              type="text"
              name="_honey"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              className="hidden"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />

            {/* Error Banner */}
            {errorMessage && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-red-950/80 border border-red-700/60 text-xs text-red-200 leading-relaxed shadow-sm animate-shake"
              >
                {errorMessage}
              </div>
            )}

            {/* Name / Nickname (Optional) */}
            <div className="space-y-1">
              <label htmlFor="contact-name" className="block text-xs font-mono text-zinc-300">
                {t.contactModal.nameLabel}
              </label>
              <input
                id="contact-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.contactModal.namePlaceholder}
                maxLength={50}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-amber-500 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition-colors"
              />
            </div>

            {/* Email Address (Required for reply) */}
            <div className="space-y-1">
              <label htmlFor="contact-email" className="block text-xs font-mono text-zinc-300">
                {t.contactModal.emailLabel} <span className="text-red-400">*</span>
              </label>
              <input
                id="contact-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.contactModal.emailPlaceholder}
                maxLength={100}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-amber-500 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition-colors"
              />
              <p className="text-[11px] text-zinc-500 font-mono">
                {t.contactModal.emailHelp}
              </p>
            </div>

            {/* Topic Dropdown */}
            <div className="space-y-1">
              <label htmlFor="contact-topic" className="block text-xs font-mono text-zinc-300">
                {t.contactModal.topicLabel}
              </label>
              <select
                id="contact-topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value as typeof topic)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-amber-500 text-sm text-zinc-100 outline-none transition-colors cursor-pointer"
              >
                <option value="general">{t.contactModal.topicOptions.general}</option>
                <option value="removal">{t.contactModal.topicOptions.removal}</option>
                <option value="feature">{t.contactModal.topicOptions.feature}</option>
                <option value="bug">{t.contactModal.topicOptions.bug}</option>
                <option value="partnership">{t.contactModal.topicOptions.partnership}</option>
              </select>
            </div>

            {/* Message Area */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="contact-message" className="block text-xs font-mono text-zinc-300">
                  {t.contactModal.messageLabel} <span className="text-red-400">*</span>
                </label>
                <span className="text-[11px] font-mono text-zinc-500">
                  {message.length} / 1500
                </span>
              </div>
              <textarea
                id="contact-message"
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t.contactModal.messagePlaceholder}
                maxLength={1500}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-amber-500 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition-colors resize-y min-h-[90px]"
              />
            </div>

            {/* Privacy notice banner */}
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-[11px] text-zinc-400 leading-snug">
              <ToriiIcon size={14} color="#f59e0b" />
              <span>{t.contactModal.privacyNote}</span>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleRequestClose}
                className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-mono transition-colors"
              >
                {t.contactModal.cancelBtn}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-red-600 to-red-700 hover:from-amber-500 hover:to-red-500 text-white font-semibold text-xs sm:text-sm shadow-md transition-all disabled:opacity-50 active:scale-95"
              >
                <ContactEnvelopeIcon size={15} color="#ffffff" />
                <span>
                  {isSubmitting ? t.contactModal.submittingBtn : t.contactModal.submitBtn}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </dialog>
  );
};
