const { app } = require('@azure/functions');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const TO_EMAIL = process.env.CONTACT_EMAIL_TO || 'nandansaichigurupati08@gmail.com';

const SPAM_KEYWORDS = [
  'casino', 'crypto', 'bitcoin', 'seo service', 'buy now',
  'make money', 'free money', 'loan offer', 'investment opportunity',
  'viagra', 'cialis', 'xxx', 'adult content',
];

function containsSpam(text) {
  const lower = text.toLowerCase();
  return SPAM_KEYWORDS.some((kw) => lower.includes(kw));
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sanitize(str) {
  return str.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Simple in-memory rate limiter (per Azure Functions instance)
const rateLimitStore = new Map();
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 3;

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true };
  }
  if (entry.count >= MAX_REQUESTS) {
    return { allowed: false, resetIn: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count++;
  return { allowed: true };
}

app.http('submit', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    context.log('Contact form submission received.');

    // ── Rate Limiting ─────────────────────────────────────────────────────────
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    const rl = checkRateLimit(ip);
    if (!rl.allowed) {
      return {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
        jsonBody: {
          success: false,
          error: `Too many requests. Please wait ${rl.resetIn} seconds before trying again.`,
        },
      };
    }

    // ── Parse Body ────────────────────────────────────────────────────────────
    let body;
    try {
      body = await request.json();
    } catch {
      return {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        jsonBody: { success: false, error: 'Invalid request body.' },
      };
    }

    const { name, email, subject, message, botcheck } = body;

    // ── Honeypot ──────────────────────────────────────────────────────────────
    if (botcheck && botcheck.trim() !== '') {
      context.warn('Honeypot triggered — bot submission discarded.');
      return {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        jsonBody: { success: true, message: 'Message sent successfully!' },
      };
    }

    // ── Validation ────────────────────────────────────────────────────────────
    if (!name || name.trim().length < 2)
      return { status: 400, headers: { 'Content-Type': 'application/json' }, jsonBody: { success: false, error: 'Full Name must be at least 2 characters.' } };
    if (!email || !isValidEmail(email.trim()))
      return { status: 400, headers: { 'Content-Type': 'application/json' }, jsonBody: { success: false, error: 'Please enter a valid email address.' } };
    if (!subject || subject.trim().length < 3)
      return { status: 400, headers: { 'Content-Type': 'application/json' }, jsonBody: { success: false, error: 'Subject must be at least 3 characters.' } };
    if (!message || message.trim().length < 10)
      return { status: 400, headers: { 'Content-Type': 'application/json' }, jsonBody: { success: false, error: 'Message must be at least 10 characters.' } };

    // ── Spam Detection ────────────────────────────────────────────────────────
    if (containsSpam(`${name} ${subject} ${message}`)) {
      return {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        jsonBody: { success: false, error: 'Your message was flagged as spam. Please revise and try again.' },
      };
    }

    // ── Sanitize ──────────────────────────────────────────────────────────────
    const safeName    = sanitize(name);
    const safeEmail   = sanitize(email);
    const safeSubject = sanitize(subject);
    const safeMessage = sanitize(message);

    // ── Send via Resend ───────────────────────────────────────────────────────
    try {
      const { error } = await resend.emails.send({
        from: 'Portfolio Contact <onboarding@resend.dev>',
        to: [TO_EMAIL],
        replyTo: safeEmail,
        subject: `Portfolio Inquiry: ${safeSubject}`,
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head><meta charset="UTF-8"></head>
          <body style="margin:0;padding:0;background:#f6f3f2;font-family:Inter,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
              <tr><td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:4px;overflow:hidden;box-shadow:0 1px 8px rgba(0,0,0,0.06);">
                  <tr>
                    <td style="background:#173124;padding:32px 40px;">
                      <p style="margin:0;color:#98b5a3;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;">nandan.engineer</p>
                      <h1 style="margin:8px 0 0;color:#fff;font-size:24px;font-weight:600;">New Portfolio Message</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:40px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding-bottom:24px;border-bottom:1px solid #f0eded;">
                            <p style="margin:0 0 4px;color:#727973;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;">From</p>
                            <p style="margin:0;color:#1c1b1b;font-size:16px;font-weight:600;">${safeName}</p>
                            <p style="margin:4px 0 0;color:#424844;font-size:14px;">${safeEmail}</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:24px 0;border-bottom:1px solid #f0eded;">
                            <p style="margin:0 0 4px;color:#727973;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;">Subject</p>
                            <p style="margin:0;color:#1c1b1b;font-size:16px;font-weight:600;">${safeSubject}</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding-top:24px;">
                            <p style="margin:0 0 12px;color:#727973;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;">Message</p>
                            <p style="margin:0;color:#424844;font-size:15px;line-height:1.8;white-space:pre-wrap;">${safeMessage}</p>
                          </td>
                        </tr>
                      </table>
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;">
                        <tr>
                          <td>
                            <a href="mailto:${safeEmail}?subject=Re: ${safeSubject}"
                               style="display:inline-block;padding:14px 28px;background:#173124;color:#fff;text-decoration:none;font-size:13px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;">
                              Reply to ${safeName}
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:20px 40px;background:#f6f3f2;border-top:1px solid #ede9e8;">
                      <p style="margin:0;color:#727973;font-size:12px;">Sent via the contact form on nandan.engineer</p>
                    </td>
                  </tr>
                </table>
              </td></tr>
            </table>
          </body>
          </html>
        `,
        text: `New Portfolio Inquiry\n\nFrom: ${safeName} <${safeEmail}>\nSubject: ${safeSubject}\n\n${safeMessage}`,
      });

      if (error) {
        context.error('Resend error:', error);
        return {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
          jsonBody: { success: false, error: 'Failed to send email. Please try again later.' },
        };
      }

      context.log('Email sent successfully via Resend.');
      return {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        jsonBody: { success: true, message: "Your message has been sent! I'll get back to you soon." },
      };
    } catch (err) {
      context.error('Unhandled error:', err.message);
      return {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
        jsonBody: { success: false, error: 'A server error occurred. Please try again later.' },
      };
    }
  },
});
