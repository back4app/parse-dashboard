import React          from 'react';
import Collaborators  from 'dashboard/Settings/Collaborators.react';
import PropTypes  from 'lib/PropTypes';

export const CollaboratorsFields = ({
  collaborators,
  waiting_collaborators,
  permissions,
  ownerEmail,
  viewerEmail,
  addCollaborator,
  removeCollaborator,
  editCollaborator,
  limitReached,
  maxCollaborators
}) => {
  return <Collaborators
    legend='Collaborators'
    description='Team up and work together with other people.'
    collaborators={collaborators}
    waiting_collaborators={waiting_collaborators}
    permissions={permissions}
    limitReached={limitReached}
    maxCollaborators={maxCollaborators}
    owner_email={ownerEmail}
    viewer_email={viewerEmail}
    onAdd={addCollaborator}
    onRemove={removeCollaborator}
    onEdit={editCollaborator} />
};

CollaboratorsFields.propTypes = {
  collaborators: PropTypes.arrayOf(PropTypes.object).isRequired,
  waiting_collaborators: PropTypes.any,
  permissions: PropTypes.object, 
  limitReached: PropTypes.number, 
  maxCollaborators: PropTypes.number, 
  ownerEmail: PropTypes.string,
  viewerEmail: PropTypes.viewerEmail,
  addCollaborator: PropTypes.func.isRequired,
  removeCollaborator: PropTypes.func.isRequired,
  editCollaborator: PropTypes.func.isRequired
};
