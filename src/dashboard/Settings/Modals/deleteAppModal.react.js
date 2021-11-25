import React, { useEffect, useState } from 'react';
import Modal from 'components/Modal/Modal.react';
import Field                              from 'components/Field/Field.react';
import Label                              from 'components/Label/Label.react';
import TextInput                          from 'components/TextInput/TextInput.react';
import FormNote                           from 'components/FormNote/FormNote.react';

export const DeleteAppModal = ({ context, setParentState }) => {

  const [ agreed, setAgreed ] = useState(false);
  const [ name, setName ] = useState('');
  const [ note, setNote ] = useState('')
  const [ processing, setProcessing ] = useState(false);

  useEffect(() => { setNote('') },[name])

  return <Modal
  type={Modal.Types.DANGER}
  icon='gear-solid'
  iconSize={40}
  title='Delete app'
  subtitle={'This will delete the app'}
  confirmText={processing === false ? 'Delete' : 'Please wait...'}
  cancelText='Cancel'
  disableConfirm={!agreed || processing}
  disableCancel={processing}
  buttonsInCenter={true}
  onCancel={() => setParentState({ showDeleteAppModal: false })}
  onConfirm={() => {
    if ( name !== context.currentApp.name ) {
      setNote('App name doesn\'t match');
      return;
    }
    setProcessing(true);
    context.currentApp.deleteApp().then(() => {
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
  <Field
    label={<Label
      text={'App Name.'}
      description={<span>Please enter the name of the app ({context.currentApp.name}) for confirmation?</span>} />
    }
    input={<TextInput
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
        text={<span><input onChange={(e) => setAgreed(e.target.checked)} type={'checkbox'} /> &nbsp; This action is irreversible. Are you sure you want to continue? </span>}
      />
    }
  />
  {note.length > 0 ? <FormNote
        show={note.length > 0}
        color='red' >
        {note}
      </FormNote> : null}
</Modal>
}
