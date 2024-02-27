import React from 'react'
import styles from 'components/B4aPageHeader/B4aPageHeader.scss';

const B4aPageHeader = ({ heading, description }) => {
  return (
    <div className={styles.header}>
      <div className={styles.title}>{heading}</div>
      <div className={styles.subtitle}>{description}</div>
    </div>
  )
}

export default B4aPageHeader;
