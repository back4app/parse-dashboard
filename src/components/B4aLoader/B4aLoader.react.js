import React from 'react';
// import styles from 'components/B4aLoaderContainer/B4aLoaderContainer.scss';
import loadingWebp from './loader.webp';

const B4aLoader = () => {
  return (
    <>
      <div style={{ textAlign: 'center' }}>
        <img src={loadingWebp} alt="Loading" width="145" />
        {/* <div className={styles.text} style={{ fontSize: '14px', marginTop: '10px' }}>Loading</div> */}
      </div>
    </>
  )
}

export default B4aLoader
