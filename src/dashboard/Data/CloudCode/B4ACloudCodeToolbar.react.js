import React          from 'react';
import Toolbar        from 'components/Toolbar/Toolbar.react';
import styles         from 'dashboard/Data/CloudCode/B4ACloudCodeToolbar.scss';

const B4ACloudCodeToolbar = ({ children }) => {
  return (
    <Toolbar
      toolbarStyles={styles.title}
      section="Cloud Code"
      subsection="Functions & Web Hosting"
      details={'Settings'}
    >
      {children}
    </Toolbar>
  );
};

export default B4ACloudCodeToolbar;
