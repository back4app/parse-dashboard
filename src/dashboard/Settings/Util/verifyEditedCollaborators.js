export const verifyEditedCollaborators = (modified) => {
  let editedCollabs = []
  modified.forEach((modifiedCollab) => {
    if (modifiedCollab.isEdited) editedCollabs.push(modifiedCollab);
  })
  return editedCollabs;
}
