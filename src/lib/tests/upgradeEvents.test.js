jest.mock('../amplitudeEvents', () => ({ amplitudeLogEvent: jest.fn() }));

// The test preprocessor does not hoist jest.mock, so mocked modules are required after it.
const React = require('react');
const renderer = require('react-test-renderer');
const { amplitudeLogEvent } = require('../amplitudeEvents');
const {
  UpgradeEvent,
  UpgradeGate,
  UpgradeGateView,
  getGateFromSearch,
  logGateClicked,
  planUsagePath,
} = require('../upgradeEvents');

describe('upgradeEvents', () => {
  beforeEach(() => amplitudeLogEvent.mockClear());

  it('builds the plan-usage path with the gate', () => {
    expect(planUsagePath('my-app', UpgradeGate.CUSTOM_DOMAIN)).toBe('/apps/my-app/plan-usage?gate=custom_domain');
  });

  it('reads the gate back from the query string', () => {
    expect(getGateFromSearch('?gate=custom_domain')).toBe('custom_domain');
    expect(getGateFromSearch('?foo=bar')).toBe(null);
    expect(getGateFromSearch('')).toBe(null);
    expect(getGateFromSearch(undefined)).toBe(null);
  });

  it('logs a gate click with the app id', () => {
    logGateClicked(UpgradeGate.JOBS, 'app-1');
    expect(amplitudeLogEvent).toHaveBeenCalledWith('baas_upgrade_gate_clicked', { gate: 'jobs', app_id: 'app-1' });
  });

  it('logs a gate view once when rendered, not on every re-render', () => {
    let tree;
    renderer.act(() => {
      tree = renderer.create(<UpgradeGateView gate={UpgradeGate.MONGODB_8} appId="app-1" />);
    });
    renderer.act(() => {
      tree.update(<UpgradeGateView gate={UpgradeGate.MONGODB_8} appId="app-1" />);
    });
    expect(tree.toJSON()).toBe(null);
    expect(amplitudeLogEvent).toHaveBeenCalledTimes(1);
    expect(amplitudeLogEvent).toHaveBeenCalledWith(UpgradeEvent.GATE_VIEWED, { gate: 'mongodb_8', app_id: 'app-1' });
  });

  it('keeps baas_ event names apart from the Agent upgrade_* events', () => {
    Object.values(UpgradeEvent).forEach(name => expect(name.startsWith('baas_')).toBe(true));
  });
});
