<<<<<<< HEAD
import React from "react";
import styles from "components/Sidebar/Sidebar.scss";
import Tooltip from 'components/Tooltip/SimpleTooltip.react';

const AppName = ({ name, pin, onClick }) => (
  <div className={styles.currentApp}>
    <div className={styles.currentAppNameGroup} onClick={onClick}>
      <Tooltip 
        className={styles.Tooltip}
        value={(
          <span>{name}</span>
        )}
      >
        <div className={styles.currentAppName}>{name}</div>
      </Tooltip>
      <div className={styles.appsSelectorArrow}></div>
    </div>
    {pin}
=======
import React from 'react';
import Pin from 'components/Sidebar/Pin.react';
import styles from 'components/Sidebar/Sidebar.scss';

const AppName = ({ name, onClick, onPinClick }) => (
  <div>
    <div className={styles.currentApp}>
      <div className={styles.appNameContainer} onClick={onClick}>
        <div className={styles.currentAppName}>
          {name}
        </div>
      </div>
      <Pin onClick={onPinClick} />
    </div>
>>>>>>> origin/upstream
  </div>
);

export default AppName;
