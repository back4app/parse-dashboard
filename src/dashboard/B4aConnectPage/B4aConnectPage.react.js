import React from 'react';
import DashboardView from 'dashboard/DashboardView.react';
import Toolbar from 'components/Toolbar/Toolbar.react';
import Fieldset from 'components/Fieldset/Fieldset.react';
import styles from 'dashboard/B4aConnectPage/B4aConnectPage.scss';
import B4aLoaderContainer from 'components/B4aLoaderContainer/B4aLoaderContainer.react';
import reactImg from './react.png';
import flutterImg from './flutter.png';
import androidImg from './android-robot.png'
import appleImg from './apple-logo.png';
import jsImg from './javascript-icon.png';
import graphQLImg from './graphQl.png';
import ionicImg from './ionic.png'
import xamarinImg from './xamarin-logo.png'

class B4aConnectPage extends DashboardView {
  constructor() {
    super();
    this.section = 'API';
    this.subsection = 'Connect';
    this.state = {}
    this.onClickTechnology = this.onClickTechnology.bind(this);
  }

  onClickTechnology(tech) {
    if (back4AppNavigation && back4AppNavigation.onClickTechnology)
    {back4AppNavigation.onClickTechnology(tech);}
  }

  renderContent() {
    return (
      <B4aLoaderContainer
        className={styles.loading}
        loading={false}
        hideAnimation={false}
        solid={true}
      >
        <div className={styles['connect-page']}>
          <Toolbar section="API" subsection="Connect" />
          <div className={styles.content}>
            <div className={styles.header}>
              <div className={styles.title}>Add Back4App to your app</div>
              <div className={styles.subtitle}>Save your App’s data on the Blockchain Network of your choice.NOTE: This feature is on the alpha version.</div>
            </div>
            <div className={styles['frameworkList-container']}>
              <a
                className={styles['framework-box']}
                href="https://www.back4app.com/docs/react-native/parse-sdk/react-native-sdk"
                target="_blank"
                onClick={this.onClickTechnology.bind(this, 'React Native')}
              >
                <img src={reactImg} />
                <p>React Native</p>
              </a>
              <a
                className={styles['framework-box']}
                href="https://www.back4app.com/docs/flutter/parse-sdk/parse-flutter-sdk"
                target="_blank"
                onClick={this.onClickTechnology.bind(this, 'Flutter')}
              >
                <img src={flutterImg} />
                <p>Flutter</p>
              </a>
              <a
                className={styles['framework-box']}
                href="https://www.back4app.com/docs/android/parse-android-sdk"
                target="_blank"
                onClick={this.onClickTechnology.bind(this, 'Android')}
              >
                <img src={androidImg} />
                <p>Android</p>
              </a>
              <a
                className={styles['framework-box']}
                href="https://www.back4app.com/docs/ios/parse-swift-sdk"
                target="_blank"
                onClick={this.onClickTechnology.bind(this, 'IOS')}
              >
                <img src={appleImg} />
                <p>IOS</p>
              </a>
            </div>
            <div className={styles['frameworkList-container']}>
              <a
                className={styles['framework-box']}
                href="https://www.back4app.com/docs/javascript/parse-javascript-sdk"
                target="_blank"
                onClick={this.onClickTechnology.bind(this, 'Javascript')}
              >
                <img src={jsImg} />
                <p>Javascript</p>
              </a>
              <a
                className={styles['framework-box']}
                href="https://www.back4app.com/docs/parse-graphql/graphql-getting-started"
                target="_blank"
                onClick={this.onClickTechnology.bind(this, 'GraphQL')}
              >
                <img src={graphQLImg} />
                <p>GraphQL</p>
              </a>
              <a
                className={styles['framework-box']}
                href="https://www.back4app.com/docs/js-framework/ionic/parse-ionic-sdk"
                target="_blank"
                onClick={this.onClickTechnology.bind(this, 'Ionic')}
              >
                <img src={ionicImg} />
                <p>IONIC</p>
              </a>
              <a
                className={styles['framework-box']}
                href="https://www.back4app.com/docs/xamarin/xamarin-templates"
                target="_blank"
                onClick={this.onClickTechnology.bind(this, 'Xamarin')}
              >
                <img src={xamarinImg} />
                <p>Xamarin</p>
              </a>
            </div>
          </div>
        </div>
      </B4aLoaderContainer>
    );
  }
}

export default B4aConnectPage;
