export default ({ Modal, joinWithFinal }) => <Modal
title='Check Master Key Access'
icon='keys-solid'
type={Modal.Types.DANGER}
showCancel={false}
confirmText='Got it!'
onConfirm={() => this.setState({removedCollaborators: []})}
buttonsInCenter={true}
textModal={true}>
<span>We have removed <strong>{joinWithFinal('', this.state.removedCollaborators.map(c => c.userName || c.userEmail), ', ', ' and ')}</strong> from this app. If they had saved the master key, they may still have access via an SDK or the API. To be sure, you can reset your master key in the Keys section of app settings.</span>
</Modal>;
