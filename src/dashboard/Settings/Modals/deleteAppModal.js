export default ({
  Modal, state, AppsManager, context, setState, history, passwordField
}) => <FormModal
title='Delete App'
icon='trash-solid'
iconSize={30}
subtitle='This is an irreversible action!'
type={Modal.Types.DANGER}
open={state.showDeleteAppModal}
submitText='Permanently delete this app'
inProgressText={'Deleting\u2026'}
enabled={state.password.length > 0}
onSubmit={() => AppsManager.deleteApp(context.currentApp.slug, state.password)}
onSuccess={() => history.push('/apps')}
onClose={() => setState({showDeleteAppModal: false})}
clearFields={() => setState({password: ''})}>
{passwordField}
</FormModal>
