import React from 'react';
import styles from 'components/Toggle/B4aTabToggle.scss';

const B4aTabToggle = ({ value, onChange, optionLeft, optionRight}) => {
  return (
    <div className={styles.toggle}>
      <div onClick={() => onChange(optionLeft)} className={styles.option + ` ${styles.optionLeft} ${value === optionLeft ? styles.active : ''}`}>{optionLeft}</div>
      <div onClick={() => onChange(optionRight)} className={styles.option + ` ${styles.optionRight} ${value === optionRight ? styles.active : ''}`}>{optionRight}</div>
    </div>
  )
}

export default B4aTabToggle;
