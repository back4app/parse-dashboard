import {SHA256} from 'crypto-js';
import AccountManager from 'lib/AccountManager';
import { post } from 'lib/AJAX';

export const pushGTMEvent = (eventName, includeEmail = false) => {
  const email = includeEmail ? localStorage.getItem('username') || '' : ''
  const hashedEmail = SHA256(email).toString();
  if (window && window.dataLayer) {
    window.dataLayer.push({ event: eventName, email: hashedEmail})
  }
}

// Fires the `deep_activation` GTM event once per user, ever. It is triggered by
// "deep activation" actions (touching the DB structure/data, deploying cloud
// code, or sending a REST query). The `deepActivationFired` flag is persisted on
// the account so it only ever fires a single time, mirroring the once-per-user
// server flags (see `parseDashboardMobileAlertShown` in DashboardView).
export const fireDeepActivation = () => {
  const user = AccountManager.currentUser();
  if (!user || user.deepActivationFired) {
    return;
  }
  if (window && window.dataLayer) {
    window.dataLayer.push({ event: 'deep_activation' });
  }
  // Optimistically flip the flag locally so it does not fire again this session,
  // then persist it on the account so it never fires again for this user.
  user.deepActivationFired = true;
  AccountManager.setCurrentUser({ user });
  post('/b4aUser/parseDashboardDeepActivation').catch(() => {});
}
