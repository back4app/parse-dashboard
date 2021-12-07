import { compareCollaborators } from "dashboard/Settings/Util/compareCollaborators";

export const generalFieldsOptions = {
  requestLimit: {
    friendlyName: 'request limit',
    showTo: true,
    showFrom: true,
  },
  appName: {
    friendlyName: 'app name',
    showTo: true,
  },
  parseOptions: {
    friendlyName: 'Parse Options',
    showTo: false,
    type: 'json'
  },
  clientPush: {
    friendlyName: 'Client Push',
    showTo: false,
    type: 'boolean'
  },
  clientClassCreation: {
    friendlyName: 'Client Class Creation',
    showTo: false,
    type: 'boolean'
  },
  //TODO: This will display 'enabled production' or 'disabled production' which is sub-optimal. Try to make it better.
  inProduction: {
    friendlyName: 'production',
    type: 'boolean',
  },
  collaborators: {
    friendlyName: 'collaborator',
    friendlyNamePlural: 'collaborators',
    type: 'set',
    equalityPredicate: compareCollaborators,
  },
  iTunesURL: {
    friendlyName: 'iTunes URL',
  },
  googlePlayURL: {
    friendlyName: 'Play Store URL',
  },
  windowsAppStoreURL: {
    friendlyName: 'Windows App Store URL',
  },
  webAppURL: {
    friendlyName: 'web URL',
  },
  otherURL: {
    friendlyName: 'other URL',
  },
};
