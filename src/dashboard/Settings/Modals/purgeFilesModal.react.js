import React from 'react';
import Modal from 'components/Modal/Modal.react';

export const PurgeFilesModal = ({ context, setParentState }) => <Modal
  type={Modal.Types.INFO}
  icon='down-outline'
  iconSize={40}
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
