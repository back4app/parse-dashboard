import React from 'react';
import styles from 'components/B4ACodeTree/B4ACodeTree.scss'

const B4ACloudCodeInfo = ({ imgSrc, description }) => {
  return (
    <div className={styles.folderInfoWrapper}>
      {imgSrc ? <img src={imgSrc} alt="folder icon" className={styles.icon} /> : null}
      <div className={styles.description}>
        {description}
      </div>
    </div>
  )
}

export default B4ACloudCodeInfo
