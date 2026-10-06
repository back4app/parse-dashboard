// The test preprocessor does not hoist jest.mock, so mocked modules are required after it.
// It also rewrites `lib/` / `components/` imports two levels up, which from
// dashboard/Data/AppOverview lands under src/dashboard; map those paths to the real modules.
jest.mock('../amplitudeEvents', () => ({ amplitudeLogEvent: jest.fn() }));
jest.mock('../../dashboard/lib/amplitudeEvents', () => require('../amplitudeEvents'), { virtual: true });
jest.mock('../../dashboard/lib/upgradeEvents', () => jest.requireActual('../upgradeEvents'), { virtual: true });
jest.mock('../../dashboard/components/B4aModal/B4aModal.react', () => {
  const React = require('react');
  return { __esModule: true, default: ({ children }) => <div id="picker">{children}</div> };
}, { virtual: true });
jest.mock(
  '../../dashboard/components/UpgradeCheckout/UpgradeCheckout.react',
  () => ({ UpgradeCheckoutModal: ({ gate }) => require('react').createElement('div', { id: 'checkout' }, gate) }),
  { virtual: true }
);
jest.mock('context/currentApp', () => ({ CurrentApp: require('react').createContext(null) }), { virtual: true });
jest.mock('dashboard/Data/AppOverview/RegionChange.scss', () => ({}), { virtual: true });

const React = require('react');
const renderer = require('react-test-renderer');
const { CurrentApp } = require('context/currentApp');
const { amplitudeLogEvent } = require('../amplitudeEvents');
const RegionChange = require('../../dashboard/Data/AppOverview/RegionChange.react').default;

const FORM = 'https://back4app.typeform.com/to/kMjTovFj?appId=app-1';

const mount = isFree => {
  let tree;
  renderer.act(() => {
    tree = renderer.create(
      <CurrentApp.Provider value={{ applicationId: 'app-1' }}>
        <RegionChange isFree={isFree} />
      </CurrentApp.Provider>
    );
  });
  return tree;
};

const click = (tree, predicate) =>
  renderer.act(() => tree.root.find(predicate).props.onClick({ preventDefault: () => {} }));

// Region buttons in picker order: Europe, South Korea, India, Australia, Singapore.
const chooseRegion = (tree, index) =>
  renderer.act(() => tree.root.findAll(node => node.type === 'button')[index].props.onClick());

describe('RegionChange', () => {
  beforeEach(() => amplitudeLogEvent.mockClear());

  it('sends paid apps straight to the migration form', () => {
    const link = mount(false).root.findByType('a');
    expect(link.props.href).toBe(FORM);
  });

  it('on Free, a paid region opens the MVP checkout', () => {
    const tree = mount(true);
    click(tree, node => node.type === 'a');
    expect(tree.root.findAll(node => node.props.id === 'picker').length).toBe(1);
    expect(amplitudeLogEvent).toHaveBeenCalledWith('baas_upgrade_gate_viewed', { gate: 'region_change', app_id: 'app-1' });

    chooseRegion(tree, 4);
    expect(amplitudeLogEvent).toHaveBeenCalledWith('baas_upgrade_gate_clicked', { gate: 'region_change', app_id: 'app-1' });
    expect(tree.root.findByProps({ id: 'checkout' }).props.children).toBe('region_change');
  });

  it('on Free, Europe goes to the migration form without a checkout', () => {
    const open = jest.fn();
    global.window = { open };
    const tree = mount(true);
    click(tree, node => node.type === 'a');
    chooseRegion(tree, 0);
    delete global.window;

    expect(open).toHaveBeenCalledWith(FORM, '_blank', 'noopener,noreferrer');
    expect(tree.root.findAll(node => node.props.id === 'checkout').length).toBe(0);
  });
});
