/**
 * One-off GA4 setup for heynimo.in: creates the custom dimensions and key events that the
 * site's analytics (src/lib/analytics.ts, listed in README.md) send. Safe to run again:
 * anything that already exists is skipped.
 *
 * How to run (5 minutes, nothing to install):
 *  1. script.google.com -> New project.
 *  2. Left sidebar: Services (+) -> "Google Analytics Admin API" -> Add.
 *     Keep the identifier "AnalyticsAdmin"; pick version v1beta if it asks.
 *  3. Replace the contents of Code.gs with this file.
 *  4. Set PROPERTY_ID below: GA4 -> Admin -> Property details -> "Property ID"
 *     (a number like 456789012, NOT the G-3C9Z4YQVRT measurement ID).
 *  5. Select the function setupNimoGa4 in the toolbar and click Run. Approve the
 *     permissions with the Google account that is an Editor/Administrator on the property
 *     (if Google warns the app is unverified: Advanced -> Go to project; it is your own script).
 *  6. Read the Execution log: one line per item, "created" or "already there".
 */
const PROPERTY_ID = 'PUT_YOUR_NUMERIC_PROPERTY_ID_HERE';

const EVENT_DIMENSIONS = [
  // [parameter name, display name, description]
  ['location',    'Click location',   'Which form or button was used, e.g. hero, sticky, nimo-vs-emo-mid'],
  ['section',     'Section',          'Page section or article heading the visitor scrolled to'],
  ['question',    'Question',         'FAQ question opened, or post-signup survey question answered'],
  ['colorway',    'Colorway',         'Nimo colour picked: Glacier, Cloud or Ember'],
  ['emotion',     'Emotion',          'Mood picked in the Play with Nimo section'],
  ['area',        'Click area',       'Where the clicked link sits: nav, nav_menu, mobile_menu, footer, guide_card, article, page'],
  ['destination', 'Link destination', 'Site page the clicked link opens, e.g. /nimo-vs-emo'],
  ['network',     'Social network',   'Social profile clicked: x or instagram'],
  ['menu',        'Nav menu',         'Nav dropdown opened: Guides or Compare'],
  ['reason',      'Error reason',     'Why a waitlist join failed: empty, invalid_email or submit_failed'],
  ['lead_source', 'Lead source',      'Form that a new waitlist signup came from'],
  // older events
  ['cta',         'CTA name',            'Which call-to-action button was clicked'],
  ['label',       'Button label',        'Label of other tracked buttons, e.g. feedback-sent'],
  ['answer',      'Survey answer',       'Answer picked in the post-signup survey'],
  ['action',      'Action',              'Exit prompt or sticky bar action: shown, dismiss, join'],
  ['trigger',     'Exit prompt trigger', 'What opened or closed the exit prompt'],
  ['gesture',     'Play gesture',        'Playground gesture used: pet, boop, flick, hug, tickle'],
  ['name',        'Nimo milestone',      'Playground milestone: love, furious, all_tricks, cta_shown'],
  ['percent',     'Scroll depth',        'Percent of the page scrolled: 25, 50, 75, 100'],
];

const USER_DIMENSIONS = [
  ['waitlist_member', 'Waitlist member', 'Set to yes once this browser has joined the waitlist'],
];

const KEY_EVENTS = ['generate_lead', 'watch_the_film_cta_click'];

function setupNimoGa4() {
  if (!/^\d+$/.test(PROPERTY_ID)) throw new Error('Set PROPERTY_ID to the numeric GA4 property ID first.');
  const parent = 'properties/' + PROPERTY_ID;

  // Existing custom dimensions, so a second run doesn't fail on duplicates.
  const existing = {};
  let pageToken;
  do {
    const res = AnalyticsAdmin.Properties.CustomDimensions.list(parent, { pageSize: 200, pageToken: pageToken });
    (res.customDimensions || []).forEach((d) => { existing[d.scope + ':' + d.parameterName] = true; });
    pageToken = res.nextPageToken;
  } while (pageToken);

  const addDimension = (scope, [parameterName, displayName, description]) => {
    if (existing[scope + ':' + parameterName]) { Logger.log('already there: ' + displayName + ' (' + parameterName + ')'); return; }
    try {
      AnalyticsAdmin.Properties.CustomDimensions.create({ parameterName, displayName, description, scope }, parent);
      Logger.log('created: ' + displayName + ' (' + parameterName + ', ' + scope + ')');
    } catch (e) {
      Logger.log('FAILED: ' + displayName + ' (' + parameterName + '): ' + e.message);
    }
  };
  EVENT_DIMENSIONS.forEach((d) => addDimension('EVENT', d));
  USER_DIMENSIONS.forEach((d) => addDimension('USER', d));

  // Key events. Older versions of the API call them "conversion events".
  const keyApi = AnalyticsAdmin.Properties.KeyEvents || AnalyticsAdmin.Properties.ConversionEvents;
  const listed = keyApi.list(parent, { pageSize: 200 });
  const haveKey = {};
  (listed.keyEvents || listed.conversionEvents || []).forEach((k) => { haveKey[k.eventName] = true; });
  KEY_EVENTS.forEach((eventName) => {
    if (haveKey[eventName]) { Logger.log('already a key event: ' + eventName); return; }
    try {
      const body = AnalyticsAdmin.Properties.KeyEvents ? { eventName, countingMethod: 'ONCE_PER_EVENT' } : { eventName };
      keyApi.create(body, parent);
      Logger.log('key event created: ' + eventName);
    } catch (e) {
      Logger.log('FAILED key event ' + eventName + ': ' + e.message);
    }
  });

  Logger.log('Done. Data appears in reports from today onward, after 24-48 hours.');
}
