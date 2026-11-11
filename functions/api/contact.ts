import { PagesContext, jsonResponse, sanitizeText } from '../_shared/shrineDb';

interface EnvWithContact {
  DB: unknown;
  CONTACT_EMAIL?: string;
  FORMSUBMIT_TOKEN?: string;
}

const DEFAULT_TARGET = 'asmrtistxyz@gmail.com';

export const onRequestPost = async (ctx: PagesContext): Promise<Response> => {
  try {
    const body = (await ctx.request.json()) as Record<string, unknown>;

    // 1. Honeypot anti-bot verification (silently drop bot submissions)
    const honeypot = String(body.honeypot || body._honey || '').trim();
    if (honeypot) {
      return jsonResponse({ ok: true, message: 'Message sent successfully.' });
    }

    // 2. Validate and sanitize user inputs
    const name = sanitizeText(body.name, 50) || 'Anonymous Pilgrim';
    const email = String(body.email || '').trim().slice(0, 100);
    const subject = sanitizeText(body.subject, 80) || 'General Inquiry';
    const message = sanitizeText(body.message, 1500);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return jsonResponse(
        { error: 'Please provide a valid reply email address.' },
        400
      );
    }

    if (!message || message.length < 5) {
      return jsonResponse(
        { error: 'Message must be at least 5 characters long.' },
        400
      );
    }

    // 3. FormSubmit forwarding (Target email is completely masked on Cloudflare edge server)
    const env = ctx.env as unknown as EnvWithContact;
    const target = env.FORMSUBMIT_TOKEN || env.CONTACT_EMAIL || DEFAULT_TARGET;
    const formSubmitUrl = `https://formsubmit.co/ajax/${encodeURIComponent(target)}`;

    const forwardPayload = {
      name,
      email,
      _subject: `[kamioshi.si] ${subject}`,
      topic: subject,
      message,
      _template: 'table',
      _captcha: 'false'
    };

    const formData = new URLSearchParams();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('_subject', `[kamioshi.si] ${subject}`);
    formData.append('topic', subject);
    formData.append('message', message);
    formData.append('_captcha', 'false');
    formData.append('_template', 'table');

    // First attempt: FormSubmit AJAX endpoint
    let upstreamRes = await fetch(formSubmitUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      body: JSON.stringify(forwardPayload)
    });

    // If AJAX endpoint returns 429 rate-limit, fallback to standard form-urlencoded POST
    if (upstreamRes.status === 429) {
      const fallbackUrl = `https://formsubmit.co/${encodeURIComponent(target)}`;
      upstreamRes = await fetch(fallbackUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'text/html,application/xhtml+xml,application/json',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        },
        body: formData.toString()
      });
    }

    if (upstreamRes.ok || upstreamRes.status === 302 || upstreamRes.status === 303) {
      return jsonResponse({
        ok: true,
        message: 'Your message has been delivered to the shrinekeeper.'
      });
    }

    const errText = await upstreamRes.text().catch(() => '');
    if (errText.includes('activate') || errText.includes('Confirm') || upstreamRes.status === 403) {
      // First-time FormSubmit initialization sends an activation email to target
      return jsonResponse({
        ok: true,
        message: 'Message registered. If this is your first submission, check your inbox to activate FormSubmit.'
      });
    }

    return jsonResponse(
      { error: 'Unable to deliver message at this time.', upstreamStatus: upstreamRes.status, upstreamResponse: errText },
      upstreamRes.status || 502
    );
  } catch (err) {
    return jsonResponse(
      { error: 'Failed to process contact request.', details: String(err) },
      500
    );
  }
};
