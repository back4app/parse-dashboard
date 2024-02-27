import React from 'react';

import Icon from 'components/Icon/Icon.react';
import styles from 'components/Sidebar/B4aSidebar.scss';

const Pin = ({ onClick }) => (
  <div className={styles.pinContainer} onClick={onClick}>
    <Icon className={styles.sidebarPin} name="b4a-collapse-sidebar" width={18} height={18} />
  </div>
);

export default Pin;
