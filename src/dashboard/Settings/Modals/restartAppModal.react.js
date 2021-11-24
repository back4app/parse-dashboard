import React, { useState } from 'react';
import Modal from 'components/Modal/Modal.react';

export const RestartAppModal = ({ context, setParentState }) => {

  const [ processing, setProcessing ] = useState(false);

return <Modal
  type={Modal.Types.INFO}
  icon='gear-solid'
  iconSize={40}
  title='Restart the app'
  subtitle={'This will restart the app'}
  confirmText='Restart app'
  confirmText={processing === false ? 'Restart app' : 'Restarting...'}
  disableConfirm={processing}
  disableCancel={processing}
  cancelText='Cancel'
  buttonsInCenter={true}
  onCancel={() => setParentState({ showRestartAppModal: false })}
  onConfirm={() => {
    setProcessing(true);
    context.currentApp.restartApp().then(() => {
      setParentState({
        cleanupFilesMessage: 'Your app has been restarted successfully.',
        cleanupNoteColor: 'orange',
        showRestartAppModal: false,
      });
    }).catch((e) => {
      setParentState({
        cleanupFilesMessage: e.error,
        cleanupNoteColor: 'red',
        showRestartAppModal: false,
      });
    }).finally(() => setProcessing(false))
  }
} />
}
