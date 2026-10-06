import { getUsagePercent } from '../../AppPlan/usageClassUtils';

// Same thresholds as the usage bars: yellow above 70%, red above 90%.
const WARNING_PERCENT = 70;
const DANGER_PERCENT = 90;

// Listed by priority when two limits are equally urgent: API requests run out first,
// then the database, then file storage.
const resourcesOf = planData => [
  {
    label: 'API requests',
    monthly: true,
    used: planData.apiCallUsed || planData.apiCallUsedNormalized,
    limit: planData.apiCallLimit,
  },
  {
    label: 'database storage',
    used: planData.dataStorageUsed || planData.dataStorageUsedNormalized,
    limit: planData.dataStorageLimit,
  },
  {
    label: 'file storage',
    used: planData.fileStorageUsed || planData.fileStorageUsedNormalized,
    limit: planData.fileStorageLimit,
  },
];

// Decides the Overview usage banner. Apps over a limit without payment are blocked (the
// server answers 402), so the message is about the app stopping, never about waiting.
// Returns null when nothing is close to a limit.
export const getUsageAlert = (planData, blocked = false) => {
  if (!planData || planData instanceof Error) {
    return blocked ? { level: 'blocked', message: blockedMessage(null) } : null;
  }
  // Most urgent first (blocked, then red, then yellow); within the same level, list order wins.
  const resources = resourcesOf(planData)
    .map((resource, priority) => {
      const percent = getUsagePercent(resource.used, resource.limit);
      return { ...resource, priority, percent, severity: severityOf(percent) };
    })
    .filter(resource => resource.percent !== null)
    .sort((a, b) => b.severity - a.severity || a.priority - b.priority);
  const worst = resources[0];

  if (blocked || (worst && worst.percent >= 100)) {
    return { level: 'blocked', message: blockedMessage(worst && worst.percent >= 100 ? worst : null) };
  }
  if (!worst || worst.percent <= WARNING_PERCENT) {
    return null;
  }

  const percent = Math.floor(worst.percent);
  const amount = `(${worst.used} of ${worst.limit})`;
  const usage = worst.monthly
    ? `You've used ${percent}% of this month's ${worst.label} ${amount}.`
    : `Your ${worst.label} is ${percent}% full ${amount}.`;
  const othersClose = resources.slice(1).filter(resource => resource.percent > WARNING_PERCENT).length;
  const others = othersClose
    ? ` ${othersClose} other ${othersClose === 1 ? 'limit is' : 'limits are'} close too.`
    : '';

  return {
    level: worst.percent > DANGER_PERCENT ? 'danger' : 'warning',
    message: `${usage}${others} At 100%, your app stops responding and your users start getting errors.`,
  };
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
