// The test preprocessor does not hoist jest.mock, so mocked modules are required after it.
jest.mock('context/currentApp', () => ({ CurrentApp: require('react').createContext(null) }), { virtual: true });
jest.mock('dashboard/Data/AppOverview/usageAlert', () => jest.requireActual('../../dashboard/Data/AppOverview/usageAlert'), { virtual: true });
jest.mock('components/Sidebar/PlanUsageBadge.scss', () => ({ badge: 'badge', warning: 'warning', danger: 'danger' }), { virtual: true });

const React = require('react');
const renderer = require('react-test-renderer');
const { CurrentApp } = require('context/currentApp');
const { getCachedPlanData, clearPlanDataCache } = require('../planDataCache');
const PlanUsageBadge = require('../../components/Sidebar/PlanUsageBadge.react').default;

const plan = overrides => ({
  planName: 'Free Plan',
  apiCallUsed: '2', apiCallLimit: '25 K',
  fileStorageUsed: '0 KB', fileStorageLimit: '1 GB',
  dataStorageUsed: '400 KB', dataStorageLimit: '0.25 GB',
  ...overrides,
});

const mount = async planData => {
  let tree;
  const app = { applicationId: 'app-badge', getAppPlanData: jest.fn(() => Promise.resolve(planData)) };
  await renderer.act(async () => {
    tree = renderer.create(
      <CurrentApp.Provider value={app}>
        <PlanUsageBadge />
      </CurrentApp.Provider>
    );
  });
  return tree.toJSON();
};

describe('PlanUsageBadge', () => {
  beforeEach(() => clearPlanDataCache());

  it('shows nothing while every limit is at 70% or less', async () => {
    expect(await mount(plan())).toBe(null);
  });

  it('shows the same limit as the banner: API first at the same urgency, in yellow', async () => {
    const badge = await mount(plan({ apiCallUsed: '18 K', fileStorageUsed: '799 MB' }));
    expect(badge.children).toEqual(['72', '%']);
    expect(badge.props.className).toBe('badge warning');
  });

  it('turns red above 90% and caps at 100%', async () => {
    expect((await mount(plan({ dataStorageUsed: '240 MB' }))).props.className).toBe('badge danger');
    clearPlanDataCache();
    expect((await mount(plan({ apiCallUsed: '30 K' }))).children).toEqual(['100', '%']);
  });
});

describe('PlanUsageBadge on paid plans', () => {
  beforeEach(() => clearPlanDataCache());

  it('MVP follows the Free colors and shows the real percentage past 100%', async () => {
    const yellow = await mount(plan({ planName: 'MVP Plan', apiCallUsed: '400 K', apiCallLimit: '500 K' }));
    expect(yellow.props.className).toBe('badge warning');
    clearPlanDataCache();
    const badge = await mount(plan({ planName: 'MVP Plan', apiCallUsed: '520 K', apiCallLimit: '500 K' }));
    expect(badge.children).toEqual(['104', '%']);
    expect(badge.props.className).toBe('badge danger');
  });

  it('Pay As You Go follows the same thresholds', async () => {
    expect(await mount(plan({ planName: 'Pay as you go Plan', apiCallUsed: '3.5 M', apiCallLimit: '5 M' }))).toBe(null);
    clearPlanDataCache();
    const yellow = await mount(plan({ planName: 'Pay as you go Plan', apiCallUsed: '4 M', apiCallLimit: '5 M' }));
    expect(yellow.props.className).toBe('badge warning');
    clearPlanDataCache();
    const badge = await mount(plan({ planName: 'Pay as you go Plan', apiCallUsed: '5.5 M', apiCallLimit: '5 M' }));
    expect(badge.children).toEqual(['110', '%']);
    expect(badge.props.className).toBe('badge danger');
  });

  it('legacy plans follow the plan of their size', async () => {
    const starter = await mount(plan({ planName: 'Starter Plan', apiCallUsed: '49 K', apiCallLimit: '50 K' }));
    expect(starter.props.className).toBe('badge danger');
    clearPlanDataCache();
    const advanced = await mount(plan({ planName: 'Advanced Plan', apiCallUsed: '4 M', apiCallLimit: '5 M' }));
    expect(advanced.props.className).toBe('badge warning');
    clearPlanDataCache();
    expect(await mount(plan({ planName: 'Gold Plan', apiCallUsed: '21 M', apiCallLimit: '20 M' }))).toBe(null);
  });

  it('Dedicated shows nothing', async () => {
    expect(await mount(plan({ planName: 'Dedicated Plan', dataStorageUsed: '7.9 GB', dataStorageLimit: '8 GB' }))).toBe(null);
  });
});

describe('getCachedPlanData', () => {
  beforeEach(() => clearPlanDataCache());

  it('fetches the plan once per app across sidebar remounts', async () => {
    const app = { applicationId: 'a', getAppPlanData: jest.fn(() => Promise.resolve({})) };
    await getCachedPlanData(app);
    await getCachedPlanData(app);
    expect(app.getAppPlanData).toHaveBeenCalledTimes(1);
  });

  it('retries after a failed request', async () => {
    const app = { applicationId: 'b', getAppPlanData: jest.fn().mockRejectedValueOnce(new Error('down')).mockResolvedValue({}) };
    await expect(getCachedPlanData(app)).rejects.toThrow('down');
    await getCachedPlanData(app);
    expect(app.getAppPlanData).toHaveBeenCalledTimes(2);
  });
});
