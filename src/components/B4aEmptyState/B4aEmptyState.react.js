import React from 'react';
// import Icon from 'components/Icon/Icon.react';
import ghostImg from './ghost.png';
import styles from 'components/B4aEmptyState/B4aEmptyState.scss';
import stylesButton from 'components/Button/Button.scss';

const ctaButton = (cta, action, primary = true) => {
  const actionStyles = primary ? styles.cta : styles.secondaryCta;
  if (cta) {
    if (action.constructor === String) {
      return (
        <a
          href={action}
          className={[stylesButton.button, actionStyles, styles.link].join(' ')}
          target="_blank"
        >
          {cta}
        </a>
      );
    } else {
      return <button className={actionStyles} onClick={action}>{cta}</button>;
    }
  } else {
    return null;
  }
};


const B4aEmptyState = ({ imgSrc = ghostImg, title, description, cta = '', action = () => {}, secondaryCta = '', secondaryAction = () => {}, dark = true, margin }) => {
  return (
    <div className={styles.content + ` ${!dark ? styles.light : ''}`} style={{ margin }}>
      {imgSrc && <img src={imgSrc} alt="empty state" />}
      <div className={styles.title}>{title}</div>
      <div className={styles.description}>{description}</div>
      <div className={styles.actionBtns}>
        {ctaButton(cta, action, true)}
        {ctaButton(secondaryCta, secondaryAction, false)}
      </div>
    </div>
  )
}

export default B4aEmptyState;
