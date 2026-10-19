import { useEffect } from 'react';
import { amplitudeLogEvent } from './amplitudeEvents';

// Free -> paid funnel for the Backend product:
// gate viewed -> gate clicked -> checkout opened -> loaded -> payment initiated
// -> (failed | closed | At Checkout - Subscription Successful).
// Prefixed with baas_ so the Agent's upgrade_* charts keep counting only the Agent.
export const UpgradeEvent = {
  GATE_VIEWED: 'baas_upgrade_gate_viewed',
  GATE_CLICKED: 'baas_upgrade_gate_clicked',
  CHECKOUT_OPENED: 'baas_checkout_opened',
  CHECKOUT_CLOSED: 'baas_checkout_closed',
  // What happens INSIDE the Paddle frame: without these the funnel can't tell
  // "never saw the form" from "saw it and left" from "tried to pay and was declined".
  CHECKOUT_LOADED: 'baas_checkout_loaded',
  PAYMENT_INITIATED: 'baas_payment_initiated',
  PAYMENT_FAILED: 'baas_payment_failed',
  // Everything else Paddle reports from the frame, under Paddle's own `name`: an error
  // or warning shown to the buyer, a checkout that failed to load, the method picked.
  CHECKOUT_EVENT: 'baas_checkout_event',
};

const PADDLE_FUNNEL_EVENTS = {
  'checkout.loaded': UpgradeEvent.CHECKOUT_LOADED,
  'checkout.payment.initiated': UpgradeEvent.PAYMENT_INITIATED,
  'checkout.payment.failed': UpgradeEvent.PAYMENT_FAILED,
};

// Not sent as baas_checkout_event: the funnel steps above, completion and close (the
// callbacks handle them), and frame plumbing that says nothing about the buyer
// (`checkout.ping.size` fires on every resize).
const PADDLE_NOT_FORWARDED = new Set([
  ...Object.keys(PADDLE_FUNNEL_EVENTS),
  'checkout.completed',
  'checkout.closed',
  'checkout.ping.size',
  'checkout.removespinner',
  'checkout.frame.revealed',
]);

// What one Paddle.js event sends to Amplitude, or null. The che_ id rides along (it is
// what Paddle support asks for), and so does Paddle's error message, cut short. `seen`
// belongs to the checkout open now: each name and error code goes out once.
// No card or email data is read.
export const paddleEventToTrack = (event, seen) => {
  const name = event && (event.name || event.type);
  if (!name) {
    return null;
  }
  const checkoutId = event.data && event.data.id;
  const errorFields = event.error
    ? {
      error_type: event.error.type,
      error_code: event.error.code,
      error_detail: event.error.detail ? event.error.detail.slice(0, 200) : event.error.detail,
    }
    : {};
  if (PADDLE_FUNNEL_EVENTS[name]) {
    return { eventType: PADDLE_FUNNEL_EVENTS[name], properties: { checkout_id: checkoutId, ...errorFields } };
  }
  const seenKey = `${name}|${(event.error && event.error.code) || ''}`;
  if (PADDLE_NOT_FORWARDED.has(name) || seen.has(seenKey)) {
    return null;
  }
  seen.add(seenKey);
  return { eventType: UpgradeEvent.CHECKOUT_EVENT, properties: { name, checkout_id: checkoutId, ...errorFields } };
};

// Logs a Paddle.js event with the funnel context of the checkout it belongs to.
export const trackPaddleEvent = (event, context, seen) => {
  if (!context) {
    return;
  }
  const tracked = paddleEventToTrack(event, seen);
  if (tracked) {
    amplitudeLogEvent(tracked.eventType, { ...context, ...tracked.properties });
  }
};

// The paid feature that made the user hit the paywall. Also sent as ?gate= to plan-usage
// so the checkout events there know where the user came from.
export const UpgradeGate = {
  WEB_HOSTING: 'web_hosting',
  CUSTOM_DOMAIN: 'custom_domain',
  EMAIL_TEMPLATES: 'email_templates',
  PARSE_OPTIONS: 'parse_options',
  JOBS: 'jobs',
  COLLABORATORS: 'collaborators',
  MONGODB_8: 'mongodb_8',
  DB_PROFILER: 'db_profiler',
  OVERVIEW_PLAN_CARD: 'overview_plan_card',
  OVERVIEW_PLAN_BADGE: 'overview_plan_badge',
  OVERVIEW_WEB_HOSTING: 'overview_web_hosting',
  HTTPS: 'https',
  BACKUP_DELETE_CLASS: 'backup_delete_class',
  BACKUP_DELETE_ROWS: 'backup_delete_rows',
  BACKUP_DELETE_COLUMN: 'backup_delete_column',
  USAGE_LIMIT: 'usage_limit',
  LOGS_RETENTION: 'logs_retention',
  REGION_CHANGE: 'region_change',
  COMPLIANCE_HIPAA: 'compliance_hipaa',
  COMPLIANCE_SOC2: 'compliance_soc2',
  COMPLIANCE_ISO27001: 'compliance_iso27001',
};

export const SUPPORT_TICKET_URL = 'https://help.back4app.com/hc/en-us/requests/new';

// Region migrations are requested through this form, on any plan.
export const regionChangeFormUrl = appId => `https://back4app.typeform.com/to/kMjTovFj?appId=${appId}`;

export const planUsagePath = (slug, gate) => `/apps/${slug}/plan-usage?gate=${gate}`;

export const getGateFromSearch = (search) => {
  try {
    return new URLSearchParams(search || '').get('gate') || null;
  } catch (e) {
    return null;
  }
};

export const logGateClicked = (gate, appId) =>
  amplitudeLogEvent(UpgradeEvent.GATE_CLICKED, { gate, app_id: appId });

// Renders nothing; logs baas_upgrade_gate_viewed once when the paywall is shown.
export const UpgradeGateView = ({ gate, appId }) => {
  useEffect(() => {
    amplitudeLogEvent(UpgradeEvent.GATE_VIEWED, { gate, app_id: appId });
  }, [gate, appId]);
  return null;
};
