// The test preprocessor does not hoist jest.mock, so mocked modules are required after it.
jest.mock('../amplitudeEvents', () => ({ amplitudeLogEvent: jest.fn() }));
jest.mock('../AccountManager', () => ({ currentUser: () => ({ email: 'owner@example.com' }) }));
jest.mock('../paddleCheckout', () => {
  const actual = jest.requireActual('../paddleCheckout');
  return { ...actual, initPaddle: jest.fn(), recordSubscription: jest.fn(() => Promise.resolve()) };
});
jest.mock('../../components/Icon/Icon.react', () => ({ __esModule: true, default: () => null }));
jest.mock('../../components/B4aModal/B4aModal.react', () => {
  const React = require('react');
  const B4aModal = ({ children, onCancel }) => (
    <div>
      <button id="modal-close" onClick={onCancel} />
      {children}
    </div>
  );
  B4aModal.Types = { DEFAULT: 'default' };
  return { __esModule: true, default: B4aModal };
});
jest.mock('context/currentApp', () => ({ CurrentApp: require('react').createContext(null) }), { virtual: true });
jest.mock(
  'dashboard/AppPlan/AppPlan.react',
  () => ({
    prices: [
      {
        name: 'MVP', pricePerMonth: '25', pricePerYear: '15', savePercent: '40%',
        monthlyPlanId: 'mvp-m', annuallyPlanId: 'mvp-y', monthlyProductId: 'pri_mvp_m', annuallyProductId: 'pri_mvp_y',
        details: [{ text: 'Custom domain & web hosting' }, { number: '500 K', text: 'Requests' }],
      },
      {
        name: 'Pay As You Go', pricePerMonth: '100', pricePerYear: '80', savePercent: '20%',
        monthlyPlanId: 'payg-m', annuallyPlanId: 'payg-y', monthlyProductId: 'pri_payg_m', annuallyProductId: 'pri_payg_y',
        details: [],
      },
      {
        name: 'Dedicated', pricePerMonth: '500', pricePerYear: '400', savePercent: '20%',
        monthlyPlanId: 'ded-m', annuallyPlanId: 'ded-y', monthlyProductId: 'pri_ded_m', annuallyProductId: 'pri_ded_y',
        details: [],
      },
    ],
  }),
  { virtual: true }
);

const React = require('react');
const renderer = require('react-test-renderer');
const { CurrentApp } = require('context/currentApp');
const { amplitudeLogEvent } = require('../amplitudeEvents');
const { initPaddle, recordSubscription } = require('../paddleCheckout');
const { UpgradeCheckoutModal, UpgradeGateButton, hasDirectCheckout } = require('../../components/UpgradeCheckout/UpgradeCheckout.react');

const app = { applicationId: 'app-1', slug: 'my-app', custom: { isOwner: true } };

const fakePaddle = () => ({ Checkout: { open: jest.fn(), updateCheckout: jest.fn(), close: jest.fn() } });

const loggedEvents = name => amplitudeLogEvent.mock.calls.filter(([event]) => event === name).map(([, props]) => props);

const textOf = tree => JSON.stringify(tree.toJSON());

// Renders inside the app context and lets the Paddle/owner-email promises settle.
const mount = async element => {
  let tree;
  await renderer.act(async () => {
    tree = renderer.create(<CurrentApp.Provider value={app}>{element}</CurrentApp.Provider>, {
      createNodeMock: () => ({}),
    });
  });
  return tree;
};

