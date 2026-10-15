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
  paddleEventToTrack,
  planUsagePath,
  trackPaddleEvent,
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

  it('keeps the Paddle funnel steps under their own names, with the che_ id', () => {
    expect(paddleEventToTrack({ name: 'checkout.loaded', data: { id: 'che_1' } }, new Set())).toEqual({
      eventType: 'baas_checkout_loaded',
      properties: { checkout_id: 'che_1' },
    });
    expect(
      paddleEventToTrack(
        {
          name: 'checkout.payment.failed',
          data: { id: 'che_1' },
          error: { type: 'payment_error', code: 'declined', detail: 'Card declined' },
        },
        new Set()
      )
    ).toEqual({
      eventType: 'baas_payment_failed',
      properties: { checkout_id: 'che_1', error_type: 'payment_error', error_code: 'declined', error_detail: 'Card declined' },
    });
  });

  it('sends every other Paddle event once, with the error Paddle showed', () => {
    const seen = new Set();
    const error = {
      name: 'checkout.error',
      data: { id: 'che_1' },
      error: { type: 'validation_error', code: 'postcode_required', detail: 'Postcode is required' },
    };
    expect(paddleEventToTrack(error, seen)).toEqual({
      eventType: 'baas_checkout_event',
      properties: {
        name: 'checkout.error',
        checkout_id: 'che_1',
        error_type: 'validation_error',
        error_code: 'postcode_required',
        error_detail: 'Postcode is required',
      },
    });
    expect(paddleEventToTrack(error, seen)).toBe(null);
    // Same name, another error: a different thing the buyer saw.
    const blocked = paddleEventToTrack({ type: 'checkout.error', error: { code: 'blocked', detail: 'x'.repeat(300) } }, seen);
    expect(blocked.properties.name).toBe('checkout.error');
    expect(blocked.properties.error_detail).toHaveLength(200);
  });

  it('leaves out completion, close and the frame plumbing', () => {
    const seen = new Set();
    ['checkout.completed', 'checkout.closed', 'checkout.ping.size', 'checkout.removespinner'].forEach(name =>
      expect(paddleEventToTrack({ name, data: { id: 'che_1' } }, seen)).toBe(null)
    );
    expect(paddleEventToTrack({}, seen)).toBe(null);
  });

  it('logs a Paddle event with the checkout context, and nothing without one', () => {
    const context = { app_id: 'app-1', plan: 'MVP', source: 'plan_page' };
    trackPaddleEvent({ name: 'checkout.payment.selected', data: { id: 'che_1' } }, context, new Set());
    expect(amplitudeLogEvent).toHaveBeenCalledWith('baas_checkout_event', {
      ...context,
      name: 'checkout.payment.selected',
      checkout_id: 'che_1',
    });

    amplitudeLogEvent.mockClear();
    trackPaddleEvent({ name: 'checkout.loaded', data: { id: 'che_1' } }, undefined, new Set());
    expect(amplitudeLogEvent).not.toHaveBeenCalled();
  });
});
