import React, { useEffect, useState }                from 'react';
import Modal                              from 'components/Modal/Modal.react';
import Field                              from 'components/Field/Field.react';
import Label                              from 'components/Label/Label.react';
import TextInput                          from 'components/TextInput/TextInput.react';
import { validateEmail }                  from 'dashboard/Settings/Util';
import FormNote                           from 'components/FormNote/FormNote.react';
import Dropdown                           from 'components/Dropdown/Dropdown.react';
import Option                             from 'components/Dropdown/Option.react';

export const CloneAppModal = ({ context, setParentState }) => {

  const [ cloneAppName, setCloneAppName ] = useState('');
  const [ note, setNote ] = useState('')
  const [ processing, setProcessing ] = useState(false);
  const [ cloneDb, setCloneDb ] = useState(false);
  const [ canCloneDb, setCanCloneDb ] = useState(false);
  const [ canSubmit, setCanSubmit ] = useState(false);

  const [ parseVersions, setParseVersions ] = useState([]);
  const [ cloneParseVersion, setCloneParseVersion ] = useState();

  useEffect(() => {
    setProcessing(true);
    context.currentApp.supportedParseServerVersions()
      .then((data) => {
        // console.log(response, context.currentApp.settings.fields.fields.app.mongoVersion);
        setParseVersions(data);
        setCloneParseVersion(data[0]);
      })
      .catch((e) => {
        setNote(e.error)
      })
      .finally(() => {
        setProcessing(false)
      });
  },[]);

  useEffect(() => {cloneAppName.length <= 0 ? setCanSubmit(false) : setCanSubmit(true)},[cloneAppName]);

  return <Modal
  type={Modal.Types.INFO}
  icon='gear-solid'
  iconSize={40}
  title='Clone app'
  subtitle={'This allows you to create a clone from this app'}
  confirmText={processing === false ? 'Clone' : 'Please wait...'}
  cancelText='Cancel'
  disableConfirm={ canSubmit === false || processing || cloneDb === false }
  disableCancel={processing}
  buttonsInCenter={true}
  onCancel={() => setParentState({ showCloneAppModal: false })}
  onConfirm={async () => {
    setProcessing(true);
    let newApp;
    try {
      await context.currentApp.checkStorage();
      newApp = await context.currentApp.createApp(cloneAppName);
      await context.currentApp.initializeDb(newApp.id);
      await context.currentApp.cloneApp(newApp.appId, cloneParseVersion);
      setParentState({
        cleanupFilesMessage: 'Your app has been cloned successfully.',
        cleanupNoteColor: 'orange',
        showCloneAppModal: false,
      });
    } catch(e) {
      console.log(e);
      if ( newApp ) {
        try {
          await context.currentApp.deleteApp(newApp.id);
        } catch(ex) {
          console.log(ex);
        }
      }
      setParentState({
        cleanupFilesMessage: e.error,
        cleanupNoteColor: 'red',
        showCloneAppModal: false,
      });
    } finally {
      setProcessing(false)
    }
  }}>
  <Field
    label={<Label
      text={'Name of the new app.'}
      description={<span>Enter a name for the clone app</span>} />
    }
    input={<TextInput
      height={100}
      placeholder='Clone App Name'
      value={cloneAppName}
      onChange={(value) => {
        setCloneAppName(value)
      }}
      />}
  />

  <Field
    label={<Label
      text={'Parse server version.'}
      description={<span>The version of the parse server the clone app should use</span>} />
    }
    input={
      <Dropdown placeHolder={cloneParseVersion?.version} onChange={value => {
          setCloneParseVersion(value);
        }}>
        {
          parseVersions.map( ( parseVersion ) => <Option value={parseVersion}>{`${parseVersion.version} - ${parseVersion.description}`}</Option>)
        }
      </Dropdown>
    }
  />
  <Field
      labelWidth={100}
      label={
        <Label
          text={<span><input onChange={(e) => setCloneDb(e.target.checked)} type={'checkbox'} /> &nbsp; {'Clone Database'} </span>}
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
