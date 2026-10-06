import { getUsagePercent } from '../../AppPlan/usageClassUtils';

// Same thresholds as the usage bars: yellow above 70%, red above 90%.
const WARNING_PERCENT = 70;
const DANGER_PERCENT = 90;

// Over-quota prices from the pricing page FAQ. Requests depend on the plan.
const EXTRA_REQUESTS_PRICE = { mvp: '$5', payg: '$2' };

// Listed by priority when two limits are equally urgent: API requests run out first,
// then the database, then file storage.
const resourcesOf = planData => [
  {
    label: 'API requests',
    monthly: true,
    used: planData.apiCallUsed || planData.apiCallUsedNormalized,
    limit: planData.apiCallLimit,
    overage: kind => `extra requests are billed at ${EXTRA_REQUESTS_PRICE[kind]} per 100K`,
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

// Free is blocked over a limit; MVP and Pay As You Go keep running and pay the overage.
// Dedicated and custom plans get no usage warnings.
export const planKindOf = planData => {
  const name = (planData && !(planData instanceof Error) && planData.planName) || '';
  if (/^free/i.test(name)) {
    return 'free';
  }
  if (/^mvp/i.test(name)) {
    return 'mvp';
  }
  if (/pay\s*as\s*you\s*go/i.test(name)) {
    return 'payg';
  }
  return 'other';
};

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

// Decides the usage banner (Overview and Plan Usage). Returns null when there is nothing to say,
// or { level, message, action } where action is 'checkout' (MVP checkout) or 'plans' with a label.
// The app is really blocked only when the server answers 402 or the plan is paused
// ("Free Plan - Paused"); a Free app over its limit still serves requests until then.
export const getUsageAlert = (planData, blocked = false) => {
  const kind = planKindOf(planData);
  const usage = getMostUrgentUsage(planData);
  const worst = usage && usage.worst;
  const paused = /paused/i.test((planData && !(planData instanceof Error) && planData.planName) || '');

  if (blocked || paused) {
    return {
      level: 'blocked',
      message: blockedMessage(worst && worst.percent >= 100 ? worst : null),
      action: kind === 'free' ? 'checkout' : 'plans',
      actionLabel: kind === 'free' ? 'Upgrade to bring it back' : 'Upgrade plan',
    };
  }
  if (!worst) {
    return null;
  }

  const percent = Math.floor(worst.percent);
  const amount = `(${worst.used} of ${worst.limit})`;

  if (kind === 'free') {
    if (worst.percent <= WARNING_PERCENT) {
      return null;
    }
    // Over the limit but not paused yet: urgent and honest, the app can stop at any moment.
    if (worst.percent >= 100) {
      return {
        level: 'danger',
        message: `Your app reached its ${worst.label} limit and can stop responding at any moment. Upgrade now to keep it running.`,
        action: 'checkout',
        actionLabel: 'Upgrade to keep it running',
      };
    }
    return {
      level: worst.percent > DANGER_PERCENT ? 'danger' : 'warning',
      message: `${usageSummary(worst, percent, amount, '')}${othersClose(usage)} At 100%, your app stops responding and your users start getting errors.`,
      action: 'checkout',
      actionLabel: 'Upgrade to MVP',
    };
  }

  // MVP keeps running over its limits and pays the overage: a yellow heads-up, never red.
  if (kind === 'mvp') {
    if (worst.percent <= WARNING_PERCENT) {
      return null;
    }
    const message = worst.percent >= 100
      ? `This app used ${percent}% of its MVP ${worst.label} ${amount}. It keeps running, and ${worst.overage(kind)}.`
      : `${usageSummary(worst, percent, amount, ' on MVP')}${othersClose(usage)} Above 100%, ${worst.overage(kind)}.`;
    return { level: 'warning', message, action: 'plans', actionLabel: 'Upgrade plan' };
  }

  // Pay As You Go already expects overage billing: say nothing until it is over a limit.
  if (kind === 'payg' && worst.percent >= 100) {
    return {
      level: 'info',
      message: `This app is above the ${worst.label} included in Pay As You Go ${amount}, so ${worst.overage(kind)}.`,
      action: 'plans',
      actionLabel: 'Upgrade to Dedicated',
    };
  }
  return null;
};

// The sidebar pill next to Plan Usage, following the same rules as the banner.
// Null when the banner would say nothing (blocked apps aside).
export const getUsageBadge = planData => {
  const kind = planKindOf(planData);
  const usage = getMostUrgentUsage(planData);
  const worst = usage && usage.worst;
  if (!worst) {
    return null;
  }
  const percent = Math.floor(worst.percent);
  if (kind === 'free' && worst.percent > WARNING_PERCENT) {
    return { percent: Math.min(100, percent), level: worst.percent > DANGER_PERCENT ? 'danger' : 'warning' };
  }
  if (kind === 'mvp' && worst.percent > WARNING_PERCENT) {
    return { percent, level: 'warning' };
  }
  if (kind === 'payg' && worst.percent >= 100) {
    return { percent, level: 'info' };
  }
  return null;
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
