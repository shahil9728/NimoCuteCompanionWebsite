/**
 * Nimo — waitlist welcome email.
 * GENERATED FILE — edit email/welcome.html and run `npm run email:script`.
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
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ ok: false, error: 'invalid email' });

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

var PLAIN_BODY = `You're on the list.

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

var HTML_BODY = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" />
<meta name="color-scheme" content="dark light" />
<meta name="supported-color-schemes" content="dark light" />
<title>You're on the Nimo waitlist</title>
<!--[if mso]>
<style type="text/css">
  body, table, td, a { font-family: Arial, Helvetica, sans-serif !important; }
</style>
<![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#05070a;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">

<!-- Preheader: the grey preview line in the inbox. Hidden in the body. -->
<div style="display:none;font-size:1px;color:#05070a;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
  You're on the list — Nimo is being built right now, and you'll be first in line when pre-orders open.
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#05070a;margin:0;padding:0;">
<tr>
<td align="center" style="padding:28px 12px 40px 12px;">

  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:#0b0f16;border-radius:18px;overflow:hidden;border:1px solid #1b2430;">

    <!-- ============ HEADER ============ -->
    <tr>
      <td align="left" style="padding:26px 32px 22px 32px;background-color:#0b0f16;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td valign="middle" style="padding-right:12px;">
              <img src="https://www.heynimo.in/email/logo.png" width="42" height="42" alt="Nimo"
                   style="display:block;width:42px;height:42px;color:#93a3b2;font-family:Inter,Helvetica,Arial,sans-serif;font-size:13px;line-height:1.5;border:0;outline:none;text-decoration:none;" />
            </td>
            <td valign="middle" style="font-family:'Inter Tight',Inter,'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:23px;font-weight:700;letter-spacing:-0.02em;color:#eef4f8;">
              nimo
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- ============ HERO IMAGE ============ -->
    <tr>
      <td style="padding:0;background-color:#04070b;">
        <img src="https://www.heynimo.in/email/hero.jpg" width="600" alt="Nimo, a cute round AI companion robot with glowing cyan eyes, sitting on a car dashboard at night"
             style="display:block;width:100%;max-width:600px;height:auto;color:#93a3b2;font-family:Inter,Helvetica,Arial,sans-serif;font-size:13px;line-height:1.5;border:0;outline:none;text-decoration:none;" />
      </td>
    </tr>

    <!-- ============ HEADLINE ============ -->
    <tr>
      <td style="padding:34px 32px 0 32px;">
        <p style="margin:0 0 14px 0;font-family:'JetBrains Mono',Consolas,Menlo,monospace;font-size:11px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:#35e0ff;">
          You're on the list
        </p>
        <h1 style="margin:0 0 18px 0;font-family:'Inter Tight',Inter,'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:32px;line-height:1.15;font-weight:800;letter-spacing:-0.03em;color:#ffffff;">
          Nimo can't wait to meet you.
        </h1>
        <p style="margin:0 0 16px 0;font-family:Inter,'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:16px;line-height:1.7;color:#c6d2dc;">
          Thank you for joining the waitlist — genuinely. Nimo is still being built, and early people like you are the reason it gets made at all.
        </p>
        <p style="margin:0;font-family:Inter,'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:16px;line-height:1.7;color:#c6d2dc;">
          Your spot is saved. When the first batch opens, you'll hear from us before anyone else.
        </p>
      </td>
    </tr>

    <!-- ============ DIVIDER ============ -->
    <tr>
      <td style="padding:30px 32px 0 32px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td style="height:1px;background-color:#1b2430;font-size:0;line-height:0;">&nbsp;</td></tr>
        </table>
      </td>
    </tr>

    <!-- ============ WHAT HAPPENS NEXT ============ -->
    <tr>
      <td style="padding:26px 32px 0 32px;">
        <p style="margin:0 0 18px 0;font-family:'Inter Tight',Inter,'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:18px;font-weight:700;letter-spacing:-0.01em;color:#ffffff;">
          What happens next
        </p>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td valign="top" width="30" style="padding:0 0 16px 0;font-family:'JetBrains Mono',Consolas,monospace;font-size:13px;font-weight:600;color:#35e0ff;">01</td>
            <td valign="top" style="padding:0 0 16px 0;font-family:Inter,'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#c6d2dc;">
              <strong style="color:#eef4f8;">We keep building.</strong> Nimo's personality, expressions and dashboard smarts are still in the workshop.
            </td>
          </tr>
          <tr>
            <td valign="top" width="30" style="padding:0 0 16px 0;font-family:'JetBrains Mono',Consolas,monospace;font-size:13px;font-weight:600;color:#35e0ff;">02</td>
            <td valign="top" style="padding:0 0 16px 0;font-family:Inter,'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#c6d2dc;">
              <strong style="color:#eef4f8;">You get the first look.</strong> Real photos, the reveal film, and the launch date — sent to you first.
            </td>
          </tr>
          <tr>
            <td valign="top" width="30" style="padding:0;font-family:'JetBrains Mono',Consolas,monospace;font-size:13px;font-weight:600;color:#35e0ff;">03</td>
            <td valign="top" style="padding:0;font-family:Inter,'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#c6d2dc;">
              <strong style="color:#eef4f8;">You choose to adopt.</strong> No charge, no commitment until you decide. The waitlist is free, always.
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- ============ PRODUCT SHOT ============ -->
    <tr>
      <td align="center" style="padding:32px 32px 0 32px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#04070b;border-radius:14px;border:1px solid #1b2430;">
          <tr>
            <td align="center" style="padding:22px 20px 18px 20px;">
              <img src="https://www.heynimo.in/email/product.jpg" width="200" alt="Nimo, a glossy white cat-eared companion robot with glowing cyan eyes on a glowing base"
                   style="display:block;width:200px;max-width:200px;height:auto;color:#93a3b2;font-family:Inter,Helvetica,Arial,sans-serif;font-size:13px;line-height:1.5;border:0;outline:none;text-decoration:none;border-radius:10px;" />
              <p style="margin:16px 0 0 0;font-family:Inter,'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:#93a3b2;">
                Small body. Big personality.<br />Three colorways — Glacier, Cloud and Ember.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- ============ CTA ============ -->
    <tr>
      <td align="center" style="padding:30px 32px 0 32px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="center" bgcolor="#35e0ff" style="border-radius:999px;">
              <a href="https://www.heynimo.in/?utm_source=welcome_email&amp;utm_medium=email&amp;utm_campaign=waitlist_welcome"
                 style="display:inline-block;padding:15px 34px;font-family:'Inter Tight',Inter,'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:16px;font-weight:700;letter-spacing:-0.01em;color:#04252e;text-decoration:none;border-radius:999px;">
                Meet Nimo again &rarr;
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- ============ SIGN-OFF ============ -->
    <tr>
      <td style="padding:30px 32px 34px 32px;">
        <p style="margin:0;font-family:Inter,'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7;color:#c6d2dc;">
          Got a question, or an idea for what Nimo should do?<br />
          Just reply to this email — it comes straight to us.
        </p>
        <p style="margin:18px 0 0 0;font-family:Inter,'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7;color:#93a3b2;">
          — The Nimo team
        </p>
      </td>
    </tr>

    <!-- ============ FOOTER ============ -->
    <tr>
      <td style="padding:22px 32px 26px 32px;background-color:#080c12;border-top:1px solid #1b2430;">
        <p style="margin:0 0 10px 0;font-family:Inter,'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#7d8b99;">
          You're receiving this because you joined the Nimo waitlist at
          <a href="https://www.heynimo.in/" style="color:#35e0ff;text-decoration:none;">heynimo.in</a>.
          We only email about Nimo, and never share your address.
        </p>
        <p style="margin:0 0 10px 0;font-family:Inter,'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#7d8b99;">
          <a href="https://www.heynimo.in/privacy" style="color:#93a3b2;text-decoration:underline;">Privacy</a>
          &nbsp;&middot;&nbsp;
          <a href="https://www.heynimo.in/terms" style="color:#93a3b2;text-decoration:underline;">Terms</a>
          &nbsp;&middot;&nbsp;
          <a href="mailto:nimo.cutu@gmail.com?subject=Unsubscribe%20me%20from%20the%20Nimo%20waitlist" style="color:#93a3b2;text-decoration:underline;">Unsubscribe</a>
        </p>
        <p style="margin:0;font-family:Inter,'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#5d6874;">
          &copy; 2026 Nimo Robotics Inc.
        </p>
      </td>
    </tr>

  </table>

</td>
</tr>
</table>

</body>
</html>
`;
