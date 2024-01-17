import React, { useEffect, useState }                from 'react';
import Modal                              from 'components/Modal/Modal.react';
import Field                              from 'components/Field/Field.react';
import Label                              from 'components/Label/Label.react';
import TextInput                          from 'components/TextInput/TextInput.react';
import FormNote                           from 'components/FormNote/FormNote.react';
import Dropdown                           from 'components/Dropdown/Dropdown.react';
import Option                             from 'components/Dropdown/Option.react';
import PropTypes                          from 'prop-types';

export const CloneAppModal = ({ context, setParentState }) => {

  const [ cloneAppName, setCloneAppName ] = useState('');
  const [ note, setNote ] = useState('');
  const [ noteColor, setNoteColor ] = useState('red');
  const [ processing, setProcessing ] = useState(false);
  const [ cloneType, setCloneType ] = useState('database');
  const [ canSubmit, setCanSubmit ] = useState(false);
  const [ cloneCloudCode, setCloneCloudCode ] = useState(false);
  const [ cloneConfigs, setCloneConfigs ] = useState(false);

  const [ parseVersions, setParseVersions ] = useState([]);
  const [ cloneParseVersion, setCloneParseVersion ] = useState();

  useEffect(() => {
    setProcessing(true);
    context.supportedParseServerVersions()
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
      setProcessing(true)
      
      if ( cloneType === 'database' ) {
        // check storage for the current app.
        setNote('Validating app storage...');
        setNoteColor('blue');

        await context.checkStorage();
      }

      setNote('Creating a new parse app...');
      setNoteColor('blue');

      newApp = await context.createApp(cloneAppName, cloneParseVersion?.version, context.applicationId);

      if ( !newApp || Object.keys(newApp).length <= 0 ) {
        throw new Error();
      }

      setNote('Creating database for the new parse app...');
      setNoteColor('blue');

      await context.initializeDb(newApp._id, cloneParseVersion?.version);

      setNote('Cloning app...');
      setNoteColor('blue');

      await context.cloneApp( newApp.appId, cloneParseVersion?.version, cloneType, cloneCloudCode, cloneConfigs );

      setNote('App cloned successfully! Redirecting in 1 second');
      setNoteColor('green');

      setTimeout(() => {
        window.location.href = `/apps/${newApp.appId}`;
      }, 1000);

    } catch(e){
      console.error(e);
      let error = 'An error occurred.';
      if ( e.message ) {
        error = e.message;
      }
      setNote(error);
      setNoteColor('red');  
      if ( newApp && newApp._id ) {
        await context.deleteApp( newApp._id );
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
  disableConfirm={ canSubmit === false || processing }
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
              parseVersions.map( ( parseVersion ) => <Option key={parseVersion.version} value={parseVersion}>{`${parseVersion.version} - ${parseVersion.description}`}</Option>)
            }
          </Dropdown>
        }
      />
      <Field
          labelWidth={100}
          label={
            <Label
              text={<span><input onChange={(e) => setCloneType(e.target.value)} name="copyType" value="database" type={'radio'} checked={cloneType === 'database'}/> &nbsp; {'Clone Database'} </span>}
            />
          }
        />
      <Field
          labelWidth={100}
          label={
            <Label
              text={<span><input onChange={(e) => setCloneType(e.target.value)} name="copyType" value="schema" type={'radio'} checked={cloneType === 'schema'}/> &nbsp; {'Clone Schema'} </span>}
            />
          }
        />
      <Field
          labelWidth={100}
          label={
            <Label
              text={<span><input onChange={(e) => setCloneCloudCode(e.target.checked)} name="cloneCloudCode" type={'checkbox'} /> &nbsp; {'Clone Cloud Code'} </span>}
            />
          }
        />
      <Field
          labelWidth={100}
          label={
            <Label
              text={<span><input onChange={(e) => setCloneConfigs(e.target.checked)} name="cloneConfigs" type={'checkbox'} /> &nbsp; {'Clone Configurations'} </span>}
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

CloneAppModal.propTypes = {
  context: PropTypes.any.isRequired.describe( 'The application context.' ),
  setParentState: PropTypes.func.isRequired.describe( 'Update parent state'),
}