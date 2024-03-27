import React from 'react';
import Pin from 'components/Sidebar/Pin.react';
import Tooltip from 'components/Tooltip/SimpleTooltip.react';
import Icon from 'components/Icon/Icon.react';
import styles from 'components/Sidebar/B4aSidebar.scss';

const AppName = ({ name, onClick, onPinClick }) => (
  <div>
    <div className={styles.currentApp}>
      <div className={styles.appNameContainer} onClick={onClick}>
        <Tooltip className={styles.Tooltip} value={(<>{name}</>)}>
          <div className={styles.currentAppName}>{name}</div>
        </Tooltip>
        <Icon name="b4a-chevron-down" width={18} height={18} />
      </div>
      <Pin onClick={onPinClick} />
    </div>
  </div>
);

export default AppName;
