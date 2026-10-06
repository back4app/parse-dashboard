import React, { useContext, useEffect, useRef, useState } from 'react';
import Popover from 'components/Popover/Popover.react';
import Position from 'lib/Position';
import Button from 'components/Button/Button.react';
import Icon from 'components/Icon/Icon.react';
import AccountManager from 'lib/AccountManager';
import { CurrentApp } from 'context/currentApp';
import { amplitudeLogEvent } from 'lib/amplitudeEvents';
import { SUPPORT_TICKET_URL, UpgradeEvent, UpgradeGate, UpgradeGateView, logGateClicked, planUsagePath, regionChangeFormUrl } from 'lib/upgradeEvents';
import { Cycle, initPaddle, paddlePlanId, paddlePriceId, recordSubscription } from 'lib/paddleCheckout';
import { prices } from 'dashboard/AppPlan/prices';
import { getCachedPlanData } from 'lib/planDataCache';
import { planKindOf } from 'dashboard/Data/AppOverview/usageAlert';
import styles from './UpgradeCheckout.scss';

const CHECKOUT_FRAME_CLASS = 'upgrade-checkout-frame';
const ORIGIN = new Position(0, 0);

// Follows the OS/browser light or dark preference. Read once: Paddle cannot switch theme after opening.
const prefersDark = () =>
  typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

const MVP_AS_A_WHOLE = {
  plan: 'MVP',
  headline: 'Take this app to production',
  subline: 'Web hosting, daily backups, the latest MongoDB and your team in the app.',
};

const BACKUPS = {
  plan: 'MVP',
  headline: 'Keep daily backups of your data',
  subline: 'MVP keeps a daily backup of your app for 7 days.',
};

// What the user asked for when they hit the paywall, and the cheapest plan that unlocks it.
const GATE_OFFERS = {
  [UpgradeGate.WEB_HOSTING]: { plan: 'MVP', headline: 'Host your pages on a b4a.app subdomain' },
  [UpgradeGate.OVERVIEW_WEB_HOSTING]: { plan: 'MVP', headline: 'Host your pages on a b4a.app subdomain' },
  // Custom domains start on Pay As You Go (backend permission canChangeCustomDomain).
  [UpgradeGate.CUSTOM_DOMAIN]: {
    plan: 'Pay As You Go',
    headline: 'Use your own domain',
    subline: 'Pay As You Go includes custom domains with HTTPS.',
  },
  [UpgradeGate.EMAIL_TEMPLATES]: { plan: 'MVP', headline: 'Send emails with your brand and words' },
  [UpgradeGate.PARSE_OPTIONS]: { plan: 'MVP', headline: 'Tune your Parse Server' },
  [UpgradeGate.COLLABORATORS]: { plan: 'MVP', headline: 'Bring your team into this app' },
  // Only Free reaches this checkout from the job limit; paid plans go to Plan Usage.
  [UpgradeGate.JOBS]: { plan: 'MVP', headline: 'Schedule more background jobs', subline: 'MVP lets you schedule up to 3 jobs.' },
  // The overview's generic upgrade entry points: no single feature asked for, so they sell MVP as a whole.
  [UpgradeGate.OVERVIEW_PLAN_CARD]: MVP_AS_A_WHOLE,
  [UpgradeGate.OVERVIEW_PLAN_BADGE]: MVP_AS_A_WHOLE,
  [UpgradeGate.MONGODB_8]: {
    plan: 'MVP',
    headline: 'Get the latest MongoDB',
    subline: 'Faster queries and the newest MongoDB features.',
  },
  // Overview usage banner: near or over a Free limit, where the app gets blocked.
  [UpgradeGate.USAGE_LIMIT]: {
    plan: 'MVP',
    headline: 'Keep your app running',
    subline: 'MVP raises your limits to 500K requests, 1 GB of database and 50 GB of files.',
  },
  // Shown inside delete confirmations on Free, where nothing can be recovered.
  [UpgradeGate.BACKUP_DELETE_CLASS]: BACKUPS,
  [UpgradeGate.BACKUP_DELETE_ROWS]: BACKUPS,
  [UpgradeGate.BACKUP_DELETE_COLUMN]: BACKUPS,
  // Paid regions: paying unlocks them, the migration itself is still requested through the form.
  [UpgradeGate.REGION_CHANGE]: {
    plan: 'MVP',
    headline: 'Run your app closer to your users',
    subline: 'South Korea, India, Australia and Singapore are available on paid plans.',
    nextStep: 'Next, tell us which region to move your app to.',
    nextStepLink: { label: 'Request the migration', href: context => regionChangeFormUrl(context.applicationId) },
  },
  // HTTPS on a custom domain is turned on by support after the upgrade.
  [UpgradeGate.HTTPS]: {
    plan: 'Pay As You Go',
    headline: 'Serve your custom domain over HTTPS',
    subline: 'Your domain is on HTTP, so browsers mark it "Not secure".',
    nextStep: 'Next, open a support ticket and our team will enable HTTPS on your domain.',
    nextStepLink: { label: 'Open a ticket', href: () => SUPPORT_TICKET_URL },
  },
  [UpgradeGate.LOGS_RETENTION]: {
    plan: 'MVP',
    headline: 'Debug with a week of access logs',
    subline: 'Free keeps access logs for 1 day; MVP keeps 7 days.',
  },
  [UpgradeGate.DB_PROFILER]: {
    plan: 'Dedicated',
    headline: 'See which queries slow your app down',
    subline: 'The Query Performance Monitor comes with Dedicated.',
  },
  [UpgradeGate.COMPLIANCE_SOC2]: { plan: 'Pay As You Go', headline: 'Pass your customer\'s security review', subline: 'SOC 2 Type 2 certified infrastructure.' },
  [UpgradeGate.COMPLIANCE_ISO27001]: { plan: 'Pay As You Go', headline: 'Pass your customer\'s security review', subline: 'ISO 27001 certified infrastructure.' },
  [UpgradeGate.COMPLIANCE_HIPAA]: { plan: 'Dedicated', headline: 'Pass your customer\'s security review', subline: 'HIPAA-ready infrastructure, after a signed BAA.' },
};

