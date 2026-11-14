/**
 * Nimo — waitlist welcome email.
 * GENERATED FILE — edit email/welcome.html and run `npm run email:script`.
 *
 * Deployed as a Google Apps Script web app under nimo.cutu@gmail.com, so mail
 * is sent from that address with Google's own DKIM. Deploy settings must be:
 *   Execute as:      Me (nimo.cutu@gmail.com)
 *   Who has access:  Anyone
 *
 * SHARED_TOKEN must equal the site's VITE_WELCOME_TOKEN. It is visible in the
 * client bundle, so it is a speed bump against casual abuse, not a secret;
 * the daily cap and the duplicate guard are the real protection.
 */

var SHARED_TOKEN = 'nimo-0CKoraAl0mnoFvsgc2FPVOm5';
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

Thank you for joining the Nimo waitlist, genuinely. Nimo is still being
built, and early friends like you are the reason he gets made at all.

Your spot is saved. When the first batch opens, you'll hear from us before
anyone else.

What happens next
  1  We keep building. His personality, expressions, and desk and
     dashboard smarts are still in the workshop.
  2  You get the first look. Real photos, the reveal film and the launch
     date, sent to you first.
  3  You choose to adopt. No charge and no commitment until you decide.
     The waitlist is free, always.

On your desk, by your bed or riding shotgun, he grows into the friend
you raise.

Meet Nimo again: https://www.heynimo.in/

Got a question, or an idea for what Nimo should do? Just reply to this
email. It comes straight to us.

The Nimo team

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
<meta name="color-scheme" content="light only" />
<meta name="supported-color-schemes" content="light" />
<title>You're on the Nimo waitlist</title>
<!-- Apple Mail and iOS load the heading font; everyone else falls back to their sans. -->
<link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@700&amp;display=swap" rel="stylesheet" />
<!--[if mso]>
<style type="text/css">
  body, table, td, a, h1, p { font-family: Arial, Helvetica, sans-serif !important; }
