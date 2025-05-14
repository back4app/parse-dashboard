import React, { useEffect, useState } from 'react';
import B4aModal from 'components/B4aModal/B4aModal.react';
import Field from 'components/Field/Field.react';
import Label from 'components/Label/Label.react';
import TextInput from 'components/TextInput/TextInput.react';
import FormNote from 'components/FormNote/FormNote.react';

export const DeleteAppModal = ({ context, setParentState }) => {

  const [ agreed, setAgreed ] = useState(false);
  const [ name, setName ] = useState('');
  const [ note, setNote ] = useState('')
  const [ processing, setProcessing ] = useState(false);

  useEffect(() => { setNote('') },[name])

  return <B4aModal
    type={B4aModal.Types.DANGER}
    title='Delete app'
    subtitle={'This will delete the app'}
    confirmText={processing === false ? 'Delete' : 'Please wait...'}
    cancelText='Cancel'
    disableConfirm={!agreed || processing}
    disableCancel={processing}
    buttonsInCenter={false}
    onCancel={() => setParentState({ showDeleteAppModal: false })}
    onConfirm={() => {
      if (!agreed) {
        setNote('Please check the box to confirm');
        return;
      }
      if (name !== context.name) {
        setNote('App name doesn\'t match');
        return;
      }
      setProcessing(true);
      context.deleteApp().then(() => {
        setParentState({
          cleanupFilesMessage: 'Your app has been deleted.',
          cleanupNoteColor: 'orange',
          showDeleteAppModal: false,
        });
        window.location = `${b4aSettings.DASHBOARD_PATH}/apps`;
      }).catch((e) => {
        setParentState({
          cleanupFilesMessage: e.error,
          cleanupNoteColor: 'red',
          showDeleteAppModal: false,
        });
      }).finally(() => setProcessing(false))
    }}>
    <div style={{ borderRadius: '5px', overflow: 'hidden' }}>
      <Field
        label={<Label
          text={'App Name.'}
          description={<span>Please enter the name of the app ({context.name}) for confirmation</span>} />
        }
        input={<TextInput
          padding={'0 1rem'}
          dark={false}
          height={100}
          placeholder='App Name'
          value={name}
          onChange={(value) => {
            setName(value)
          }}
        />}

      />
      <Field
        labelWidth={100}
        label={
          <Label
            description={<span style={{ display: 'inline-flex', alignItems: 'center'}}><input onChange={(e) => setAgreed(e.target.checked)} type={'checkbox'} style={{ accentColor: '#10203A'}} /> &nbsp; This action is irreversible. Are you sure you want to continue? </span>}
          />
        }
      />
      {note.length > 0 ? <FormNote
        show={note.length > 0}
        color='red' >
        {note}
      </FormNote> : null}
    </div>
  </B4aModal>
}
