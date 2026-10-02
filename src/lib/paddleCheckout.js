/* global b4aSettings */
import { initializePaddle } from '@paddle/paddle-js';

const SANDBOX_PRICE_ID = 'pri_01jjykwj65y5de1vcv5xaryw8g';

export const Cycle = {
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
};

export const paddlePriceId = (plan, cycle) => {
  if (process.env.SENTRY_ENV !== 'production') {
    return SANDBOX_PRICE_ID;
  }
  return cycle === Cycle.YEARLY ? plan.annuallyProductId : plan.monthlyProductId;
};

export const paddlePlanId = (plan, cycle) =>
  cycle === Cycle.YEARLY ? plan.annuallyPlanId : plan.monthlyPlanId;

// Paddle.js keeps a single global instance; a later call replaces the event callback,
// so whoever opens a checkout must initialize right before opening it.
export const initPaddle = (eventCallback) =>
  initializePaddle({
    token: b4aSettings.PADDLE_TOKEN || 'test_0270ab179b4f4abd7aa228c7014',
    environment: process.env.SENTRY_ENV === 'production' ? 'production' : 'sandbox',
    pwCustomer: {},
    eventCallback,
  });

// Same side effects as the plan-usage checkout: link the subscription to the app,
// then report the purchase to Amplitude with the funnel context.
export const recordSubscription = async (data, funnelProps = {}) => {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'paddle_purchase',
    value: Number(data.data.totals.total),
    currency: data.data.currency_code,
    transaction_id: data.data.transaction_id,
  });

  const customData = data.data.custom_data || {};
  const paymentData = {
    appId: customData.app_id || customData.appId,
    customerId: data.data.customer.id,
    planName: data.data.items[0].product.name,
    transactionId: data.data.transaction_id,
    checkoutId: data.data.id,
    results: data.data,
    planId: customData.plan_id || customData.planId,
    email: data.data.customer.email,
  };

  try {
    await fetch(`${b4aSettings.BACK4APP_CHECKOUT_URL}/save-subscription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData),
    });
  } catch (e) {
    console.log('save-subscription error:', e);
  }

  try {
    await fetch('https://api.amplitude.com/2/httpapi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: b4aSettings.BACK4APP_AMPLITUDE_KEY,
        events: [
          {
            user_id: paymentData.email || 'unknown',
            event_type: 'At Checkout - Subscription Successful',
            time: Date.now(),
            event_properties: {
              appId: paymentData.appId,
              planName: paymentData.planName,
              planType: data.data.items[0].billing_cycle.interval,
              subscriptionTotal: data.data.totals.total,
              ...funnelProps,
            },
          },
        ],
      }),
    });
  } catch (error) {
    console.log('Amplitude error (checkout.completed):', error);
  }
};
