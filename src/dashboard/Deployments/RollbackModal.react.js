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
      title='Rollback'
      subtitle={`Are you sure you want to rollback to V${releaseId}. This action might take a few minutes to be reflected.`}
      confirmText={isRollingBack === false ? 'Rollback' : 'Rolling back...'}
      disableConfirm={isRollingBack}
      disableCancel={isRollingBack}
      cancelText='Cancel'
      buttonsInCenter={false}
      onCancel={onCancel}
      onConfirm={handleConfirm}
    >
      <input ref={confirmationInput} type="text" placeholder="Please type Version to confirm" className={styles.rollbackConfirmationInput} />
      <span className={styles.rollbackConfirmationError}>{error}</span>
    </B4aModal>
  )
}

export default RollbackModal
