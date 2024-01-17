import React from 'react';

export default ({validateAndSubmitConnectionString, state, setState, context, closeModalWithConnectionString, Modal, }) => <FormModal
  title='Change Connection String'
  subtitle={'Immediately switch your connection string for your app\'s database.'}
  open={state.showChangeConnectionStringModal}
  onSubmit={() => {
    const promise = validateAndSubmitConnectionString(
      state.newConnectionString,
      state.migrationWarnings,
      warnings => setState({migrationWarnings: warnings}),
      connectionString => context.changeConnectionString(connectionString)
    );
    promise.catch(({ error }) => setState({showMongoConnectionValidationErrors: error !== 'Warnings'}));
    return promise;
  }}
  onClose={closeModalWithConnectionString}
  type={Modal.Types.DANGER}
  submitText={state.migrationWarnings && state.migrationWarnings.length > 0 ? 'Change anyway' : 'Change connection string'}
  inProgressText={'Changing\u2026'}
  showErrors={state.showMongoConnectionValidationErrors}
  width={900}
  clearFields={() => setState({
    migrationMongoURL: '',
    migrationWarnings: [],
  })}>
  <Field
    labelWidth={40}
    label={<Label
      text='Your database connection string'
      description='Specify a valid mongo connection string.' />}
    input={<TextInput
      placeholder='mongodb://...'
      value={state.newConnectionString}
      onChange={value => setState({
        newConnectionString: value,
        migrationWarnings: [],
        showMongoConnectionValidationErrors: false,
      })} />} />
  {state.migrationWarnings.map(warning => <FormNote key={warning}show={true} color='orange'>{warning}</FormNote>)}
</FormModal>

export const closeModalWithConnectionString = (setState) => setState({
  showChangeConnectionStringModal: false,
  showMigrateAppModal: false,
  showMongoConnectionValidationErrors: false,
  migrationWarnings: [],
});
