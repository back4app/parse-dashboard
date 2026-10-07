import { getUsagePercent } from '../../AppPlan/usageClassUtils';

// Same thresholds as the usage bars: yellow above 70%, red above 90%.
const WARNING_PERCENT = 70;
const DANGER_PERCENT = 90;

// Over-quota prices from the pricing page FAQ. Requests depend on the plan. Only the current
// MVP and Pay As You Go publish them, and Advanced has the same limits and prices as
// Pay As You Go: the other legacy plans get the warning without a price.
const EXTRA_REQUESTS_PRICE = { MVP: '$5', 'Pay As You Go': '$2', Advanced: '$2' };

// The next plan up, by kind. Legacy plans follow the current plan of their size.
const UPGRADE_TARGET = { free: 'MVP', starter: 'MVP', mvp: 'Pay As You Go', payg: 'Dedicated' };

// Listed by priority when two limits are equally urgent: API requests run out first,
// then the database, then file storage.
const resourcesOf = planData => [
  {
    label: 'API requests',
    monthly: true,
    used: planData.apiCallUsed || planData.apiCallUsedNormalized,
    limit: planData.apiCallLimit,
    overage: plan => `extra requests are billed at ${EXTRA_REQUESTS_PRICE[plan]} per 100K`,
  },
  {
    label: 'database storage',
    used: planData.dataStorageUsed || planData.dataStorageUsedNormalized,
    limit: planData.dataStorageLimit,
    overage: () => 'extra database storage is billed at $15 per GB',
  },
  {
    label: 'file storage',
    used: planData.fileStorageUsed || planData.fileStorageUsedNormalized,
    limit: planData.fileStorageLimit,
    overage: () => 'extra file storage is billed at $1 per 10 GB',
  },
];

const planNameOf = planData => (planData && !(planData instanceof Error) && planData.planName) || '';

// Free is blocked over a limit; paid plans keep running and pay the overage.
// Legacy plans are grouped with the current plan of their size: Solo and Starter upgrade to
// MVP ('starter'), Basic, Intermediate and Standard follow MVP, Advanced follows Pay As You Go.
// Dedicated, Silver, Gold, Platinum and custom plans get no usage warnings.
export const planKindOf = planData => {
  const name = planNameOf(planData);
  if (/^free/i.test(name)) {
    return 'free';
  }
  if (/^(solo|starter)/i.test(name)) {
    return 'starter';
  }
  if (/^(mvp|basic|intermediate|standard)/i.test(name)) {
    return 'mvp';
  }
  if (/^advanced|pay\s*as\s*you\s*go/i.test(name)) {
    return 'payg';
  }
  return 'other';
};

// How the plan is called in a message: "MVP", "Starter", "Pay As You Go".
const planLabelOf = planData => {
  const name = planNameOf(planData).replace(/ Plan\b.*$/i, '').trim();
  return /pay\s*as\s*you\s*go/i.test(name) ? 'Pay As You Go' : name;
};

// " Above 100%, extra requests are billed at ..." when the plan publishes its overage price.
const overageOf = (worst, plan, lead) => (plan in EXTRA_REQUESTS_PRICE ? ` ${lead}${worst.overage(plan)}.` : '');

// The limit to talk about: most urgent first (over 100%, then red, then yellow) and, within
// the same level, the list order above. Also returns the others, most urgent first.
// Null when there is no usage data.
export const getMostUrgentUsage = planData => {
  if (!planData || planData instanceof Error) {
    return null;
  }
  const resources = resourcesOf(planData)
    .map((resource, priority) => {
      const percent = getUsagePercent(resource.used, resource.limit);
      return { ...resource, priority, percent, severity: severityOf(percent) };
    })
    .filter(resource => resource.percent !== null)
    .sort((a, b) => b.severity - a.severity || a.priority - b.priority);
  return resources.length ? { worst: resources[0], others: resources.slice(1) } : null;
};

// The plan the direct checkout sells from this one, or undefined when there is no next plan up.
export const upgradeTargetOf = planData => UPGRADE_TARGET[planKindOf(planData)];

