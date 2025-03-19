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

const AppLoadingText = ({ loading, appId, pollSchemas }) => {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [shouldPoll, setShouldPoll] = useState(false);

  // Check for newApp cookie when loading is complete
  useEffect(() => {
    if (!loading) {
      const isNewApp = document.cookie.includes(`newApp-${appId}=true`);
      document.cookie = `newApp-${appId}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=back4app.com`;
      setShouldPoll(isNewApp);
      if (isNewApp) {
        setStartTime(Date.now());
      }
    }
  }, [loading, appId]);

  // Effect for API polling - only runs when shouldPoll is true
  useEffect(() => {
    if (!shouldPoll || !startTime) {
      return;
    }

    const checkStatus = async () => {
      if (await pollSchemas()) {
        setIsComplete(true);
      } else if (Date.now() - startTime >= MAX_POLLING_TIME) {
        setIsComplete(true);
        // failed polling
      }
    };

    const pollingInterval = setInterval(checkStatus, 1000);

    return () => {
      clearInterval(pollingInterval);
    };
  }, [pollSchemas, shouldPoll, startTime]);

  // Effect for text rotation - only runs when shouldPoll is true
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

  // Determine what text to show based on loading and polling states
  const getDisplayText = () => {
    if (loading) {
      return 'Loading app information...';
    }
    if (!shouldPoll) {
      return 'App information loaded successfully';
    }
    return LOADING_TEXTS[currentTextIndex].text;
  };

  return (
    <div className={styles.loadingText}>
      <div className={`${styles.loadingTextContent} ${(isLastText || !shouldPoll) ? styles.lastText : ''}`}>
        {getDisplayText()}
      </div>
    </div>
  );
};

export default AppLoadingText;
