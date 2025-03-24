import React, { useState, useEffect, useRef } from 'react';
import styles from 'dashboard/Data/AppOverview/AppOverview.scss';
import Icon from 'components/Icon/Icon.react';

const LOADING_TEXTS = [
  { text: 'Provisioning database', icon: 'b4a-database-icon' },
  { text: 'Setting up cloud functions', icon: 'b4a-cloud-code-icon' },
  { text: 'Configuring APIs', icon: 'b4a-api-icon' },
  { text: 'Setting auto Scaling', icon: 'b4a-auto-scaling-icon' },
  { text: 'Configuring secutiry rules', icon: 'b4a-security-icon' },
  { text: 'Setting up monitoring and logging', icon: 'b4a-monitor-icon' },
  { text: 'Final checks and optimizations', icon: 'b4a-final-checks-icon' },
  { text: 'Your app is ready!', icon: 'b4a-circle-check-icon' }
];

const MAX_POLL_DURATION = 30_000;
const POLL_INTERVAL = 2_000;
const TEXT_INTERVAL = Math.floor(MAX_POLL_DURATION / (LOADING_TEXTS.length - 1));

const AppLoadingText = ({ appId, pollSchemas }) => {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [hasError, setHasError] = useState(false);
  const shouldShow = document.cookie.includes(`newApp-${appId}=true`);
  // const shouldShow = true;
  const textIntervalRef = useRef(null);
  const pollTimeoutRef = useRef(null);
  const pollIntervalRef = useRef(null);

  useEffect(() => {
    document.documentElement.style.setProperty('--text-interval', `${TEXT_INTERVAL}ms`);
    document.documentElement.style.setProperty('--fill-duration', `${TEXT_INTERVAL / 2}ms`);
  }, []);

  const cleanup = () => {
    if (textIntervalRef.current) {
      clearInterval(textIntervalRef.current);
    }
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
    }
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
  };

  useEffect(() => {
    if (!shouldShow || !pollSchemas) {
      return;
    }

    try {
      document.cookie = `newApp-${appId}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=back4app.com`;
    } catch (error) {
      console.error('Error deleting cookie:', error);
    }

    const rotateText = () => {
      if (isComplete || hasError) {
        return;
      }
      setCurrentTextIndex(prevIndex => {
        const nextIndex = prevIndex + 1;
        if (nextIndex >= LOADING_TEXTS.length - 1) {
          return prevIndex;
        }
        return nextIndex;
      });
    };

    textIntervalRef.current = setInterval(rotateText, TEXT_INTERVAL);

    const pollWithTimeout = async () => {
      if (hasError) {
        return;
      }
      try {
        const result = await pollSchemas();
        if (result) {
          setIsComplete(true);
          cleanup();
          setCurrentTextIndex(LOADING_TEXTS.length - 1);
        }
      } catch (error) {
        console.error('Error polling schema:', error);
        setHasError(true);
        cleanup();
      }
    };

    pollTimeoutRef.current = setTimeout(() => {
      if (!isComplete) {
        setHasError(true);
        cleanup();
      }
    }, MAX_POLL_DURATION);

    pollWithTimeout();
    pollIntervalRef.current = setInterval(pollWithTimeout, POLL_INTERVAL);

    return cleanup;
  }, [appId, shouldShow, pollSchemas, isComplete, hasError]);

  if (!shouldShow) {
    return null;
  }

  const isLastText = currentTextIndex === LOADING_TEXTS.length - 1;
  const displayText = hasError ? 'Contact support' : LOADING_TEXTS[currentTextIndex].text;
  const displayIcon = hasError ? 'b4a-error-icon' : LOADING_TEXTS[currentTextIndex].icon;
  const iconColor = hasError ? '#FF4D4D' : (!isLastText ? '#15A9FF' : '#27AE60');

  return (
    <div className={styles.loadingText}>
      <div
        key={currentTextIndex}
        className={`${styles.loadingTextContent} ${isLastText || hasError ? styles.lastText : ''}`}
      >
        <span
          className={`${styles.loadingTextIcon} ${!isLastText && !hasError ? styles.loadingTextAnimate : ''}`}
        >
          <Icon name={displayIcon} width={18} height={18} fill={iconColor} />
        </span>
        {displayText}
      </div>
    </div>
  );
};

export default AppLoadingText;
