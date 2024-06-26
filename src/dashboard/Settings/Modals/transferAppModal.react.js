import React, { useState }                from 'react';
import Modal                              from 'components/Modal/Modal.react';
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
      context.transferApp(email).then(() => {
        setParentState({
          cleanupFilesMessage: 'Your app has been successfully transfered.',
          cleanupNoteColor: 'orange',
          showTransferAppModal: false,
        });
        window.location = `${b4aSettings.DASHBOARD_PATH}/apps`;
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
      description={<span>The email must be registered at Back4App.</span>} />
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
        text={<span><input onChange={(e) => setAgreed(e.target.checked)} type={'checkbox'} /> &nbsp; I agree to transfer this app to {email} </span>}
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

