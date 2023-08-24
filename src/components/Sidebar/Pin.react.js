<<<<<<< HEAD
import React from "react";

import Icon from "components/Icon/Icon.react";
import styles from "components/Sidebar/Sidebar.scss";

const Pin = ({ onClick }) => (
  <div className={styles.pinContainer} onClick={onClick}>
    <Icon className={styles.sidebarPin} name="pin" width={20} height={20} />
=======
import React from 'react';

import Icon from 'components/Icon/Icon.react';
import styles from 'components/Sidebar/Sidebar.scss';

const Pin = ({ onClick }) => (
  <div className={styles.pinContainer} onClick={onClick}>
    <Icon className={styles.sidebarPin} name='pin' width={20} height={20} />
>>>>>>> origin/upstream
  </div>
);

export default Pin;
