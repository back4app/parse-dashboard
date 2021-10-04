import React          from 'react';
import Toolbar        from 'components/Toolbar/Toolbar.react';
import styles         from 'dashboard/Data/CloudCode/B4ACloudCodeToolbar.scss';

let B4ACloudCodeToolbar = () => {
  return (
    <Toolbar
      toolbarStyles={styles.title}
      subsection={'Cloud Code Functions'}
      details={'Settings'}>
    </Toolbar>
  );
};

export default B4ACloudCodeToolbar;
