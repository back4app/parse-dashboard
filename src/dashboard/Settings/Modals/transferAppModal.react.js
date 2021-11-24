import React, { useState }                from 'react';
import FormModal                          from 'components/FormModal/FormModal.react';
import Modal                              from 'components/Modal/Modal.react';
import validateAndSubmitConnectionString  from 'lib/validateAndSubmitConnectionString';
import Field                              from 'components/Field/Field.react';
import Label                              from 'components/Label/Label.react';
import TextInput                          from 'components/TextInput/TextInput.react';
import { validateEmail }                  from 'dashboard/Settings/Util';
import FormNote                           from 'components/FormNote/FormNote.react';

export const TransferAppModal = ({ context, setParentState }) => {

  const [ agreed, setAgreed ] = useState(false);
  const [ email, setEmail ] = useState('');
  const [ note, setNote ] = useState('')
  const [ processing, setProcessing ] = useState(false);

return <Modal
  type={Modal.Types.DANGER}
  icon='gear-solid'
  iconSize={40}
  title='Transfer app'
  subtitle={'This will transfer the app to another user'}
  confirmText={processing === false ? 'Transfer' : 'Transfering...'}
  cancelText='Cancel'
  disableConfirm={!agreed || processing}
  disableCancel={processing}
  buttonsInCenter={true}
  onCancel={() => setParentState({ showTransferAppModal: false })}
  onConfirm={() => {
    if ( validateEmail(email) ){
      setProcessing(true);
      context.currentApp.transferApp().then(() => {
        setParentState({
          cleanupFilesMessage: 'Your app has been successfully transfered.',
          cleanupNoteColor: 'orange',
          showTransferAppModal: false,
        });
      }).catch((e) => {
        setParentState({
          cleanupFilesMessage: e.error,
          cleanupNoteColor: 'red',
          showTransferAppModal: false,
        });
      }).finally(() => setProcessing(false))
    } else {
      setNote('Invalid email format')
    }
  }}>
  <Field
    label={<Label
      text={'New owner\'s email.'}
      description={<span>The email address of the user whom you wish to transfer the app to? (the email has to be registered at back4app).</span>} />
    }
    input={<TextInput
      height={100}
      placeholder='Email address'
      value={email}
      onChange={(value) => {
        setEmail(value)
      }}
      />}

  />
  <Field
    labelWidth={100}
    label={
      <Label
        text={<span><input onChange={(e) => setAgreed(e.target.checked)} type={'checkbox'} /> &nbsp; I agree to transfer this app to {'Test user'} </span>}
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

