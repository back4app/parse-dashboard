export default ({ Modal, validateAndSubmitConnectionString, closeModalWithConnectionString, state, setState, context, history, getSiteDomain }) => <FormModal
title='Migrate app'
subtitle='Begin migrating data to your own database.'
icon='gear-solid'
iconSize={30}
type={Modal.Types.DANGER}
open={state.showMigrateAppModal}
submitText={state.migrationWarnings && state.migrationWarnings.length > 0 ? 'Migrate anyway' : 'Begin the migration'}
inProgressText={'Beginning the migration\u2026'}
showErrors={state.showMongoConnectionValidationErrors}
width={900}
onSubmit={() => {
  let promise = validateAndSubmitConnectionString(
    state.migrationMongoURL,
    state.migrationWarnings,
    warnings => setState({migrationWarnings: warnings}),
    connectionString => context.beginMigration(connectionString)
  );
  promise.catch(({ error }) => setState({showMongoConnectionValidationErrors: error !== 'Warnings'}));
  return promise;
}}
onClose={closeModalWithConnectionString}
onSuccess={() => history.push(`/apps/${context.slug}/migration`)}
clearFields={() => setState({
  migrationMongoURL: '',
  migrationWarnings: [],
})}>
<Field
  labelWidth={40}
  label={<Label
    text='Your database connection string.'
    description={<span>This database must be prepared to handle all of your app's queries and data. Read <a href={getSiteDomain() + '/docs/server/guide#migrating'}>our migration guide</a> to learn how to create a database.</span>} />
  }
  input={<TextInput
    height={100}
    placeholder='mongodb://...'
    value={state.migrationMongoURL}
    onChange={value => setState({
      migrationMongoURL: value,
      migrationWarnings: [],
      showMongoConnectionValidationErrors: false,
    })} />} />
{state.migrationWarnings.map(warning => <FormNote key={warning} show={true} color='orange'>{warning}</FormNote>)}
</FormModal>
