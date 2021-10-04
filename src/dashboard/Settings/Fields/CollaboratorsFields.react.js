import React          from 'react';
import Collaborators  from 'dashboard/Settings/Collaborators.react';

export const CollaboratorsFields = ({
  collaborators,
  waiting_collaborators,
  ownerEmail,
  viewerEmail,
  addCollaborator,
  removeCollaborator,
  editCollaborator,
}) => <Collaborators
  legend='Collaborators'
  description='Team up and work together with other people.'
  collaborators={collaborators}
  waiting_collaborators={waiting_collaborators}
  owner_email={ownerEmail}
  viewer_email={viewerEmail}
  onAdd={addCollaborator}
  onRemove={removeCollaborator}
  onEdit={editCollaborator} />;
