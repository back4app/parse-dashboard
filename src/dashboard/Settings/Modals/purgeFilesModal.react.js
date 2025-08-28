import React from 'react';
import B4aModal from 'components/B4aModal/B4aModal.react';

export const PurgeFilesModal = ({ context, setParentState }) => <B4aModal
  type={B4aModal.Types.DEFAULT}
  title='Clean Orphan Files'
  subtitle={'The files without DB references will be removed!'}
  confirmText='Purge Files'
  cancelText='Cancel'
  buttonsInCenter={true}
  onCancel={() => setParentState({ showPurgeFilesModal: false })}
  onConfirm={() => context.cleanUpFiles().then(() => {
    setParentState({
      cleanupFilesMessage: 'All set! You\'ll receive an email when the process is over.',
      cleanupNoteColor: 'orange',
      showPurgeFilesModal: false,
    });
  }).catch((e) => {
    setParentState({
      cleanupFilesMessage: e.error,
      cleanupNoteColor: 'red',
      showPurgeFilesModal: false,
    });
  })} />
