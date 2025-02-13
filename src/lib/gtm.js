import {SHA256} from 'crypto-js';

export const pushGTMEvent = (eventName, includeEmail = false) => {
  const email = includeEmail ? localStorage.getItem('username') || '' : ''
  const hashedEmail = SHA256(email).toString();
  if (window && window.dataLayer) {
    window.dataLayer.push({ event: eventName, email: hashedEmail})
  }
}
