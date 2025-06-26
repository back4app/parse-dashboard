import React, { useRef, useState } from 'react'
import B4aModal from 'components/B4aModal/B4aModal.react';
import styles from './Deployments.scss';

const RollbackModal = ({ onCancel, onConfirm, releaseId, onSuccess }) => {
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [error, setError] = useState(undefined);
  const confirmationInput = useRef(null);

  const handleConfirm = async () => {
    setError(undefined);
    if (confirmationInput.current.value !== releaseId) {
      setError('Please type the correct version');
      return;
    }
    setIsRollingBack(true);
    try {
      const { success, error } = await onConfirm();
      if (success) {
        onSuccess();
      } else {
        setError(error);
      }
    } catch (e) {
      setError(e.error || 'Failed to rollback');
    } finally {
      setIsRollingBack(false);
    }
  }

  return (
    <B4aModal
      type={B4aModal.Types.INFO}
      title='Confirm Rollback'
      subtitle={`You\'re about to revert to version ${releaseId}. Please type only the version number to confirm`}
      confirmText={isRollingBack === false ? 'Rollback' : 'Rolling back...'}
      disableConfirm={isRollingBack}
      disableCancel={isRollingBack}
      cancelText='Cancel'
      buttonsInCenter={false}
      onCancel={onCancel}
      onConfirm={handleConfirm}
    >
      <input ref={confirmationInput} type="text" placeholder="Enter version number (e.g. 6)" className={styles.rollbackConfirmationInput} />
      <span className={styles.rollbackConfirmationError}>{error}</span>
    </B4aModal>
  )
}

export default RollbackModal
