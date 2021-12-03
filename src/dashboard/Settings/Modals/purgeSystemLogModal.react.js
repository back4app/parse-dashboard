import React from 'react';
import Modal from 'components/Modal/Modal.react';

export const PurgeSystemLogModal = ({ context, setParentState }) => <Modal
type={Modal.Types.INFO}
icon='down-outline'
iconSize={40}
title='Clean System Log'
subtitle={'The System log will be removed!'}
confirmText='Purge System Log'
cancelText='Cancel'
buttonsInCenter={true}
onCancel={() => setParentState({showPurgeSystemLogModal: false})}
onConfirm={() => context.currentApp.cleanUpSystemLog().then(() => {
  setParentState({
    cleanupSystemLogMessage: 'Your System log was deleted.',
    cleanupNoteColor: 'orange',
    showPurgeSystemLogModal: false,
  });
}).fail((e) => {
  setParentState({
    cleanupSystemLogMessage: e.error,
    cleanupNoteColor: 'red',
    showPurgeSystemLogModal: false,
  });
})} />
