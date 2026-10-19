// The test preprocessor does not hoist jest.mock, so mocked modules are required after it.
// The preprocessor rewrites `lib/` and `components/` imports two levels up, which from
// dashboard/Data/Logs lands under src/dashboard; map those paths to the real modules.
jest.mock('../../dashboard/lib/upgradeEvents', () => jest.requireActual('../upgradeEvents'), { virtual: true });
jest.mock('../amplitudeEvents', () => ({ amplitudeLogEvent: jest.fn() }));
jest.mock(
  '../../dashboard/components/UpgradeCheckout/UpgradeCheckout.react',
  () => ({ UpgradeGateButton: ({ gate, renderTrigger }) => renderTrigger(() => gate) }),
  { virtual: true }
);
jest.mock('context/currentApp', () => ({ CurrentApp: require('react').createContext(null) }), { virtual: true });
jest.mock('dashboard/Data/Logs/Logs.scss', () => ({}), { virtual: true });

const React = require('react');
const renderer = require('react-test-renderer');
const { CurrentApp } = require('context/currentApp');
const LogsFooter = require('../../dashboard/Data/Logs/LogsFooter.react').default;

const mount = async (planName, props) => {
  let tree;
  const app = { applicationId: 'app-1', getAppPlanData: jest.fn(() => Promise.resolve({ planName })) };
  await renderer.act(async () => {
    tree = renderer.create(
      <CurrentApp.Provider value={app}>
        <LogsFooter {...props} />
      </CurrentApp.Provider>
    );
  });
  return { tree, app, text: JSON.stringify(tree.toJSON()) };
};

describe('LogsFooter', () => {
  it('always points to support for older logs', async () => {
    const { text } = await mount('MVP Plan', {});
    expect(text).toContain('Need older ones?');
    expect(text).toContain('https://help.back4app.com/hc/en-us/requests/new');
  });

  it('offers the week of access logs to Free on the Access screen', async () => {
    const { text } = await mount('Free Plan', { showRetention: true });
    expect(text).toContain('Free keeps access logs for 1 day; MVP keeps 7 days.');
    expect(text).toContain('Upgrade to MVP');
  });

  it('does not upsell paid plans or the other log screens', async () => {
    expect((await mount('MVP Plan', { showRetention: true })).text).not.toContain('Upgrade to MVP');
    const other = await mount('Free Plan', {});
    expect(other.text).not.toContain('Upgrade to MVP');
    expect(other.app.getAppPlanData).not.toHaveBeenCalled();
  });
});
