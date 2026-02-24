import React, { useState } from 'react';
import Button from 'components/Button/Button.react';
import Icon from 'components/Icon/Icon.react';
import FormNote from 'components/FormNote/FormNote.react';
import modalStyles from 'components/B4aModal/B4aModal.scss';
import styles from 'dashboard/Settings/Modals/editParseVersionModal.scss';
import Popover from 'components/Popover/Popover.react';
import Position from 'lib/Position';

const origin = new Position(0, 0);

export const EditDatabaseURLModal = ({ context, setParentState, currentDatabaseURL }) => {
  const [processing, setProcessing] = useState(false);
  const [databaseURL, setDatabaseURL] = useState(currentDatabaseURL || '');
  const [note, setNote] = useState('');
  const [noteColor, setNoteColor] = useState('red');

  const close = () => setParentState({ showEditDatabaseURLModal: false });

  const hasChanged = databaseURL.trim() !== (currentDatabaseURL || '').trim();

  const save = async () => {
    if (!hasChanged || !databaseURL.trim()) {
      return;
    }

    try {
      setProcessing(true);
      setNote('');
      await context.saveParseOptionsAndSettings({ databaseURL: databaseURL.trim() });
      window.location.reload();
    } catch (e) {
      setNote(e?.error || e?.message || e || 'Failed to update database URL');
      setNoteColor('red');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Popover fadeIn={true} fixed={true} position={origin} modal={true} color="rgba(17,13,17,0.8)">
      <div
        className={[modalStyles.modal, styles.modal].join(' ')}
        style={{ width: '35vw', minWidth: 360 }}
      >
        <Icon onClick={close} width={10} height={10} className={modalStyles.closeIcon} name="close" fill="#10203A" />

        <div className={`${modalStyles.header} ${styles.header}`}>
          <div className={modalStyles.title}>Change Database URL</div>
          <div className={modalStyles.subtitle}>
            Update the database connection string for this app. The app will restart after saving.
          </div>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.content}>
            <label className={styles.label}>Database URL</label>
            <input
              type="text"
              className={styles.selectBtn}
              value={databaseURL}
              onChange={(e) => {
                setDatabaseURL(e.target.value);
                setNote('');
              }}
              placeholder="mongodb://..."
              disabled={processing}
            />
          </div>

          {note !== '' && (
            <div style={{ marginTop: '10px' }}>
              <FormNote show={note !== ''} color={noteColor}>
                {note}
              </FormNote>
            </div>
          )}
        </div>

        <div className={modalStyles.footer} style={{ textAlign: 'right' }}>
          <Button
            color="white"
            width="auto"
            additionalStyles={{ border: '1px solid #ccc', color: '#303338' }}
            value="Cancel"
            onClick={close}
            disabled={processing}
          />
          <Button
            primary={true}
            value={processing ? 'Saving...' : 'Save Changes'}
            color="green"
            disabled={!hasChanged || !databaseURL.trim() || processing}
            onClick={save}
            progress={processing}
          />
        </div>
      </div>
    </Popover>
  );
};
