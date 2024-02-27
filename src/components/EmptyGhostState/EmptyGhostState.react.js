import React from 'react';
import Icon from 'components/Icon/Icon.react';
import styles from 'components/EmptyGhostState/EmptyGhostState.scss';

const EmptyGhostState = ({ title, description, cta = '', action = () => {}, secondaryCta = '', secondaryAction = () => {}, fill = '#C1E2FF'}) => {
  return (
    <div className={styles.content}>
      <Icon className={styles.icon} name="ghost-icon" width={32} height={40} fill={fill} />
      <div className={styles.title}>{title}</div>
      <div className={styles.description}>{description}</div>
      <div className={styles.actionBtns}>
        {cta ? (
          <button className={styles.cta} onClick={action}>{cta}</button>
        ) : null}
        {secondaryCta ? (
          <button className={styles.secondaryCta} onClick={secondaryAction}>{secondaryCta}</button>
        ) : null}
      </div>
    </div>
  )
}

export default EmptyGhostState;
