import React, { useState, useRef, useEffect } from 'react';
import Icon from 'components/Icon/Icon.react';
import styles from 'dashboard/Data/AppOverview/AppOverview.scss';
import B4aTooltip from 'components/Tooltip/B4aTooltip.react';

const formatCamelCase = (str) => {
  // Handle empty or invalid input
  if (!str) {
    return '';
  }
  // Add space before capital letters and convert to lowercase
  return str
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
    .trim(); // Remove any leading/trailing spaces
};

const AppKeysComponent = ({ appKeys, copyText }) => {
  const [selectedKey, setSelectedKey] = useState('javascriptKey');
  const [showCopiedTooltip, setShowCopiedTooltip] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return <div className={styles.appKeyWrapper}>
    <label htmlFor='appKeys'>Keys: </label>

    <div className={styles.appKeyContainer}>
      <div className={styles.dropdownContainer} ref={dropdownRef}>
        <div
          className={`${styles.dropdownTrigger} ${isDropdownOpen ? styles.active : ''}`}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <span>{formatCamelCase(selectedKey)}</span>
          <Icon
            name='b4a-chevron-down'
            width={16}
            height={16}
            fill="#f9f9f9"
          />
        </div>
        {isDropdownOpen && (
          <div className={styles.dropdownMenu}>
            {[...appKeys.entries()].map(([key]) => (
              <div
                key={key}
                className={`${styles.dropdownItem} ${selectedKey === key ? styles.selected : ''}`}
                onClick={() => {
                  setSelectedKey(key);
                  setIsDropdownOpen(false);
                }}
              >
                {formatCamelCase(key)}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className={styles.keyValueContainer}>
        <span className={styles.keyValue}>{appKeys.get(selectedKey)}</span>
        <B4aTooltip value={'Copied!'} visible={showCopiedTooltip} placement='top' theme='dark'>
          <div
            className={styles.copyButton}
            onClick={() => {
              copyText(appKeys.get(selectedKey));
              setShowCopiedTooltip(true);
              setTimeout(() => {
                setShowCopiedTooltip(false);
              }, 2_000);
            }}
          >
            <Icon name='b4a-copy-icon' fill="#15A9FF" width={14} height={14} />
          </div>
        </B4aTooltip>
      </div>
    </div>
  </div>
}

export default AppKeysComponent;
