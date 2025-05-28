import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './AppOverview.scss';
import Icon from 'components/Icon/Icon.react';
import { CloneAppModal } from 'dashboard/Settings/Modals/cloneAppModal.react';
import { DeleteAppModal } from 'dashboard/Settings/Modals/deleteAppModal.react';
import { RestartAppModal } from 'dashboard/Settings/Modals/restartAppModal.react';

const AppOverviewActions = ({ appUrlName, context }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const [isRestartModalOpen, setIsRestartModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

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

  const handleAction = (action) => {
    switch (action) {
      case 'refresh':
        window.location.reload();
        break;
      case 'restart':
        setIsRestartModalOpen(true);
        break;
      case 'clone':
        setIsCloneModalOpen(true);
        break;
      case 'delete':
        setIsDeleteModalOpen(true);
        break;
      default:
        break;
    }
    setIsDropdownOpen(false);
  };

  const setParentState = (state) => {
    if (state.showCloneAppModal === false) {
      setIsCloneModalOpen(false);
    }
    if (state.showRestartAppModal === false) {
      setIsRestartModalOpen(false);
    }
    if (state.showDeleteAppModal === false) {
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <div className={styles.appOverviewActionsContainer}>
      {/* <div className={styles.appOverviewActionsTitle}>{appName}</div> */}
      <div className={styles.dropdownContainer} ref={dropdownRef}>
        <div
          className={styles.dropdownTrigger + (isDropdownOpen ? ` ${styles.open}` : '')}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <span>Actions</span>
          <Icon name="b4a-chevron-down" width={16} height={16} fill="#f9f9f9" />
        </div>
        {isDropdownOpen && (
          <div className={`${styles.dropdownMenu} ${isDropdownOpen ? styles.open : ''}`}>
            <div className={styles.dropdownItem}>
              <Link to={`/apps/${appUrlName}/server-settings`}>
                Server Settings
              </Link>
            </div>
            <div className={styles.dropdownItem} onClick={() => handleAction('refresh')}>
              Refresh
            </div>
            <div className={styles.dropdownItem} onClick={() => handleAction('restart')}>
              Restart
            </div>
            <div className={styles.dropdownItem} onClick={() => handleAction('clone')}>
              Clone
            </div>
            <div className={styles.dropdownItem}>
              <a href="https://help.back4app.com/hc/en-us/requests/new" target="_blank" rel="noopener noreferrer">
                Open a Ticket
              </a>
            </div>
            <div
              className={styles.dropdownItem}
              onClick={() => handleAction('delete')}
              style={{ color: '#FF4242' }}
            >
              Delete
            </div>
          </div>
        )}
      </div>

      {isCloneModalOpen && <CloneAppModal context={context} setParentState={setParentState} />}
      {isRestartModalOpen && <RestartAppModal context={context} setParentState={setParentState} />}
      {isDeleteModalOpen && <DeleteAppModal context={context} setParentState={setParentState} />}
    </div>
  );
};

export default AppOverviewActions;