const detailText = detail => [detail.number, detail.text].filter(Boolean).join(' ');

const priceSummary = (plan, cycle) => {
  if (cycle === Cycle.YEARLY) {
    const yearly = Number(plan.pricePerYear) * 12;
    return { perMonth: plan.pricePerYear, note: `Billed $${yearly}/year · save ${plan.savePercent}`, today: yearly };
  }
  return { perMonth: plan.pricePerMonth, note: 'Billed monthly · cancel anytime', today: Number(plan.pricePerMonth) };
};

const getOwnerEmail = async context => {
  if (context.custom && context.custom.isOwner) {
    return AccountManager.currentUser().email;
  }
  const { ownerEmail } = await context.getAppOwnerEmail();
  return ownerEmail;
};

// Opens the Paddle checkout for the plan that unlocks `gate`, skipping the plan comparison page.
export const UpgradeCheckoutModal = ({ gate, onClose }) => {
  const context = useContext(CurrentApp);
  const offer = GATE_OFFERS[gate];
  const plan = prices.find(p => p.name === offer.plan);

  const [dark] = useState(prefersDark);
  // Yearly first, like the pricing page; monthly stays one click away.
  const [cycle, setCycle] = useState(Cycle.YEARLY);
  const [paddle, setPaddle] = useState(null);
  const [ownerEmail, setOwnerEmail] = useState(null);
  const [frame, setFrame] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState(null);
  const funnel = useRef({ app_id: context.applicationId, plan: plan.name, cycle, source: 'gate', gate });
  const opened = useRef(false);

  useEffect(() => {
    let active = true;
    initPaddle(async data => {
      if (data.name === 'checkout.completed') {
        setCompleted(true);
        await recordSubscription(data, { source: 'gate', gate });
      }
    }).then(instance => active && setPaddle(instance || null)).catch(e => active && setError(e));
    getOwnerEmail(context).then(email => active && setOwnerEmail(email)).catch(e => active && setError(e));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!paddle || !ownerEmail || !frame || opened.current) {
      return;
    }
    opened.current = true;
    amplitudeLogEvent(UpgradeEvent.CHECKOUT_OPENED, funnel.current);
    paddle.Checkout.open({
      items: [{ priceId: paddlePriceId(plan, cycle), quantity: 1 }],
      settings: {
        displayMode: 'inline',
        theme: dark ? 'dark' : 'light',
        locale: 'en',
        variant: 'one-page',
        frameTarget: CHECKOUT_FRAME_CLASS,
        frameInitialHeight: '450',
        frameStyle: 'width: 100%; min-width: 312px; background-color: transparent; border: none;',
      },
      customData: { appId: context.applicationId, planId: paddlePlanId(plan, cycle) },
      allowLogout: false,
      customer: { email: ownerEmail },
    });
  }, [paddle, ownerEmail, frame]);

  const changeCycle = next => {
    if (next === cycle || completed) {
      return;
    }
    setCycle(next);
    funnel.current = { ...funnel.current, cycle: next };
    amplitudeLogEvent(UpgradeEvent.CHECKOUT_CYCLE_CHANGED, funnel.current);
    if (opened.current) {
      paddle.Checkout.updateCheckout({
        items: [{ priceId: paddlePriceId(plan, next), quantity: 1 }],
        customData: { appId: context.applicationId, planId: paddlePlanId(plan, next) },
      });
    }
  };

  const close = () => {
    if (completed) {
      // Reload so the paywall that brought the user here reflects the new plan.
      window.location.reload();
      return;
    }
    amplitudeLogEvent(UpgradeEvent.CHECKOUT_CLOSED, funnel.current);
    if (paddle && opened.current) {
      paddle.Checkout.close();
    }
    onClose();
  };

  const price = priceSummary(plan, cycle);

  return (
    <Popover fadeIn={true} fixed={true} position={ORIGIN} modal={true} color="rgba(17,13,17,0.8)">
      <div className={[styles.checkout, dark ? styles.dark : styles.light].join(' ')}>
        <button className={styles.close} onClick={close} aria-label="Close">
          <Icon name="close" width={12} height={12} fill={dark ? '#C3CAD6' : '#4A5568'} />
        </button>
        <div className={styles.summary}>
          <div className={styles.eyebrow}>Upgrade to {plan.name}</div>
          <div className={styles.headline}>{offer.headline}</div>
          {offer.subline ? <div className={styles.subline}>{offer.subline}</div> : null}
          <div className={styles.price}>
            <span className={styles.priceValue}>${price.perMonth}</span>
            <span className={styles.priceUnit}>/month</span>
          </div>
          <div className={styles.priceNote}>{price.note}</div>

          <div className={styles.cycles}>
            <label className={styles.cycle}>
              <input type="radio" checked={cycle === Cycle.YEARLY} onChange={() => changeCycle(Cycle.YEARLY)} disabled={completed} />
              Yearly · ${plan.pricePerYear}/month <span className={styles.save}>Save {plan.savePercent}</span>
            </label>
            <label className={styles.cycle}>
              <input type="radio" checked={cycle === Cycle.MONTHLY} onChange={() => changeCycle(Cycle.MONTHLY)} disabled={completed} />
              Monthly · ${plan.pricePerMonth}/month
            </label>
          </div>

          <div className={styles.benefits}>
            {plan.details.map((detail, idx) => (
              <div key={idx} className={styles.benefit}>
                <Icon name="b4a-check-icon" width={12} height={12} fill="#27AE60" />
                <span>{detailText(detail)}</span>
              </div>
            ))}
          </div>

          <div className={styles.total}>
            <span>Total today</span>
            <span>${price.today} + tax</span>
          </div>

          {completed ? (
            <div className={styles.done}>
              <div>
                You are on {plan.name} now.
                {offer.nextStep ? (
                  <div className={styles.nextStep}>
                    {offer.nextStep}{' '}
                    <a href={offer.nextStepLink.href(context)} target="_blank" rel="noopener noreferrer">{offer.nextStepLink.label}</a>
                  </div>
                ) : null}
              </div>
              <Button primary={true} value="Done" onClick={close} />
            </div>
          ) : (
            <a className={styles.comparePlans} href={planUsagePath(context.slug, gate)}>
              Compare all plans
            </a>
          )}
        </div>
        <div className={styles.payment}>
          {error ? (
            <div className={styles.error}>We could not load the checkout. Please refresh the page and try again.</div>
          ) : null}
          <div className={CHECKOUT_FRAME_CLASS} ref={setFrame}></div>
        </div>
      </div>
    </Popover>
  );
};

