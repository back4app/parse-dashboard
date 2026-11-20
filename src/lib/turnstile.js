/* global b4aSettings */
/**
 * Cloudflare Turnstile token for app creation (action `create-backend-app`), sent as
 * `cf-turnstile-response`.
 *
 * A token is good once, so each call renders a new widget and removes it when it answers. The
 * widget shows nothing unless Cloudflare needs the person to do something; then it appears at the
 * bottom of the page until it is solved.
 *
 * The site key comes from b4aSettings.TURNSTILE_SITE_KEY; without one, Cloudflare's test key.
 */

const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const TEST_SITE_KEY = '1x00000000000000000000AA';
const SITE_KEY = b4aSettings.TURNSTILE_SITE_KEY || TEST_SITE_KEY;
export const CREATE_APP_CAPTCHA_ACTION = 'create-backend-app';
// What the API answers for a missing or bad token.
export const CAPTCHA_FAILED_ERROR = 'Please fill the captcha correctly';
// Long enough for someone who has to click the widget.
const TIMEOUT_MS = 120000;

let loading = null;
let host = null;

const loadTurnstile = () => {
  if (window.turnstile) {
    return Promise.resolve(window.turnstile);
  }
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = SCRIPT_URL;
      script.async = true;
      script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('Turnstile did not load')));
      script.onerror = () => {
        loading = null;
        script.remove();
        reject(new Error('Turnstile did not load'));
      };
      document.head.appendChild(script);
    });
  }
  return loading;
};

const getHost = () => {
  if (!host || !document.body.contains(host)) {
    host = document.createElement('div');
    host.setAttribute('data-turnstile-captcha', '');
    Object.assign(host.style, {
      position: 'fixed',
      left: '50%',
      bottom: '24px',
      transform: 'translateX(-50%)',
      zIndex: '2147483647',
    });
    document.body.appendChild(host);
  }
  return host;
};

/** A one-use Turnstile token for `action`, or null when the captcha could not be loaded or solved. */
export const getCaptchaToken = async (action = CREATE_APP_CAPTCHA_ACTION) => {
  if (!SITE_KEY) {
    return null;
  }
  let turnstile;
  try {
    turnstile = await loadTurnstile();
  } catch (e) {
    return null;
  }
  return new Promise((resolve) => {
    const holder = document.createElement('div');
    getHost().appendChild(holder);
    let widgetId = null;
    let done = false;
    let timer = null;
    const finish = (token) => {
      if (done) {
        return;
      }
      done = true;
      clearTimeout(timer);
      try {
        if (widgetId !== null) {
          turnstile.remove(widgetId);
        }
      } catch (e) {
        // already gone
      }
      holder.remove();
      resolve(token || null);
    };
    timer = setTimeout(() => finish(null), TIMEOUT_MS);
    try {
      widgetId = turnstile.render(holder, {
        sitekey: SITE_KEY,
        action,
        appearance: 'interaction-only',
        callback: (token) => finish(token),
        'error-callback': () => finish(null),
        'expired-callback': () => finish(null),
        'timeout-callback': () => finish(null),
      });
    } catch (e) {
      finish(null);
    }
  });
};
