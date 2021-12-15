import React, { useEffect, useState }                from 'react';
import Modal                              from 'components/Modal/Modal.react';
import Field                              from 'components/Field/Field.react';
import Label                              from 'components/Label/Label.react';
import TextInput                          from 'components/TextInput/TextInput.react';
import FormNote                           from 'components/FormNote/FormNote.react';
import Dropdown                           from 'components/Dropdown/Dropdown.react';
import Option                             from 'components/Dropdown/Option.react';

export const CloneAppModal = ({ context, setParentState }) => {

  const [ cloneAppName, setCloneAppName ] = useState('');
  const [ note, setNote ] = useState('');
  const [ noteColor, setNoteColor ] = useState('red');
  const [ processing, setProcessing ] = useState(false);
  const [ cloneDb, setCloneDb ] = useState(false);
  const [ canSubmit, setCanSubmit ] = useState(false);

  const [ parseVersions, setParseVersions ] = useState([]);
  const [ cloneParseVersion, setCloneParseVersion ] = useState();

  useEffect(() => {
    setProcessing(true);
    context.currentApp.supportedParseServerVersions()
      .then((data) => {
        setParseVersions(data.results);
        setCloneParseVersion(data.results[0]);
      })
      .catch((e) => {
        setNote(e.error)
      })
      .finally(() => {
        setProcessing(false)
      });
  },[]);

  useEffect(() => {cloneAppName.length <= 0 ? setCanSubmit(false) : setCanSubmit(true)},[cloneAppName]);
  
  const cloneApp = async () => {
    let newApp;
    try {
      // check storage for the current app.
      setProcessing(true)
      setNote('Validationg app storage...');
      setNoteColor('blue');

      await context.currentApp.checkStorage();

      setNote('Creating a new parse app...');
      setNoteColor('blue');

      newApp = await context.currentApp.createApp(cloneAppName);

      setNote('Creating database for the new parse app...');
      setNoteColor('blue');

      await context.currentApp.initializeDb(newApp.id, cloneParseVersion?.version);

      setNote('Cloning app...');
      setNoteColor('blue');

      await context.currentApp.cloneApp( newApp.appId, cloneParseVersion?.version );

      setNote('App cloned successfully!');
      setNoteColor('green');

    } catch(e){
      console.log(e);
      setNote('An error occurred');
      setNoteColor('red');  
      if ( newApp ) {
        await context.currentApp.deleteApp( newApp.id );
      }

    } finally {
      setProcessing(false);
    }
  }

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
  onConfirm={() => cloneApp()}>
    <div>
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
            color={noteColor} >
            {note}
          </FormNote> : null}
    </div>
</Modal>
}
