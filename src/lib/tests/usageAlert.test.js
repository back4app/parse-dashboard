const { getUsageAlert } = require('../../dashboard/Data/AppOverview/usageAlert');

const plan = overrides => ({
  planName: 'Free Plan',
  apiCallUsed: '2',
  apiCallLimit: '25 K',
  fileStorageUsed: '0.00 KB',
  fileStorageLimit: '1 GB',
  dataStorageUsed: '400 KB',
  dataStorageLimit: '0.25 GB',
  ...overrides,
});

describe('getUsageAlert', () => {
  it('stays quiet while every limit is at 70% or less', () => {
    expect(getUsageAlert(plan({ apiCallUsed: '17.5 K' }))).toBe(null);
  });

  it('warns in yellow above 70% and names the resource and the consequence', () => {
    const alert = getUsageAlert(plan({ apiCallUsed: '21 K' }));
    expect(alert.level).toBe('warning');
    expect(alert.message).toBe(
      'You\'ve used 84% of this month\'s API requests (21 K of 25 K). At 100%, your app stops responding and your users start getting errors.'
    );
  });

  it('at the same urgency, talks about API requests first, then database, then files', () => {
    const alert = getUsageAlert(plan({ apiCallUsed: '18 K', fileStorageUsed: '799 MB', dataStorageUsed: '190 MB' }));
    expect(alert.level).toBe('warning');
    expect(alert.message).toContain('You\'ve used 72% of this month\'s API requests (18 K of 25 K).');
    expect(alert.message).toContain('2 other limits are close too.');

    const noApi = getUsageAlert(plan({ fileStorageUsed: '799 MB', dataStorageUsed: '190 MB' }));
    expect(noApi.message).toContain('Your database storage is 74% full');
  });

  it('a more urgent limit beats the priority order', () => {
    const alert = getUsageAlert(plan({ apiCallUsed: '18 K', fileStorageUsed: '990 MB' }));
    expect(alert.level).toBe('danger');
    expect(alert.message).toContain('Your file storage is 96% full');
  });

  it('turns red above 90% and leads with the fullest resource, counting the others', () => {
    const alert = getUsageAlert(plan({ apiCallUsed: '21 K', fileStorageUsed: '820 MB', dataStorageUsed: '235 MB' }));
    expect(alert.level).toBe('danger');
    expect(alert.message).toContain('Your database storage is 91% full (235 MB of 0.25 GB).');
    expect(alert.message).toContain('2 other limits are close too.');
  });

  it('never suggests waiting for the next month', () => {
    const alert = getUsageAlert(plan({ apiCallUsed: '24 K' }));
    expect(alert.message).not.toMatch(/month\b.*(reset|renew|until)/i);
    expect(alert.message).not.toMatch(/until/i);
  });

  it('at 100% on Free, warns that the app can stop at any moment (it still serves requests)', () => {
    const alert = getUsageAlert(plan({ apiCallUsed: '25 K' }));
    expect(alert.level).toBe('danger');
    expect(alert.message).toBe(
      'Your app reached its API requests limit and can stop responding at any moment. Upgrade now to keep it running.'
    );
    expect(alert.actionLabel).toBe('Upgrade to keep it running');
    expect(alert.message).not.toMatch(/stopped/);
  });

  it('reports a blocked app once the Free plan is paused', () => {
    const alert = getUsageAlert(plan({ planName: 'Free Plan - Paused', apiCallUsed: '25 K' }));
    expect(alert.level).toBe('blocked');
    expect(alert.message).toBe(
      'Your app stopped responding: it reached its API requests limit. Your app\'s users are getting errors right now.'
    );
    expect(alert.actionLabel).toBe('Upgrade to bring it back');
  });

  it('reports a blocked app when the server already answers 402, even with stale usage', () => {
    expect(getUsageAlert(plan(), true).level).toBe('blocked');
    expect(getUsageAlert(new Error('plan data failed'), true).message).toContain('reached its plan limit');
  });

  describe('MVP', () => {
    const mvp = overrides => plan({ planName: 'MVP Plan', apiCallLimit: '500 K', dataStorageLimit: '1 GB', fileStorageLimit: '50 GB', ...overrides });

    it('warns in yellow, never red, and names the overage price', () => {
      const alert = getUsageAlert(mvp({ apiCallUsed: '490 K' }));
      expect(alert.level).toBe('warning');
      expect(alert.message).toBe(
        'You\'ve used 98% of this month\'s API requests on MVP (490 K of 500 K). Above 100%, extra requests are billed at $5 per 100K.'
      );
      expect(alert.action).toBe('plans');
      expect(alert.actionLabel).toBe('Upgrade to Pay As You Go');
    });

    it('past 100% it keeps running and pays the overage, still yellow', () => {
      const alert = getUsageAlert(mvp({ apiCallUsed: '520 K' }));
      expect(alert.level).toBe('warning');
      expect(alert.message).toBe(
        'This app used 104% of its MVP API requests (520 K of 500 K). It keeps running, and extra requests are billed at $5 per 100K.'
      );
      expect(alert.message).not.toMatch(/stop/i);
    });

    it('uses the storage overage prices', () => {
      expect(getUsageAlert(mvp({ dataStorageUsed: '1.1 GB' })).message).toContain('extra database storage is billed at $15 per GB');
      expect(getUsageAlert(mvp({ fileStorageUsed: '55 GB' })).message).toContain('extra file storage is billed at $1 per 10 GB');
    });

    it('is red only when the server really blocks it', () => {
      expect(getUsageAlert(mvp({ apiCallUsed: '520 K' }), true).level).toBe('blocked');
    });
  });

  describe('Pay As You Go', () => {
    const payg = overrides => plan({ planName: 'Pay as you go Plan', apiCallLimit: '5 M', dataStorageLimit: '3 GB', fileStorageLimit: '250 GB', ...overrides });

    it('says nothing while under its included usage', () => {
      expect(getUsageAlert(payg({ apiCallUsed: '4.9 M' }))).toBe(null);
    });

    it('over its included usage, explains the overage and offers Dedicated', () => {
      const alert = getUsageAlert(payg({ apiCallUsed: '5.5 M' }));
      expect(alert.level).toBe('info');
      expect(alert.message).toBe(
        'This app is above the API requests included in Pay As You Go (5.5 M of 5 M), so extra requests are billed at $2 per 100K.'
      );
      expect(alert.actionLabel).toBe('Upgrade to Dedicated');
    });
  });

  describe('legacy plans', () => {
    const legacy = (planName, overrides) => plan({ planName, apiCallLimit: '50 K', dataStorageLimit: '1 GB', fileStorageLimit: '10 GB', ...overrides });

    it('Solo and Starter warn in yellow and offer MVP, without an overage price', () => {
      ['Solo Plan', 'Starter Plan'].forEach(planName => {
        const alert = getUsageAlert(legacy(planName, { apiCallUsed: '49 K' }));
        expect(alert.level).toBe('warning');
        expect(alert.action).toBe('plans');
        expect(alert.actionLabel).toBe('Upgrade to MVP');
        expect(alert.message).not.toMatch(/billed/);
      });
      expect(getUsageAlert(legacy('Starter Plan', { apiCallUsed: '49 K' })).message).toBe(
        'You\'ve used 98% of this month\'s API requests on Starter (49 K of 50 K).'
      );
      expect(getUsageAlert(legacy('Starter Plan', { apiCallUsed: '52 K' })).message).toBe(
        'This app used 104% of its Starter API requests (52 K of 50 K).'
      );
    });

    it('Basic, Intermediate and Standard offer Pay As You Go', () => {
      ['Basic Plan', 'Intermediate Plan', 'Standard Plan'].forEach(planName => {
        const alert = getUsageAlert(legacy(planName, { apiCallUsed: '40 K' }));
        expect(alert.level).toBe('warning');
        expect(alert.actionLabel).toBe('Upgrade to Pay As You Go');
        expect(alert.message).not.toMatch(/billed/);
      });
    });

    it('Advanced follows Pay As You Go: quiet until over its limit, then the same overage message', () => {
      const advanced = overrides => legacy('Advanced Plan', { apiCallLimit: '5 M', dataStorageLimit: '4 GB', fileStorageLimit: '250 GB', ...overrides });
      expect(getUsageAlert(advanced({ apiCallUsed: '4.9 M' }))).toBe(null);
      const alert = getUsageAlert(advanced({ apiCallUsed: '5.5 M' }));
      expect(alert.level).toBe('info');
      expect(alert.message).toBe(
        'This app is above the API requests included in Advanced (5.5 M of 5 M), so extra requests are billed at $2 per 100K.'
      );
      expect(alert.actionLabel).toBe('Upgrade to Dedicated');
      expect(getUsageAlert(advanced({ dataStorageUsed: '4.5 GB' })).message).toContain('so extra database storage is billed at $15 per GB');
    });

    it('a blocked legacy app is told which plan to move to', () => {
      expect(getUsageAlert(legacy('Starter Plan'), true).actionLabel).toBe('Upgrade to MVP');
      expect(getUsageAlert(legacy('Gold Plan'), true).actionLabel).toBe('Upgrade plan');
    });
  });

  it('Dedicated, Silver, Gold, Platinum and custom plans get no usage warnings', () => {
    ['Dedicated Plan', 'Silver Plan', 'Gold Plan', 'Platinum Plan', 'Custom Plan'].forEach(planName => {
      expect(getUsageAlert(plan({ planName, dataStorageUsed: '8.5 GB', dataStorageLimit: '8 GB' }))).toBe(null);
    });
  });

  it('shows nothing when plan data is missing and the app is not blocked', () => {
    expect(getUsageAlert(null)).toBe(null);
    expect(getUsageAlert(new Error('plan data failed'))).toBe(null);
  });
});
