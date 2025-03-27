/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import React from 'react';
import Sidebar from 'components/Sidebar/Sidebar.react';
import styles from 'dashboard/Dashboard.scss';
import Icon from 'components/Icon/Icon.react';
import baseStyles from 'stylesheets/base.scss';
import Button from 'components/Button/Button.react';
import { CurrentApp } from 'context/currentApp';

import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import AccountManager from 'lib/AccountManager';
import { post } from 'lib/AJAX';

// Alert parameters
const MySwal = withReactContent(Swal);
const mobileCompatibilityAlert = {
  title: '<span style="font-size: 2.25rem">Mobile Advice</span>',
  html: '<span style="font-size: 2.25rem">For a better experience, we recommend using Parse Dashboard on large screen devices, such as desktops or tablets</span>',
  type: 'info',
  confirmButtonColor: '#208aec',
  confirmButtonText: '<span style="font-size: 2.25rem">Understood</span>'
};

// Hides the zendesk button as soon as possible
const hideZendesk = () => {
  // eslint-disable-next-line no-undef
  if (typeof zE !== 'undefined' && typeof zE.hide === 'function') {
    // eslint-disable-next-line no-undef
    zE.hide();
  } else{
    setTimeout(hideZendesk, 50);
  }
};
hideZendesk();

// Checks if the current device is mobile
// See: https://stackoverflow.com/questions/11381673/detecting-a-mobile-browser
const isMobile = function() {
  let check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) {check = true;}})(navigator.userAgent || navigator.vendor || window.opera);
  return check;
};

export default class DashboardView extends React.Component {
  static contextType = CurrentApp;
  /* A DashboardView renders two pieces: the sidebar, and the app itself */

  constructor() {
    super();
    this.state = {
      route: '',
    };
  }

  componentDidUpdate() {
    this.onRouteChanged();
  }
  componentDidMount() {
    this.onRouteChanged();
    const user = AccountManager.currentUser();
    // Current window size is lesser than Bootstrap's medium size
    if (user && !user.mobileAlertShown && isMobile()) {
      user.mobileAlertShown = true;
      MySwal.fire(mobileCompatibilityAlert);
      AccountManager.setCurrentUser({ user });
      post('/b4aUser/parseDashboardMobileAlertShown');
    }
  }

  onRouteChanged() {
    const path = this.props.location?.pathname ?? window.location.pathname;
    const route = path.split('apps')[1].split('/')[2];
    if (route !== this.state.route) {
      this.setState({ route });
    }
  }