describe('UpgradeCheckoutModal', () => {
  let paddle;
  let paddleCallback;
  const prevEnv = process.env.SENTRY_ENV;

  beforeEach(() => {
    process.env.SENTRY_ENV = 'production';
    paddle = fakePaddle();
    amplitudeLogEvent.mockClear();
    recordSubscription.mockClear();
    initPaddle.mockReset();
    initPaddle.mockImplementation(callback => {
      paddleCallback = callback;
      return Promise.resolve(paddle);
    });
  });

  afterAll(() => {
    process.env.SENTRY_ENV = prevEnv;
  });

  it('opens the MVP monthly checkout right away for a custom domain paywall', async () => {
    const tree = await mount(<UpgradeCheckoutModal gate="custom_domain" onClose={() => {}} />);

    expect(paddle.Checkout.open).toHaveBeenCalledTimes(1);
    const options = paddle.Checkout.open.mock.calls[0][0];
    expect(options.items).toEqual([{ priceId: 'pri_mvp_m', quantity: 1 }]);
    expect(options.customData).toEqual({ appId: 'app-1', planId: 'mvp-m' });
    expect(options.customer).toEqual({ email: 'owner@example.com' });
    expect(options.settings.frameTarget).toBe('upgrade-checkout-frame');

    expect(loggedEvents('baas_checkout_opened')).toEqual([
      { app_id: 'app-1', plan: 'MVP', cycle: 'monthly', source: 'gate', gate: 'custom_domain' },
    ]);
    const text = textOf(tree);
    expect(text).toContain('Use your own domain');
    expect(text).toContain('Upgrade to ');
    expect(text).toContain('Custom domain & web hosting');
  });

  it('switches the open checkout to the yearly price without reopening it', async () => {
    const tree = await mount(<UpgradeCheckoutModal gate="custom_domain" onClose={() => {}} />);
    const radios = tree.root.findAll(node => node.type === 'input' && node.props.type === 'radio');

    renderer.act(() => radios[1].props.onChange());

    expect(paddle.Checkout.open).toHaveBeenCalledTimes(1);
    expect(paddle.Checkout.updateCheckout).toHaveBeenCalledWith({
      items: [{ priceId: 'pri_mvp_y', quantity: 1 }],
      customData: { appId: 'app-1', planId: 'mvp-y' },
    });
    expect(loggedEvents('baas_checkout_cycle_changed')).toEqual([
      { app_id: 'app-1', plan: 'MVP', cycle: 'yearly', source: 'gate', gate: 'custom_domain' },
    ]);
    // $15/month billed yearly is $180 today.
    expect(textOf(tree)).toContain('180');
  });

  it('logs the abandonment and closes when the user leaves without paying', async () => {
    const onClose = jest.fn();
    const tree = await mount(<UpgradeCheckoutModal gate="email_templates" onClose={onClose} />);

    renderer.act(() => tree.root.findByProps({ id: 'modal-close' }).props.onClick());

    expect(loggedEvents('baas_checkout_closed')).toEqual([
      { app_id: 'app-1', plan: 'MVP', cycle: 'monthly', source: 'gate', gate: 'email_templates' },
    ]);
    expect(paddle.Checkout.close).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('records the purchase with the gate and does not count it as abandoned', async () => {
    const tree = await mount(<UpgradeCheckoutModal gate="collaborators" onClose={() => {}} />);
    const completed = { name: 'checkout.completed', data: {} };

    await renderer.act(async () => {
      await paddleCallback(completed);
    });

    expect(recordSubscription).toHaveBeenCalledWith(completed, { source: 'gate', gate: 'collaborators' });
    expect(textOf(tree)).toContain('You are on ');

    // Tests run in the node environment, so stub the window the component reloads.
    const reload = jest.fn();
    global.window = { location: { reload } };
    renderer.act(() => tree.root.findByProps({ id: 'modal-close' }).props.onClick());
    delete global.window;

    expect(reload).toHaveBeenCalled();
    expect(loggedEvents('baas_checkout_closed')).toEqual([]);
  });

  it('offers the plan that actually unlocks each compliance badge', async () => {
    await mount(<UpgradeCheckoutModal gate="compliance_soc2" onClose={() => {}} />);
    expect(paddle.Checkout.open.mock.calls[0][0].items[0].priceId).toBe('pri_payg_m');

    paddle.Checkout.open.mockClear();
    await mount(<UpgradeCheckoutModal gate="compliance_hipaa" onClose={() => {}} />);
    expect(paddle.Checkout.open.mock.calls[0][0].items[0].priceId).toBe('pri_ded_m');
  });

  it('only offers a direct checkout for paywalls it knows', () => {
    expect(hasDirectCheckout('mongodb_8')).toBe(true);
    expect(hasDirectCheckout('jobs')).toBe(false);
  });
});

describe('UpgradeGateButton', () => {
  beforeEach(() => {
    amplitudeLogEvent.mockClear();
    initPaddle.mockReset();
    initPaddle.mockImplementation(() => Promise.resolve(fakePaddle()));
  });

  it('logs the paywall view, then the click, and opens the checkout in place', async () => {
    const tree = await mount(
      <UpgradeGateButton gate="mongodb_8" renderTrigger={open => <a id="trigger" href="#" onClick={open}>Upgrade to 8.0</a>} />
    );
    expect(loggedEvents('baas_upgrade_gate_viewed')).toEqual([{ gate: 'mongodb_8', app_id: 'app-1' }]);
    expect(initPaddle).not.toHaveBeenCalled();

    const preventDefault = jest.fn();
    await renderer.act(async () => {
      tree.root.findByProps({ id: 'trigger' }).props.onClick({ preventDefault });
    });

    expect(preventDefault).toHaveBeenCalled();
    expect(loggedEvents('baas_upgrade_gate_clicked')).toEqual([{ gate: 'mongodb_8', app_id: 'app-1' }]);
    expect(initPaddle).toHaveBeenCalledTimes(1);
    expect(textOf(tree)).toContain('Upgrade your database to MongoDB 8.0');
  });
});
