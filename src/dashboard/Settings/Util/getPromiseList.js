import { compareCollaborators,
  verifyEditedCollaborators }            from ".";
import unique                            from 'lib/unique';
import pluck                             from 'lib/pluck';
import {
  defaultParseOptions
}                                        from 'dashboard/Settings/Fields/Constants';
import deepmerge  from 'deepmerge';

export const getPromiseList = ({ changes, setDifference, initialFields, app, promiseCallback }) => {
  let promiseList = [];
  console.log('parseOptions updated');
  if (changes.requestLimit !== undefined) {
    promiseList.push(app.setRequestLimit(changes.requestLimit));
  }
  if (changes.appName !== undefined || changes.parseOptions !== undefined || changes.clientPush !== undefined || changes.clientClassCreation !== undefined ) {
    let settings = {};
    if ( changes.clientPush !== undefined ) {
      settings.clientPush = changes.clientPush
    }
    if ( changes.clientClassCreation !== null ) {
      settings.clientClassCreation = changes.clientClassCreation
    }
    promiseList.push(app.setAppConfig(
      changes.appName,
      deepmerge(defaultParseOptions, changes.parseOptions || {}),
      settings
    ));
  }
  if (changes.inProduction !== undefined) {
    promiseList.push(app.setInProduction(changes.inProduction));
  }
  let removedCollaborators;
  if (changes.collaborators !== undefined) {
    let addedCollaborators = setDifference(changes.collaborators, initialFields.collaborators, compareCollaborators);
    addedCollaborators.forEach(({ userEmail, featuresPermission, classesPermission }) => {
      promiseList.push(app.addCollaborator(userEmail, featuresPermission, classesPermission));
    });

    removedCollaborators = setDifference(initialFields.collaborators, changes.collaborators, compareCollaborators);
    removedCollaborators.forEach(({ id }) => {
      promiseList.push(app.removeCollaboratorById(id));
    });

    let editedCollaborators = verifyEditedCollaborators(changes.collaborators);
    editedCollaborators.forEach(({ id, featuresPermission, classesPermission }) => {
      promiseList.push(app.editCollaboratorById(id, featuresPermission, classesPermission));
    });
  }

  let urlKeys = {
    iTunesURL: 'ios',
    googlePlayURL: 'android',
    windowsAppStoreURL: 'win',
    webAppURL: 'web',
    otherURL: 'other',
  }

  Object.keys(urlKeys).forEach(key => {
    if (changes[key] !== undefined) {
      promiseList.push(app.setAppStoreURL(urlKeys[key], changes[key]));
    }
  });
  return Promise.all(promiseList).then(() => promiseCallback({ removedCollaborators })).catch(errors => {
    return Promise.reject({ error: unique(pluck(errors, 'error')).join(' ')});
  });
}