  render() {
    let sidebarChildren = null;
    if (typeof this.renderSidebar === 'function') {
      sidebarChildren = this.renderSidebar();
    }
    const appSlug = this.context ? this.context.slug : '';

    if (!this.context.hasCheckedForMigraton) {
      this.context.getMigrations().promise.then(
        () => this.forceUpdate(),
        () => {}
      );
    }

    const features = this.context.serverInfo.features;

    // const { showAdminPage } = this.context.custom;

    const databaseSubsections = [];
    if (features.schemas &&
      features.schemas.addField &&
      features.schemas.removeField &&
      features.schemas.addClass &&
      features.schemas.removeClass) {
      databaseSubsections.push({
        name: 'Browser',
        link: '/browser',
      });
    }

    // coreSubsections.push({
    //   name: 'Connections',
    //   link: '/connections',
    //   badge: {
    //     label: 'NEW',
    //     color: 'green'
    //   }
    // })

    databaseSubsections.push({
      name: 'Index Manager',
      link: '/index'
    })

    // databaseSubsections.push({
    //   name: 'Blockchain',
    //   link: '/blockchain',
    //   badge: {
    //     label: 'NEW',
    //     color: 'green'
    //   }
    // })

    const cloudCodeSubSections = [];
    // Show cloud code to all parse versions
    // if (features.cloudCode && features.cloudCode.viewCode) {
    cloudCodeSubSections.push({
      name: 'Functions & Web Hosting',
      link: '/cloud_code'
    });
    // }

    if (features.cloudCode && features.cloudCode.jobs) {
      cloudCodeSubSections.push({
        name: 'Jobs',
        link: '/jobs',
      });
    }

    if (features.logs && Object.keys(features.logs).some(key => features.logs[key])) {
      cloudCodeSubSections.push({
        name: 'Logs',
        link: '/logs',
      });
    }

    const apiSubSections = [];

    apiSubSections.push({
      name: 'Connect',
      link: '/connect'
    });

    apiSubSections.push({
      name: 'Console',
      link: '/api_console',
    });

    apiSubSections.push({
      name: 'API Reference',
      // eslint-disable-next-line no-undef
      link: `${b4aSettings.DASHBOARD_PATH}/apidocs/${this.context.applicationId}`
    });

    const moreSubSection = [];
    if (features.globalConfig &&
      features.globalConfig.create &&
      features.globalConfig.read &&
      features.globalConfig.update &&
      features.globalConfig.delete) {
      moreSubSection.push({
        name: 'Config',
        link: '/config',
      });
    }

    //webhooks requires removal of heroku link code, then it should work.
    if (features.hooks && features.hooks.create && features.hooks.read && features.hooks.update && features.hooks.delete) {
      moreSubSection.push({
        name: 'Webhooks',
        link: '/webhooks'
      });
    }

    if (features.push) {
      moreSubSection.push({
        name: 'Push',
        link: '/push'
      });
    }

    moreSubSection.push({
      name: 'Analytics',
      link: '/analytics'
    })

    moreSubSection.push({
      name: 'Database HUB',
      link: '/connections'
    })

    moreSubSection.push({
      name: 'Admin App',
      link: '/admin'
    })

    moreSubSection.push({
      name: 'App Templates',
      link: '/app-templates'
    })
    // moreSubSection.push({
    //   name: 'Dashboard Settings',
    //   link: '/settings/dashboard'
    // });

    const pushSubsections = [];

    const settingsSections = [];

    if (this.context.enableSecurityChecks) {
      settingsSections.push({
        name: 'Security',
        link: '/settings/security',
      })
    }

    // Settings - nothing remotely like this in parse-server yet. Maybe it will arrive soon.

    //if (features.generalSettings) {
    settingsSections.push({
      name: 'General',
      link: '/settings/general'
    });
    //}
    // if (features.keysSettings) {
    settingsSections.push({
      name: 'Security & Keys',
      link: '/settings/keys'
    });
    // }
    settingsSections.push({
      name: 'Server Settings',
      link: '/server-settings',
    });


    const appSidebarSections = [];

    if (databaseSubsections.length > 0) {
      appSidebarSections.push({
        name: 'Database',
        icon: 'database',
        link: '/browser',
        subsections: databaseSubsections,
      });
    }

    appSidebarSections.push({
      name: 'Cloud Code',
      icon: 'cloud-code',
      link: '/cloud_code',
      subsections: cloudCodeSubSections,
    })

    appSidebarSections.push({
      name: 'API',
      icon: 'api',
      link: '/connect',
      subsections: apiSubSections
    })

    if (settingsSections.length > 0) {
      appSidebarSections.push({
        name: 'App Settings',
        icon: 'gear-solid',
        link: '/settings',
        subsections: settingsSections,
      });
    }

    appSidebarSections.push({
      name: 'More',
      icon: 'more',
      link: '/config',
      subsections: moreSubSection
    })

    const sidebar = (
      <Sidebar
        showTour={this.state && this.state.showTour}
        sections={appSidebarSections}
        appSelector={true}
        section={this.section}
        subsection={this.subsection}
        prefix={'/apps/' + appSlug}
        action={this.action}
        primaryBackgroundColor={this.context.primaryBackgroundColor}
        secondaryBackgroundColor={this.context.secondaryBackgroundColor}
        footerMenuButtons={this.getFooterMenuButtons && this.getFooterMenuButtons()}
      >
        {sidebarChildren}
      </Sidebar>
    );

    let content = <div className={styles.content}>{this.renderContent()}</div>;
    // const canRoute = [...databaseSubsections, ...pushSubsections, ...settingsSections, ...appSidebarSections, ...moreSubSection]
    //   .map(({ link }) => link.split('/')[1])
    //   .includes(this.state.route);

    // if (!canRoute) {
    //   content = (
    //     <div className={styles.empty}>
    //       <div className={baseStyles.center}>
    //         <div className={styles.cloud}>
    //           <Icon width={110} height={110} name="cloud-surprise" fill="#1e3b4d" />
    //         </div>
    //         <div className={styles.loadingError}>Feature unavailable</div>
    //       </div>
    //     </div>
    //   );
    // }

    if (this.context.serverInfo.error) {
      content = (
        <div className={styles.empty}>
          <div className={baseStyles.center}>
            <div className={styles.cloud}>
              <Icon width={110} height={110} name="cloud-surprise" fill="#1e3b4d" />
            </div>
            <div className={styles.loadingError}>
              {this.context.serverInfo.error.replace(/-/g, '\u2011')}
            </div>
            <Button color="white" value="Reload" width="120px" onClick={() => location.reload()} />
          </div>
        </div>
      );
    }

    return (
      <div className={styles.dashboard}>
        {content}
        {sidebar}
      </div>
    );
  }
}
