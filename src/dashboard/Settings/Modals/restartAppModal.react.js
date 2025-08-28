import React, { useState } from 'react';
import B4aModal from 'components/B4aModal/B4aModal.react';

export const RestartAppModal = ({ context, setParentState }) => {

  const [ processing, setProcessing ] = useState(false);

  return <B4aModal
    type={B4aModal.Types.DEFAULT}
    title='Restart the app'
    subtitle={'This will restart the app'}
    confirmText={processing === false ? 'Restart app' : 'Restarting...'}
    disableConfirm={processing}
    disableCancel={processing}
    cancelText='Cancel'
    buttonsInCenter={true}
    onCancel={() => setParentState({ showRestartAppModal: false })}
    onConfirm={() => {
      setProcessing(true);
      context.restartApp().then(() => {
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
