import React from 'react';
import introJs from 'intro.js'
import introStyle from 'stylesheets/introjs.css';

const getComponentReadyPromise = async conditionFn => {
  for (let i = 1; i <= 20; i++) {
    if (conditionFn()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, i * 500));
  }
  throw new Error('Component not ready');
};

export default class Tour extends React.Component {
  constructor () {
    super();
  }

  componentDidMount() {
    console.log('component DID MOUNT>>>>>>>>>');
    const sidebarPromise = getComponentReadyPromise(() => document.querySelector('#sidebar'));
    const toolbarPromise = getComponentReadyPromise(() => document.querySelector('#toolbar'));
    const dataBrowserPromise = getComponentReadyPromise(() => document.querySelector('#browser'));
    Promise.all([sidebarPromise, toolbarPromise, dataBrowserPromise]).then(() => {
      const intro = introJs();
      intro.setOptions({
        nextLabel: 'Next',
        prevLabel: 'Prev',
        skipLabel: 'Cancel',
        showBullets: false,
        scrollToElement: false,
        showStepNumbers: true,
      });
      this.props.steps.forEach(step => {
        if (typeof step.element === 'function') {
          step.element = step.element();
        }
      });
      intro.addSteps(this.props.steps);

      const sidebar = document.querySelector('#sidebar');
      sidebar.style.position = 'absolute';

      const toolbar = document.querySelector('#toolbar');
      toolbar.style.position = 'absolute';

      const dataBrowser = document.querySelector('#browser');
      dataBrowser.style.position = 'absolute';

      const onExit = this.props.onExit;
      intro.onexit(function () {
        // Fires analytics event when tour finishes
        // eslint-disable-next-line no-undef
        typeof back4AppNavigation === 'object' && back4AppNavigation.onFinishDatabaseBrowserTour && back4AppNavigation.onFinishDatabaseBrowserTour();

        sidebar.style.position = 'fixed';
        toolbar.style.position = 'fixed';
        dataBrowser.style.position = 'fixed';

        typeof onExit === 'function' && onExit.bind(this)();
      });

      intro.onbeforechange(this.props.onBeforeChange);
      intro.onafterchange(this.props.onAfterChange);
      intro.onbeforeexit(this.props.onBeforeExit);

      this.props.onBeforeStart && this.props.onBeforeStart();

      intro.start();

      // Fires analytics event when tour begins
      // eslint-disable-next-line no-undef
      typeof back4AppNavigation === 'object' && back4AppNavigation.onStartDatabaseBrowserTour && back4AppNavigation.onStartDatabaseBrowserTour();
    });
  }

  render() {
    return <div></div>;
  }
}