// Decides the usage banner (Overview and Plan Usage). Returns null when there is nothing to say,
// or { level, message, action, actionLabel }. The action is 'checkout' with the `plan` to sell
// (the next one up) or, when there is no next plan to name, 'plans' for the Plan Usage page.
// Every plan follows the Free thresholds: yellow above 70%, red above 90%. Only the consequence
// changes: Free stops responding at 100%, paid plans keep running and pay the overage.
// The app is really blocked only when the server answers 402 or the plan is paused
// ("Free Plan - Paused"); a Free app over its limit still serves requests until then.
export const getUsageAlert = (planData, blocked = false) => {
  const kind = planKindOf(planData);
  const usage = getMostUrgentUsage(planData);
  const worst = usage && usage.worst;
  const paused = /paused/i.test(planNameOf(planData));
  const target = UPGRADE_TARGET[kind];
  const upgrade = target
    ? { action: 'checkout', plan: target, actionLabel: `Upgrade to ${target}` }
    : { action: 'plans', actionLabel: 'Upgrade plan' };

  if (blocked || paused) {
    return {
      level: 'blocked',
      message: blockedMessage(worst && worst.percent >= 100 ? worst : null),
      ...upgrade,
      ...(kind === 'free' ? { actionLabel: 'Upgrade to bring it back' } : {}),
    };
  }
  if (!worst || !target || worst.percent <= WARNING_PERCENT) {
    return null;
  }

  const level = worst.percent > DANGER_PERCENT ? 'danger' : 'warning';
  const percent = Math.floor(worst.percent);
  const amount = `(${worst.used} of ${worst.limit})`;

  if (kind === 'free') {
    // Over the limit but not paused yet: urgent and honest, the app can stop at any moment.
    if (worst.percent >= 100) {
      return {
        level,
        message: `Your app reached its ${worst.label} limit and can stop responding at any moment. Upgrade now to keep it running.`,
        ...upgrade,
        actionLabel: 'Upgrade to keep it running',
      };
    }
    return {
      level,
      message: `${usageSummary(worst, percent, amount, '')}${othersClose(usage)} At 100%, your app stops responding and your users start getting errors.`,
      ...upgrade,
    };
  }

  // Paid plans keep running over their limits and pay the overage, so the message names the
  // price instead of an outage. Legacy plans have no published price and point at the next plan up.
  const plan = planLabelOf(planData);
  const message = worst.percent >= 100
    ? `This app used ${percent}% of its ${plan} ${worst.label} ${amount}.${overageOf(worst, plan, 'It keeps running, and ')}`
    : `${usageSummary(worst, percent, amount, ` on ${plan}`)}${othersClose(usage)}${overageOf(worst, plan, 'Above 100%, ')}`;
  return { level, message, ...upgrade };
};

// The sidebar pill next to Plan Usage, following the same rules as the banner.
// Null when the banner would say nothing (blocked apps aside). Free stops at its limit, so its
// pill caps at 100%; paid plans show how far over they are.
export const getUsageBadge = planData => {
  const kind = planKindOf(planData);
  const usage = getMostUrgentUsage(planData);
  const worst = usage && usage.worst;
  if (!worst || !UPGRADE_TARGET[kind] || worst.percent <= WARNING_PERCENT) {
    return null;
  }
  const percent = Math.floor(worst.percent);
  return {
    percent: kind === 'free' ? Math.min(100, percent) : percent,
    level: worst.percent > DANGER_PERCENT ? 'danger' : 'warning',
  };
};

const usageSummary = (worst, percent, amount, onPlan) =>
  worst.monthly
    ? `You've used ${percent}% of this month's ${worst.label}${onPlan} ${amount}.`
    : `Your ${worst.label} is ${percent}% full${onPlan} ${amount}.`;

const othersClose = usage => {
  const count = usage.others.filter(resource => resource.percent > WARNING_PERCENT).length;
  return count ? ` ${count} other ${count === 1 ? 'limit is' : 'limits are'} close too.` : '';
};

const severityOf = percent => {
  if (percent >= 100) {
    return 3;
  }
  if (percent > DANGER_PERCENT) {
    return 2;
  }
  return percent > WARNING_PERCENT ? 1 : 0;
};

const blockedMessage = worst =>
  `Your app stopped responding: it reached its ${worst ? worst.label : 'plan'} limit. Your app's users are getting errors right now.`;
