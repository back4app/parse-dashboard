import React, { useState, useEffect } from 'react';
import styles from 'dashboard/Data/AppOverview/AppOverview.scss';
import Icon from 'components/Icon/Icon.react';
import AIAgentIcon from './AIAgentIcon.react';
import OnboardingIcons from './OnboardingIcons.react';
import { Link } from 'react-router-dom';
import back4app2 from 'lib/back4app2';

const queryText = (type, appName, appId) => {
  switch (type) {
    case 'database':
      return `Create a database schema suggestion to demonstrate back4app capabilities and populate it with sample data. The App Name is: ${appName} and appID:${appId}`;
    case 'cloud-code':
      return `Create and deploy some cloud code function suggestions to demonstrate back4app/parse cloud code capabilities. The App Name is: ${appName} and appID:${appId}`;
    default:
      return '';
  }
}

const OnboardingBoxes = ({ appName, slug, appId, openConnectModal }) => {
  const [showOnboardingBoxes, setShowOnboardingBoxes] = useState(true);
  const [featuresBox, setFeaturesBox] = useState(true);
  const [hideOnboarding, setHideOnboarding] = useState(false);
  const [hideFeatures, setHideFeatures] = useState(false);
  const [agentLoading, setAgentLoading] = useState('');
  const [agentError, setAgentError] = useState({ type: '', message: '' });

  useEffect(() => {
    const hideOnboardingValue = localStorage.getItem(`onboarding-app-${slug}`);
    const hideFeaturesValue = localStorage.getItem(`features-app-${slug}`);
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
  }, [slug]);

  const handleHideOnboarding = () => {
    localStorage.setItem(`onboarding-app-${slug}`, 'hide');
    setHideOnboarding(true);
  };

  const handleHideFeatures = () => {
    localStorage.setItem(`features-app-${slug}`, 'hide');
    setHideFeatures(true);
  };

  const handleGenerateWithAI = async (type) => {
    try {
      setAgentError({ type: '', message: '' });
      setAgentLoading(type);
      const response = await back4app2.redirectToAgent(queryText(type, appName, appId));
      if (response.error) {
        throw new Error(response.error);
      }
      window.location.href = `${b4aSettings.CONTAINERS_DASHBOARD_PATH}/agents/${response.id}`;
    } catch (err) {
      console.error(err);
      setAgentError({ type, message: err.message || 'Failed to generate. Please try again.' });
      setAgentLoading('');
    }
  };

  const renderButton = (type, text) => {
    const isLoading = agentLoading === type;
    const hasError = agentError.type === type;

    return (
      <button
        className={`${styles.secondaryButton} ${hasError ? styles.errorButton : ''}`}
        onClick={() => handleGenerateWithAI(type)}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Icon name="status-spinner" width={16} height={16} fill="#C1E2FF" className={styles.spinnerStatus} />
            Generating...
          </>
        ) : hasError ? (
          <>
            <Icon name="b4a-error-icon" width={16} height={16} fill="#FF4444" />
            Try Again
          </>
        ) : (
          <>
            <AIAgentIcon />
            {text}
          </>
        )}
      </button>
    );
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
                      <Link to={`/apps/${slug}/browser`}>
                        <button className={styles.primaryButton}>Start from scratch</button>
                      </Link>
                      {renderButton('database', 'Generate with AI')}
                      {agentError.type === 'database' && (
                        <div className={styles.errorMessage}>{agentError.message}</div>
                      )}
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
                      <Link to={`/apps/${slug}/cloud_code`}>
                        <button className={styles.primaryButton}>Write & Deploy Yourself</button>
                      </Link>
                      {renderButton('cloud-code', 'Deploy with AI')}
                      {agentError.type === 'cloud-code' && (
                        <div className={styles.errorMessage}>{agentError.message}</div>
                      )}
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
                <Link to={`/apps/${slug}/admin`} className={styles.featureCard}>
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
                <Link to={`/apps/${slug}/web-deployment`} className={styles.featureCard}>
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
                <Link to={`/apps/${slug}/push`} className={styles.featureCard}>
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
