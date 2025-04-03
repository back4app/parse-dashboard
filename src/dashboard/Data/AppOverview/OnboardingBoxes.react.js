import React, { useState, useEffect } from 'react';
import styles from 'dashboard/Data/AppOverview/AppOverview.scss';
import Icon from 'components/Icon/Icon.react';
import AIAgentIcon from './AIAgentIcon.react';
import OnboardingIcons from './OnboardingIcons.react';
import { Link } from 'react-router-dom';

const OnboardingBoxes = ({ appId, openConnectModal }) => {
  const [showOnboardingBoxes, setShowOnboardingBoxes] = useState(true);
  const [featuresBox, setFeaturesBox] = useState(true);
  const [hideOnboarding, setHideOnboarding] = useState(false);
  const [hideFeatures, setHideFeatures] = useState(false);

  useEffect(() => {
    const hideOnboardingValue = localStorage.getItem(`onboarding-app-${appId}`);
    const hideFeaturesValue = localStorage.getItem(`features-app-${appId}`);
    if (hideOnboardingValue === 'hide') {
      setHideOnboarding(true);
    } else {
      setHideOnboarding(false);
    }
    if (hideFeaturesValue === 'hide') {
      setHideFeatures(true);
    } else {
      setHideFeatures(false);
    }
  }, [appId]);

  const handleHideOnboarding = () => {
    localStorage.setItem(`onboarding-app-${appId}`, 'hide');
    setHideOnboarding(true);
  };

  const handleHideFeatures = () => {
    localStorage.setItem(`features-app-${appId}`, 'hide');
    setHideFeatures(true);
  };

  return (
    <>
      {!hideOnboarding && (
        <div className={styles.onboardingContainer}>
          <div className={styles.onboardingHeader}>
            <div className={styles.headerTitle}>What is next?</div>
            <div className={styles.collapseButton} onClick={() => setShowOnboardingBoxes(!showOnboardingBoxes)}>
              <div className={`${styles.arrowIcon} ${showOnboardingBoxes ? styles.rotated : ''}`}>
                <Icon name="b4a-chevron-down" width={20} height={20} fill="#f9f9f9" />
              </div>
            </div>
          </div>
          {showOnboardingBoxes && (
            <div className={styles.onboardingBoxes}>
              <div className={styles.onboardingBox}>
                <OnboardingIcons name="database" />

                <div style={{ flex: 1 }}>
                  <div className={styles.onboardingBoxHeader}>
                    <div className={styles.onboardingNumber}>1.</div>
                    <div className={styles.onboardingTitle}>Let's create your database schema.</div>
                  </div>
                  <div className={styles.onboardingContent}>
                    <div className={styles.onboardingDescription}>
                      Define your classes (tables), fields, and relationships manually, or let our AI Agent generate a smart suggestion for you. Whether you prefer full control or a head start, we've got you covered!
                    </div>
                    <div className={styles.onboardingActions}>
                      <Link to={`/apps/${appId}/browser`}>
                        <button className={styles.primaryButton}>Start from scratch</button>
                      </Link>
                      <button className={styles.secondaryButton}>
                        <AIAgentIcon />
                      Generate with AI
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.onboardingBox}>
                <OnboardingIcons name="cloud-code" />
                <div style={{ flex: 1 }}>
                  <div className={styles.onboardingBoxHeader}>
                    <div className={styles.onboardingNumber}>2.</div>
                    <div className={styles.onboardingTitle}>Deploy Cloud Code Functions</div>
                  </div>
                  <div className={styles.onboardingContent}>
                    <div className={styles.onboardingDescription}>
                          Write and deploy your Cloud Code manually, or let our AI Agent generate and deploy it for you. Choose the approach that fits your workflow—full control or AI-powered efficiency!
                    </div>
                    <div className={styles.onboardingActions}>
                      <Link to={`/apps/${appId}/cloud_code`}>
                        <button className={styles.primaryButton}>Write & Deploy Yourself</button>
                      </Link>
                      <button className={styles.secondaryButton}>
                        <AIAgentIcon />
                      Deploy with AI
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.onboardingBox}>
                <OnboardingIcons name="connect-app" />
                <div style={{ flex: 1 }}>
                  <div className={styles.onboardingBoxHeader}>
                    <div className={styles.onboardingNumber}>3.</div>
                    <div className={styles.onboardingTitle}>Connect Your Front-End</div>
                  </div>
                  <div className={styles.onboardingContent}>
                    <div className={styles.onboardingDescription}>
                          Seamlessly integrate your app with our backend using your preferred technology. Get started quickly and power your app with robust backend connectivity!
                    </div>
                    <div className={styles.onboardingActions}>
                      <button className={styles.appContentBtn} onClick={openConnectModal}>Connect App</button>
                    </div>
                  </div>
                </div>
              </div>
              <div className={styles.dontShowAgain} onClick={handleHideOnboarding}>I don't want to see this<Icon name="b4a-chevron-down" width={20} height={20} fill="#C1E2FF" /></div>
            </div>
          )}
        </div>
      )}
      {!hideFeatures && (
        <div className={styles.onboardingContainer}>
          <div className={styles.onboardingHeader}>
            <div className={styles.headerTitle}>Features to explore</div>
            <div className={styles.collapseButton} onClick={() => setFeaturesBox(!featuresBox)}>
              <div className={`${styles.arrowIcon} ${featuresBox ? styles.rotated : ''}`}>
                <Icon name="b4a-chevron-down" width={20} height={20} fill="#f9f9f9" />
              </div>
            </div>
          </div>
          <div className={styles.subTitle}>
            Take your app to the next level with powerful features designed to streamline deployment and management.
          </div>
          {featuresBox && (
            <>
              <div className={styles.featureBoxContainer}>
                <Link to={`/apps/${appId}/admin`} className={styles.featureCard}>
                  <div className={styles.featureBox}>
                    <div className={styles.featureIcon}>
                      <Icon name="b4a-admin-app-icon" width={24} height={24} fill="#C1E2FF" />
                    </div>
                    <div className={styles.featureContent}>
                      <div className={styles.featureTitle}>Admin App</div>
                      <div className={styles.featureDescription}>Manage and monitor your app with ease.</div>
                    </div>
                  </div>
                </Link>
                <Link to={`/apps/${appId}/web-deployment`} className={styles.featureCard}>
                  <div className={styles.featureBox}>
                    <div className={styles.featureIcon}>
                      <Icon name="b4a-web-dep-icon" width={24} height={24} fill="#C1E2FF" />
                    </div>
                    <div className={styles.featureContent}>
                      <div className={styles.featureTitle}>Web Deployment</div>
                      <div className={styles.featureDescription}>Launch your app seamlessly on the web.</div>
                    </div>
                  </div>
                </Link>
                <Link to={`/apps/${appId}/push`} className={styles.featureCard}>
                  <div className={styles.featureBox}>
                    <div className={styles.featureIcon}>
                      <Icon name="b4a-notification-icon" width={24} height={24} fill="#C1E2FF" />
                    </div>
                    <div className={styles.featureContent}>
                      <div className={styles.featureTitle}>Push Notifications</div>
                      <div className={styles.featureDescription}>Engage users with real-time updates.</div>
                    </div>
                  </div>
                </Link>
              </div>
              <div className={styles.dontShowAgain} onClick={handleHideFeatures}>I don't want to see this <Icon name="b4a-chevron-down" width={20} height={20} fill="#C1E2FF" /></div>
            </>
          )}
        </div>
      )}
    </>
  )
}

export default OnboardingBoxes;