// Plan Usage for this app, keeping the gate so its checkout events know where the user came from.
const goToPlanUsage = (slug, gate) => {
  /* global b4aSettings */
  const base = (typeof b4aSettings !== 'undefined' && b4aSettings.BACKEND_DASHBOARD_PATH) || '';
  window.location.assign(`${base}${planUsagePath(slug, gate)}`);
};

// Paywall entry point: logs the gate view and, on click, opens the direct checkout. The direct
// checkout starts a new subscription, so it is only for Free apps; an app already on any paid
// plan (MVP, Starter, Gold, ...) goes to Plan Usage instead of buying a second plan.
// `renderTrigger(open)` lets anchors and custom buttons keep their look.
export const UpgradeGateButton = ({ gate, renderTrigger, value = 'Upgrade Plan' }) => {
  const context = useContext(CurrentApp);
  const [open, setOpen] = useState(false);
  const openCheckout = event => {
    if (event && event.preventDefault) {
      event.preventDefault();
    }
    logGateClicked(gate, context.applicationId);
    return getCachedPlanData(context)
      .then(planData => planKindOf(planData) === 'free')
      .catch(() => false)
      .then(isFree => (isFree ? setOpen(true) : goToPlanUsage(context.slug, gate)));
  };

  return (
    <>
      <UpgradeGateView gate={gate} appId={context.applicationId} />
      {renderTrigger ? renderTrigger(openCheckout) : <Button value={value} primary={true} onClick={openCheckout} trackClick={false} />}
      {open ? <UpgradeCheckoutModal gate={gate} onClose={() => setOpen(false)} /> : null}
    </>
  );
};
