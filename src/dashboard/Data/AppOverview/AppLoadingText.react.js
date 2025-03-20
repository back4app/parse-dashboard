import React, { useState, useEffect } from 'react';
import styles from 'dashboard/Data/AppOverview/AppOverview.scss';

const LOADING_TEXTS = [
  { text: 'Provisioning database' },
  { text: 'Setting up cloud functions' },
  { text: 'Configuring APIs' },
  { text: 'Your app is ready!' }
];

const MAX_POLLING_TIME = 30_000; // 30 seconds
const INITIAL_TEXT_INTERVAL = 2_000; // 2 seconds per text
const SPEED_UP_INTERVAL = 500; // 0.5 seconds when speeding up

const AppLoadingText = ({ appId, pollSchemas }) => {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [failedPolling, setFailedPolling] = useState('');
  const shouldPoll = document.cookie.includes(`newApp-${appId}=true`);

  // Clear cookie and start polling if it exists
  useEffect(() => {
    if (shouldPoll) {
      document.cookie = `newApp-${appId}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=back4app.com`;
    }
  }, [appId, shouldPoll]);

  // Return empty div if no cookie present
  if (!shouldPoll) {
    return <div />;
  }

  // Effect for API polling
  useEffect(() => {
    if (!shouldPoll || failedPolling !== '') {
      return;
    }

    const startTime = Date.now();
    const checkStatus = async () => {
      if (await pollSchemas()) {
        setIsComplete(true);
      } else if (Date.now() - startTime >= MAX_POLLING_TIME) {
        setIsComplete(true);
        setFailedPolling('Failed to load schemas');
      }
    };

    const pollingInterval = setInterval(checkStatus, 1000);

    return () => {
      clearInterval(pollingInterval);
    };
  }, [pollSchemas, shouldPoll]);

  // Effect for text rotation
  useEffect(() => {
    if (!shouldPoll) {
      return;
    }

    const rotateText = () => {
      setCurrentTextIndex(prevIndex => {
        if (prevIndex === LOADING_TEXTS.length - 1) {
          return prevIndex;
        }
        return prevIndex + 1;
      });
    };

    const interval = isComplete ? SPEED_UP_INTERVAL : INITIAL_TEXT_INTERVAL;
    const textInterval = setInterval(rotateText, interval);

    return () => clearInterval(textInterval);
  }, [isComplete, shouldPoll]);

  const isLastText = currentTextIndex === LOADING_TEXTS.length - 1;

  return (
    <div className={styles.loadingText}>
      <div className={`${styles.loadingTextContent} ${isLastText ? styles.lastText : ''}`}>
        {failedPolling || LOADING_TEXTS[currentTextIndex].text}
      </div>
    </div>
  );
};

export default AppLoadingText;