</style>
<![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#F5F2EC;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">

<!-- Preheader: the grey preview line in the inbox. Hidden in the body. -->
<div style="display:none;font-size:1px;color:#F5F2EC;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
  You're on the list. Nimo is being built right now, and you'll be first to hear when pre-orders open.
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F5F2EC;margin:0;padding:0;">
<tr>
<td align="center" style="padding:28px 12px 36px 12px;">

  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:#FFFFFF;border-radius:20px;overflow:hidden;border:1px solid #E2DCD1;">

    <!-- ============ HEADER: face icon + wordmark, like the site's nav ============ -->
    <tr>
      <td align="left" style="padding:24px 28px 20px 28px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td valign="middle" style="padding-right:10px;">
              <img src="https://www.heynimo.in/email/logo.png" width="36" height="36" alt=""
                   style="display:block;width:36px;height:36px;border:0;outline:none;text-decoration:none;" />
            </td>
            <td valign="middle">
              <img src="https://www.heynimo.in/email/nimo-wordmark.png" width="104" height="40" alt="Nimo"
                   style="display:block;width:104px;height:40px;border:0;outline:none;text-decoration:none;color:#111318;font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:700;" />
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- ============ HERO PHOTO ============ -->
    <tr>
      <td style="padding:0 20px;">
        <img src="https://www.heynimo.in/email/nimo-desk-hero.jpg" width="560" alt="Nimo, a glossy white cat-eared robot with a black screen face and big cartoon eyes, sitting on a wooden desk"
             style="display:block;width:100%;max-width:560px;height:auto;border:0;outline:none;text-decoration:none;border-radius:14px;color:#565B66;font-family:Arial,Helvetica,sans-serif;font-size:13px;" />
      </td>
    </tr>

    <!-- ============ HEADLINE ============ -->
    <tr>
      <td style="padding:30px 28px 0 28px;">
        <p style="margin:0 0 10px 0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;color:#2F5F9E;">
          You're on the list
        </p>
        <h1 style="margin:0 0 16px 0;font-family:Quicksand,'Trebuchet MS','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:30px;line-height:1.15;font-weight:700;color:#111318;">
          Nimo can't wait to meet you.
        </h1>
        <p style="margin:0 0 14px 0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:16px;line-height:1.65;color:#565B66;">
          Thank you for joining the waitlist, genuinely. Nimo is still being built, and early friends like you are the reason he gets made at all.
        </p>
        <p style="margin:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:16px;line-height:1.65;color:#565B66;">
          Your spot is saved. When the first batch opens, you'll hear from us before anyone else.
        </p>
      </td>
    </tr>

    <!-- ============ WHAT HAPPENS NEXT ============ -->
    <tr>
      <td style="padding:28px 28px 0 28px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F5F2EC;border-radius:16px;">
          <tr>
            <td style="padding:22px 22px 6px 22px;">
              <p style="margin:0 0 16px 0;font-family:Quicksand,'Trebuchet MS','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:19px;font-weight:700;color:#111318;">
                What happens next
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td valign="top" width="40" style="padding:0 0 16px 0;">
                    <div style="width:28px;height:28px;line-height:28px;border-radius:14px;background-color:#DCE8F7;color:#2F5F9E;text-align:center;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;font-weight:700;">1</div>
                  </td>
                  <td valign="top" style="padding:3px 0 16px 0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#565B66;">
                    <strong style="color:#111318;">We keep building.</strong> His personality, expressions, and desk and dashboard smarts are still in the workshop.
                  </td>
                </tr>
                <tr>
                  <td valign="top" width="40" style="padding:0 0 16px 0;">
                    <div style="width:28px;height:28px;line-height:28px;border-radius:14px;background-color:#DCE8F7;color:#2F5F9E;text-align:center;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;font-weight:700;">2</div>
                  </td>
                  <td valign="top" style="padding:3px 0 16px 0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#565B66;">
                    <strong style="color:#111318;">You get the first look.</strong> Real photos, the reveal film and the launch date, sent to you first.
                  </td>
                </tr>
                <tr>
                  <td valign="top" width="40" style="padding:0 0 16px 0;">
                    <div style="width:28px;height:28px;line-height:28px;border-radius:14px;background-color:#DCE8F7;color:#2F5F9E;text-align:center;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;font-weight:700;">3</div>
                  </td>
                  <td valign="top" style="padding:3px 0 16px 0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#565B66;">
                    <strong style="color:#111318;">You choose to adopt.</strong> No charge and no commitment until you decide. The waitlist is free, always.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- ============ SECOND PHOTO ============ -->
    <tr>
      <td style="padding:28px 28px 0 28px;">
        <img src="https://www.heynimo.in/email/nimo-rainy-window.jpg" width="544" alt="Nimo smiling with happy closed eyes on a desk by a rainy window, next to a glowing lamp"
             style="display:block;width:100%;max-width:544px;height:auto;border:0;outline:none;text-decoration:none;border-radius:14px;color:#565B66;font-family:Arial,Helvetica,sans-serif;font-size:13px;" />
        <p style="margin:14px 0 0 0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#565B66;">
          On your desk, by your bed or riding shotgun, he grows into the friend you raise.
        </p>
      </td>
    </tr>

    <!-- ============ BUTTON ============ -->
    <tr>
      <td align="left" style="padding:26px 28px 0 28px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="center" bgcolor="#111318" style="border-radius:999px;">
              <a href="https://www.heynimo.in/?utm_source=welcome_email&amp;utm_medium=email&amp;utm_campaign=waitlist_welcome"
                 style="display:inline-block;padding:14px 28px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:16px;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:999px;">
                Meet Nimo again
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- ============ SIGN-OFF ============ -->
    <tr>
      <td style="padding:26px 28px 30px 28px;">
        <p style="margin:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.65;color:#565B66;">
          Got a question, or an idea for what Nimo should do? Just reply to this email. It comes straight to us.
        </p>
        <p style="margin:14px 0 0 0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.65;color:#111318;font-weight:600;">
          The Nimo team
        </p>
      </td>
    </tr>

  </table>

  <!-- ============ FOOTER ============ -->
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">
    <tr>
      <td align="center" style="padding:20px 24px 0 24px;">
        <p style="margin:0 0 8px 0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#666B76;">
          You're receiving this because you joined the Nimo waitlist at
          <a href="https://www.heynimo.in/" style="color:#2F5F9E;text-decoration:underline;">heynimo.in</a>.
          We only email about Nimo, and never share your address.
        </p>
        <p style="margin:0 0 8px 0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#666B76;">
          <a href="https://www.heynimo.in/privacy" style="color:#565B66;text-decoration:underline;">Privacy</a>
          &nbsp;&middot;&nbsp;
          <a href="https://www.heynimo.in/terms" style="color:#565B66;text-decoration:underline;">Terms</a>
          &nbsp;&middot;&nbsp;
          <a href="mailto:nimo.cutu@gmail.com?subject=Unsubscribe%20me%20from%20the%20Nimo%20waitlist" style="color:#565B66;text-decoration:underline;">Unsubscribe</a>
        </p>
        <p style="margin:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#666B76;">
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
