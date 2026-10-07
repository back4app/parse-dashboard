// The test preprocessor does not hoist jest.mock, so mocked modules are required after it.
jest.mock('../amplitudeEvents', () => ({ amplitudeLogEvent: jest.fn() }));
jest.mock('../AccountManager', () => ({ currentUser: () => ({ email: 'owner@example.com' }) }));
jest.mock('../paddleCheckout', () => {
  const actual = jest.requireActual('../paddleCheckout');
  return { ...actual, initPaddle: jest.fn(), recordSubscription: jest.fn(() => Promise.resolve()) };
});
jest.mock('../../components/Icon/Icon.react', () => ({ __esModule: true, default: () => null }));
jest.mock('../../components/Popover/Popover.react', () => {
  const React = require('react');
  return { __esModule: true, default: ({ children }) => <div>{children}</div> };
});
jest.mock('context/currentApp', () => ({ CurrentApp: require('react').createContext(null) }), { virtual: true });
jest.mock('dashboard/Data/AppOverview/usageAlert', () => jest.requireActual('../../dashboard/Data/AppOverview/usageAlert'), { virtual: true });
jest.mock(
  'dashboard/AppPlan/prices',
  () => ({
    prices: [
      {
        name: 'MVP', pricePerMonth: '25', pricePerYear: '15', savePercent: '40%',
        monthlyPlanId: 'mvp-m', annuallyPlanId: 'mvp-y', monthlyProductId: 'pri_mvp_m', annuallyProductId: 'pri_mvp_y',
        details: [{ text: 'Web hosting on a b4a.app subdomain' }, { number: '500 K', text: 'Requests' }],
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
const { UpgradeCheckoutModal, UpgradeGateButton } = require('../../components/UpgradeCheckout/UpgradeCheckout.react');
const BackupUpsell = require('../../components/UpgradeCheckout/BackupUpsell.react').default;

const { clearPlanDataCache } = require('../planDataCache');

const appOnPlan = planName => ({
  applicationId: 'app-1',
  slug: 'my-app',
  custom: { isOwner: true },
  getAppPlanData: () => Promise.resolve({ planName }),
});
let app = appOnPlan('Free Plan');

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

  it('opens the MVP yearly checkout right away for a custom domain paywall', async () => {
    const tree = await mount(<UpgradeCheckoutModal gate="web_hosting" onClose={() => {}} />);

    expect(paddle.Checkout.open).toHaveBeenCalledTimes(1);
    const options = paddle.Checkout.open.mock.calls[0][0];
    expect(options.items).toEqual([{ priceId: 'pri_mvp_y', quantity: 1 }]);
    expect(options.customData).toEqual({ appId: 'app-1', planId: 'mvp-y' });
    expect(options.customer).toEqual({ email: 'owner@example.com' });
    expect(options.settings.frameTarget).toBe('upgrade-checkout-frame');

    expect(loggedEvents('baas_checkout_opened')).toEqual([
      { app_id: 'app-1', plan: 'MVP', cycle: 'yearly', source: 'gate', gate: 'web_hosting' },
    ]);
    const text = textOf(tree);
    expect(text).toContain('Host your pages on a b4a.app subdomain');
    expect(text).toContain('Upgrade to ');
    expect(text).toContain('Web hosting on a b4a.app subdomain');
  });

  it('starts on yearly and switches the open checkout to monthly without reopening it', async () => {
    const tree = await mount(<UpgradeCheckoutModal gate="web_hosting" onClose={() => {}} />);
    // $15/month billed yearly is $180 today.
    expect(textOf(tree)).toContain('180');
    const radios = tree.root.findAll(node => node.type === 'input' && node.props.type === 'radio');

    // Yearly is listed first, monthly second.
    renderer.act(() => radios[1].props.onChange());

    expect(paddle.Checkout.open).toHaveBeenCalledTimes(1);
    expect(paddle.Checkout.updateCheckout).toHaveBeenCalledWith({
      items: [{ priceId: 'pri_mvp_m', quantity: 1 }],
      customData: { appId: 'app-1', planId: 'mvp-m' },
    });
    expect(loggedEvents('baas_checkout_cycle_changed')).toEqual([
      { app_id: 'app-1', plan: 'MVP', cycle: 'monthly', source: 'gate', gate: 'web_hosting' },
    ]);
    expect(textOf(tree)).toContain('Billed monthly');
  });

  it('logs the abandonment and closes when the user leaves without paying', async () => {
    const onClose = jest.fn();
    const tree = await mount(<UpgradeCheckoutModal gate="email_templates" onClose={onClose} />);

    renderer.act(() => tree.root.findByProps({ 'aria-label': 'Close' }).props.onClick());

    expect(loggedEvents('baas_checkout_closed')).toEqual([
      { app_id: 'app-1', plan: 'MVP', cycle: 'yearly', source: 'gate', gate: 'email_templates' },
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
    renderer.act(() => tree.root.findByProps({ 'aria-label': 'Close' }).props.onClick());
    delete global.window;

    expect(reload).toHaveBeenCalled();
    expect(loggedEvents('baas_checkout_closed')).toEqual([]);
  });

  it('follows the light or dark preference, including the Paddle frame', async () => {
    await mount(<UpgradeCheckoutModal gate="web_hosting" onClose={() => {}} />);
    expect(paddle.Checkout.open.mock.calls[0][0].settings.theme).toBe('light');

    paddle.Checkout.open.mockClear();
    global.window = { matchMedia: query => ({ matches: query === '(prefers-color-scheme: dark)' }) };
    const tree = await mount(<UpgradeCheckoutModal gate="web_hosting" onClose={() => {}} />);
    delete global.window;

    expect(paddle.Checkout.open.mock.calls[0][0].settings.theme).toBe('dark');
    expect(tree.root.findAll(node => typeof node.props.className === 'string' && node.props.className.includes('dark')).length).toBeGreaterThan(0);
  });

  it('sells web hosting on MVP from the Overview', async () => {
    const tree = await mount(<UpgradeCheckoutModal gate="overview_web_hosting" onClose={() => {}} />);
    expect(paddle.Checkout.open.mock.calls[0][0].items[0].priceId).toBe('pri_mvp_y');
    expect(textOf(tree)).toContain('Host your pages on a b4a.app subdomain');
  });

  it('sells HTTPS on Pay As You Go and tells the buyer support turns it on', async () => {
    const tree = await mount(<UpgradeCheckoutModal gate="https" onClose={() => {}} />);
    expect(paddle.Checkout.open.mock.calls[0][0].items[0].priceId).toBe('pri_payg_y');
    expect(textOf(tree)).not.toContain('open a support ticket');

    await renderer.act(async () => {
      await paddleCallback({ name: 'checkout.completed', data: {} });
    });
    const text = textOf(tree);
    expect(text).toContain('open a support ticket');
    expect(tree.root.findByProps({ href: 'https://help.back4app.com/hc/en-us/requests/new' })).toBeTruthy();
  });

  it('sells MVP as a whole from the generic Overview upgrade buttons', async () => {
    for (const gate of ['overview_plan_card', 'overview_plan_badge']) {
      paddle.Checkout.open.mockClear();
      const tree = await mount(<UpgradeCheckoutModal gate={gate} onClose={() => {}} />);
      expect(paddle.Checkout.open.mock.calls[0][0].items[0].priceId).toBe('pri_mvp_y');
      expect(textOf(tree)).toContain('Take this app to production');
    }
  });

  it('sells MVP from the job limit on Free', async () => {
    const tree = await mount(<UpgradeCheckoutModal gate="jobs" onClose={() => {}} />);
    expect(paddle.Checkout.open.mock.calls[0][0].items[0].priceId).toBe('pri_mvp_y');
    expect(textOf(tree)).toContain('Schedule more background jobs');
  });

  it('sells Dedicated on yearly from the database profiler', async () => {
    const tree = await mount(<UpgradeCheckoutModal gate="db_profiler" onClose={() => {}} />);
    expect(paddle.Checkout.open.mock.calls[0][0].items[0].priceId).toBe('pri_ded_y');
    expect(textOf(tree)).toContain('See which queries slow your app down');
  });

  it('after paying for a region, points to the migration form for this app', async () => {
    const tree = await mount(<UpgradeCheckoutModal gate="region_change" onClose={() => {}} />);
    expect(textOf(tree)).toContain('Run your app closer to your users');
    await renderer.act(async () => {
      await paddleCallback({ name: 'checkout.completed', data: {} });
    });
    expect(tree.root.findByProps({ href: 'https://back4app.typeform.com/to/kMjTovFj?appId=app-1' })).toBeTruthy();
    expect(textOf(tree)).toContain('Request the migration');
  });

  it('sells custom domains on Pay As You Go, where the backend unlocks them', async () => {
    const tree = await mount(<UpgradeCheckoutModal gate="custom_domain" onClose={() => {}} />);
    expect(paddle.Checkout.open.mock.calls[0][0].items[0].priceId).toBe('pri_payg_y');
    expect(textOf(tree)).toContain('Use your own domain');
    expect(textOf(tree)).toContain('Pay As You Go includes custom domains with HTTPS.');
  });

  it('sells the plan the usage banner names, MVP when it names none', async () => {
    const free = await mount(<UpgradeCheckoutModal gate="usage_limit" onClose={() => {}} />);
    expect(paddle.Checkout.open.mock.calls[0][0].items[0].priceId).toBe('pri_mvp_y');
    expect(textOf(free)).toContain('Keep your app running');

    paddle.Checkout.open.mockClear();
    const mvp = await mount(<UpgradeCheckoutModal gate="usage_limit" plan="Pay As You Go" onClose={() => {}} />);
    expect(paddle.Checkout.open.mock.calls[0][0].items[0].priceId).toBe('pri_payg_y');
    expect(textOf(mvp)).toContain('Pay As You Go raises your limits');

    paddle.Checkout.open.mockClear();
    const payg = await mount(<UpgradeCheckoutModal gate="usage_limit" plan="Dedicated" onClose={() => {}} />);
    expect(paddle.Checkout.open.mock.calls[0][0].items[0].priceId).toBe('pri_ded_y');
    expect(textOf(payg)).toContain('Dedicated has unlimited requests');
  });

  it('offers the plan that actually unlocks each compliance badge', async () => {
    await mount(<UpgradeCheckoutModal gate="compliance_soc2" onClose={() => {}} />);
    expect(paddle.Checkout.open.mock.calls[0][0].items[0].priceId).toBe('pri_payg_y');

    paddle.Checkout.open.mockClear();
    await mount(<UpgradeCheckoutModal gate="compliance_hipaa" onClose={() => {}} />);
    expect(paddle.Checkout.open.mock.calls[0][0].items[0].priceId).toBe('pri_ded_y');
  });
});

describe('UpgradeGateButton', () => {
  beforeEach(() => {
    clearPlanDataCache();
    app = appOnPlan('Free Plan');
    amplitudeLogEvent.mockClear();
    initPaddle.mockReset();
    initPaddle.mockImplementation(() => Promise.resolve(fakePaddle()));
  });

  it('logs the paywall view, then the click, and opens the checkout in place', async () => {
    const tree = await mount(
      <UpgradeGateButton gate="mongodb_8" renderTrigger={open => <a id="trigger" href="#" onClick={open}>Upgrade database</a>} />
    );
    expect(loggedEvents('baas_upgrade_gate_viewed')).toEqual([{ gate: 'mongodb_8', app_id: 'app-1' }]);
    expect(initPaddle).not.toHaveBeenCalled();

    const preventDefault = jest.fn();
    await renderer.act(async () => {
      await tree.root.findByProps({ id: 'trigger' }).props.onClick({ preventDefault });
    });

    expect(preventDefault).toHaveBeenCalled();
    expect(loggedEvents('baas_upgrade_gate_clicked')).toEqual([{ gate: 'mongodb_8', app_id: 'app-1' }]);
    expect(initPaddle).toHaveBeenCalledTimes(1);
    expect(textOf(tree)).toContain('Get the latest MongoDB');
    expect(textOf(tree)).toContain('Faster queries and the newest MongoDB features.');
  });

  // Clicks the trigger on an app of the given plan; returns where it went.
  const clickOn = async (planName, props) => {
    app = appOnPlan(planName);
    const assign = jest.fn();
    global.window = { location: { assign } };
    const tree = await mount(
      <UpgradeGateButton {...props} renderTrigger={open => <a id="trigger" href="#" onClick={open}>Upgrade Plan</a>} />
    );
    await renderer.act(async () => {
      await tree.root.findByProps({ id: 'trigger' }).props.onClick({ preventDefault: () => {} });
    });
    delete global.window;
    return { assign, text: textOf(tree) };
  };

  it('sends apps at or above the plan it sells to Plan Usage instead of a lower plan', async () => {
    for (const planName of ['MVP Plan', 'Pay as you go Plan', 'Gold Plan']) {
      clearPlanDataCache();
      initPaddle.mockClear();
      const { assign } = await clickOn(planName, { gate: 'collaborators' });
      expect(assign).toHaveBeenCalledWith('/apps/my-app/plan-usage?gate=collaborators');
      expect(initPaddle).not.toHaveBeenCalled();
    }
    expect(loggedEvents('baas_upgrade_gate_clicked')).toContainEqual({ gate: 'collaborators', app_id: 'app-1' });
  });

  it('opens the checkout on paid plans below the plan it sells', async () => {
    const starter = await clickOn('Starter Plan', { gate: 'collaborators' });
    expect(starter.assign).not.toHaveBeenCalled();
    expect(starter.text).toContain('Bring your team into this app');

    clearPlanDataCache();
    const mvp = await clickOn('MVP Plan', { gate: 'https' });
    expect(mvp.assign).not.toHaveBeenCalled();
    expect(mvp.text).toContain('Serve your custom domain over HTTPS');
  });

  it('opens the checkout of the next plan up from the Overview plan card', async () => {
    const mvp = await clickOn('MVP Plan', { gate: 'overview_plan_card', plan: 'Pay As You Go' });
    expect(mvp.assign).not.toHaveBeenCalled();
    expect(mvp.text).toContain('Give this app room to scale');

    clearPlanDataCache();
    const payg = await clickOn('Pay as you go Plan', { gate: 'overview_plan_card', plan: 'Dedicated' });
    expect(payg.text).toContain('Run this app on dedicated resources');

    // No next plan up: nothing to sell directly.
    clearPlanDataCache();
    const dedicated = await clickOn('Dedicated Plan', { gate: 'overview_plan_card', plan: undefined });
    expect(dedicated.assign).toHaveBeenCalledWith('/apps/my-app/plan-usage?gate=overview_plan_card');
  });

  it('opens the checkout of the next plan up from the usage banner', async () => {
    const mvp = await clickOn('MVP Plan', { gate: 'usage_limit', plan: 'Pay As You Go' });
    expect(mvp.assign).not.toHaveBeenCalled();
    expect(mvp.text).toContain('Pay As You Go raises your limits');

    clearPlanDataCache();
    const payg = await clickOn('Pay as you go Plan', { gate: 'usage_limit', plan: 'Dedicated' });
    expect(payg.assign).not.toHaveBeenCalled();
    expect(payg.text).toContain('Dedicated has unlimited requests');
  });
});

describe('BackupUpsell', () => {
  beforeEach(() => clearPlanDataCache());

  const mountWithPlan = async planName => {
    let tree;
    const appWithPlan = { ...app, getAppPlanData: () => Promise.resolve({ planName }) };
    await renderer.act(async () => {
      tree = renderer.create(
        <CurrentApp.Provider value={appWithPlan}>
          <BackupUpsell gate="backup_delete_class" />
        </CurrentApp.Provider>,
        { createNodeMock: () => ({}) }
      );
    });
    return tree;
  };

  beforeEach(() => {
    amplitudeLogEvent.mockClear();
    initPaddle.mockReset();
    initPaddle.mockImplementation(() => Promise.resolve(fakePaddle()));
  });

  it('warns Free apps that deleted data cannot be recovered and offers backups', async () => {
    const tree = await mountWithPlan('Free Plan');
    expect(textOf(tree)).toContain('No backups on Free');
    expect(textOf(tree)).toContain('Deleted data can\'t be recovered.');
    expect(loggedEvents('baas_upgrade_gate_viewed')).toEqual([{ gate: 'backup_delete_class', app_id: 'app-1' }]);

    await renderer.act(async () => {
      await tree.root.findByType('button').props.onClick({ preventDefault: () => {} });
    });
    expect(textOf(tree)).toContain('Keep daily backups of your data');
  });

  it('stays out of the way on paid plans', async () => {
    const tree = await mountWithPlan('MVP Plan');
    expect(tree.toJSON()).toBe(null);
    expect(loggedEvents('baas_upgrade_gate_viewed')).toEqual([]);
  });
});
