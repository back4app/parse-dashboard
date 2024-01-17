import React from 'react';
import Pin from 'components/Sidebar/Pin.react';
import Tooltip from 'components/Tooltip/SimpleTooltip.react';
import styles from 'components/Sidebar/Sidebar.scss';

const AppName = ({ name, onClick, pin, onPinClick }) => (
  <div>
    <div className={styles.currentApp}>
      <div className={styles.appNameContainer} onClick={onClick}>
        <Tooltip className={styles.Tooltip} value={(<span>{name}</span>)}>
          <div className={styles.currentAppName}>{name}</div>
        </Tooltip>
        <div className={styles.appsSelectorArrow}></div>
      </div>
      {pin}
    </div>
  </div>
);

export default AppName;
