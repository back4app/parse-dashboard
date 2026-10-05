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

  it('reports a blocked app at 100%', () => {
    const alert = getUsageAlert(plan({ apiCallUsed: '25 K' }));
    expect(alert.level).toBe('blocked');
    expect(alert.message).toBe(
      'Your app stopped responding: it reached its API requests limit. Your app\'s users are getting errors right now.'
    );
  });

  it('reports a blocked app when the server already answers 402, even with stale usage', () => {
    expect(getUsageAlert(plan(), true).level).toBe('blocked');
    expect(getUsageAlert(new Error('plan data failed'), true).message).toContain('reached its plan limit');
  });

  it('shows nothing when plan data is missing and the app is not blocked', () => {
    expect(getUsageAlert(null)).toBe(null);
    expect(getUsageAlert(new Error('plan data failed'))).toBe(null);
  });
});
