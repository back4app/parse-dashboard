import { compareCollaborators,
  verifyEditedCollaborators }            from ".";
import unique                            from 'lib/unique';
import pluck                             from 'lib/pluck';
import {
  defaultParseOptions
}                                        from 'dashboard/Settings/Fields/Constants';

export const getPromiseList = ({ changes, setDifference, initialFields }) => {
  let promiseList = [];
  if (changes.requestLimit !== undefined) {
    promiseList.push(this.context.currentApp.setRequestLimit(changes.requestLimit));
  }
  if (changes.appName !== undefined || changes.parseOptions !== undefined ) {
    const parseOptions = {...typeof changes.parseOptions == 'string' ? JSON.parse(changes.parseOptions) : {} };
    promiseList.push(this.context.currentApp.setAppConfig(changes.appName,
      { accountLockout: {...defaultParseOptions.accountLockout, ...parseOptions.accountLockout}, passwordPolicy: { ...defaultParseOptions.passwordPolicy, ...parseOptions.passwordPolicy }}
    ));
  }
  if (changes.inProduction !== undefined) {
    promiseList.push(this.context.currentApp.setInProduction(changes.inProduction));
  }
  let removedCollaborators;
  if (changes.collaborators !== undefined) {
    let addedCollaborators = setDifference(changes.collaborators, initialFields.collaborators, compareCollaborators);
    addedCollaborators.forEach(({ userEmail, featuresPermission, classesPermission }) => {
      promiseList.push(this.context.currentApp.addCollaborator(userEmail, featuresPermission, classesPermission));
    });

    removedCollaborators = setDifference(initialFields.collaborators, changes.collaborators, compareCollaborators);
    removedCollaborators.forEach(({ id }) => {
      promiseList.push(this.context.currentApp.removeCollaboratorById(id));
    });

    let editedCollaborators = verifyEditedCollaborators(changes.collaborators);
    editedCollaborators.forEach(({ id, featuresPermission, classesPermission }) => {
      promiseList.push(this.context.currentApp.editCollaboratorById(id, featuresPermission, classesPermission));
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
      promiseList.push(this.context.currentApp.setAppStoreURL(urlKeys[key], changes[key]));
    }
  });
  return Promise.all(promiseList).then(() => {
    this.forceUpdate(); //Need to forceUpdate to see changes applied to source ParseApp
    this.setState({ removedCollaborators: removedCollaborators || [] });
  }).catch(errors => {
    return Promise.reject({ error: unique(pluck(errors, 'error')).join(' ')});
  });
}
