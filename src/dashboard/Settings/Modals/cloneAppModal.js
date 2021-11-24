export default ({ state, setState, AppsManager, }) => <FormModal
title='Clone App'
icon='files-outline'
iconSize={30}
subtitle='Create a copy of this app'
submitText='Clone'
inProgressText={'Cloning\u2026'}
open={state.showCloneAppModal}
enabled={state.cloneAppName.length > 0}
onSubmit={() => {
  setState({
    cloneAppMessage: '',
  });
  return AppsManager.cloneApp(this.context.currentApp.slug, this.state.cloneAppName, this.state.cloneOptionsSelection)
}}
onSuccess={({notice}) => setState({cloneAppMessage: notice})}
onClose={() => setState({showCloneAppModal: false})}
clearFields={() => setState({
  cloneAppName: '',
  cloneOptionsSelection: ['schema', 'app_settings', 'config', 'cloud_code'],
})}>
<Field
  labelWidth={50}
  label={<Label text='Name your cloned app' />}
  input={<TextInput
    value={state.cloneAppName}
    onChange={value => setState({cloneAppName: value})
  } /> } />
<Field
  labelWidth={35}
  label={<Label text='What should we include in the clone?' />}
  input={<MultiSelect
    fixed={true}
    value={state.cloneOptionsSelection}
    onChange={options => setState({cloneOptionsSelection: options})}
  >
    <MultiSelectOption value='schema'>Schema</MultiSelectOption>
    <MultiSelectOption value='app_settings'>App Settings</MultiSelectOption>
    <MultiSelectOption value='config'>Config</MultiSelectOption>
    <MultiSelectOption value='cloud_code'>Cloud Code</MultiSelectOption>
    <MultiSelectOption value='background_jobs'>Background Jobs</MultiSelectOption>
  </MultiSelect>} />
</FormModal>
