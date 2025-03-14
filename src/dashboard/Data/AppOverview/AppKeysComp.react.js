import React, { useState } from 'react';
import Icon from 'components/Icon/Icon.react';
import styles from 'dashboard/Data/AppOverview/AppOverview.scss';

const AppKeysComponent = ({appKeys, copyText}) => {
  const [selectedKey, setSelectedKey] = useState('javascriptKey');

  return <div className={styles.appKeyWrapper}>
    <label htmlFor='appKeys'>Keys: </label>
    <div className="">
      <select name="appKeys" className={styles.appKeySelect} value={selectedKey} defaultValue={selectedKey} onChange={(e) => setSelectedKey(e.target.value)}>
        {[...appKeys.entries()].map(([key]) => (
          <option key={key} value={key}>
            {key}
          </option>
        ))}
      </select>
      <div style={{ paddingLeft: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        {appKeys.get(selectedKey)}
        <div style={{ cursor: 'pointer', marginLeft: '4px' }} onClick={() => copyText(appKeys.get(selectedKey))}>
          <Icon name='b4a-copy-icon' fill="#15A9FF" width={14} height={14} />
        </div>
      </div>
    </div>
  </div>
}

export default AppKeysComponent;
