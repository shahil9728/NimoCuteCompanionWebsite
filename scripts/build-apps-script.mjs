/**
 * Generates apps-script/Code.gs from email/welcome.html.
 *
 * The welcome email is sent by a Google Apps Script web app running as the
 * nimo.cutu@gmail.com account — that is the only way to send genuinely FROM a
 * @gmail.com address (third-party senders fail SPF/DKIM for gmail.com and land
 * in spam). Apps Script needs the HTML inline, so it is injected here rather
 * than duplicated by hand.
 *
 *   npm run email:script
 *
 * Then paste apps-script/Code.gs into script.google.com and deploy.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(resolve(root, 'email/welcome.html'), 'utf8');

if (html.includes('`') || html.includes('${')) {
  throw new Error('welcome.html contains a backtick or ${ — it cannot be embedded as a template literal');
}

const PLAIN = `You're on the list.

Thank you for joining the Nimo waitlist — genuinely. Nimo is still being
built, and early people like you are the reason it gets made at all.

Your spot is saved. When the first batch opens, you'll hear from us before
anyone else.

WHAT HAPPENS NEXT
  01  We keep building. Nimo's personality, expressions and dashboard
      smarts are still in the workshop.
  02  You get the first look. Real photos, the reveal film, and the launch
      date — sent to you first.
  03  You choose to adopt. No charge, no commitment until you decide. The
      waitlist is free, always.

Take another look: https://www.heynimo.in/

Got a question, or an idea for what Nimo should do? Just reply to this
email — it comes straight to us.

— The Nimo team

---
You're receiving this because you joined the Nimo waitlist at heynimo.in.
Privacy: https://www.heynimo.in/privacy
Terms:   https://www.heynimo.in/terms
To unsubscribe, reply with "unsubscribe" and we'll remove you.
(c) 2026 Nimo Robotics Inc.`;

const code = `/**
 * Nimo — waitlist welcome email.
 * GENERATED FILE — edit email/welcome.html and run \`npm run email:script\`.
 *
 * Deployed as a Google Apps Script web app under nimo.cutu@gmail.com, so mail
 * is sent from that address with Google's own DKIM. Deploy settings must be:
 *   Execute as:      Me (nimo.cutu@gmail.com)
 *   Who has access:  Anyone
 *
 * Set SHARED_TOKEN below to a random string and use the same value for the
 * site's VITE_WELCOME_TOKEN. It is visible in the client bundle, so it is a
 * speed bump against casual abuse, not a secret — the daily cap and the
 * duplicate guard are the real protection.
 */

var SHARED_TOKEN = 'CHANGE_ME_TO_A_RANDOM_STRING';
var SUBJECT      = "You're on the Nimo waitlist 🐾";
var FROM_NAME    = 'Nimo';
var REPLY_TO     = 'nimo.cutu@gmail.com';
var DAILY_CAP    = 80;   // consumer Gmail allows ~100 recipients/day; leave headroom

function doPost(e) {
  try {
    var payload = {};
    try { payload = JSON.parse((e && e.postData && e.postData.contents) || '{}'); }
    catch (_) { payload = (e && e.parameter) || {}; }

    if (SHARED_TOKEN && payload.token !== SHARED_TOKEN) return json({ ok: false, error: 'bad token' });

    var email = String(payload.email || '').trim().toLowerCase();
    if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) return json({ ok: false, error: 'invalid email' });

    // Guard against double submits / retries hitting the same address twice.
    var cache = CacheService.getScriptCache();
    var key = 'sent:' + Utilities.base64Encode(email);
    if (cache.get(key)) return json({ ok: true, skipped: 'already sent recently' });

    // Stay well inside the account's daily sending quota.
    if (MailApp.getRemainingDailyQuota() < (100 - DAILY_CAP)) {
      return json({ ok: false, error: 'daily quota reached' });
    }

    MailApp.sendEmail({
      to: email,
      subject: SUBJECT,
      body: PLAIN_BODY,
      htmlBody: HTML_BODY,
      name: FROM_NAME,
      replyTo: REPLY_TO,
    });

    cache.put(key, '1', 21600); // 6 hours
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

// Visit the deployment URL in a browser to confirm it is live.
function doGet() {
  return json({ ok: true, service: 'nimo-welcome-email', quotaRemaining: MailApp.getRemainingDailyQuota() });
}

// Run this once from the editor to send yourself a test copy.
function sendTestEmail() {
  MailApp.sendEmail({
    to: Session.getActiveUser().getEmail(),
    subject: '[TEST] ' + SUBJECT,
    body: PLAIN_BODY,
    htmlBody: HTML_BODY,
    name: FROM_NAME,
    replyTo: REPLY_TO,
  });
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

var PLAIN_BODY = \`${PLAIN}\`;

var HTML_BODY = \`${html}\`;
`;

mkdirSync(resolve(root, 'apps-script'), { recursive: true });
writeFileSync(resolve(root, 'apps-script/Code.gs'), code);
console.log(`[email] apps-script/Code.gs written (${Math.round(code.length / 1024)} KB)`);
