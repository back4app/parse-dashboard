/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import * as AJAX from 'lib/AJAX';
import encodeFormData from 'lib/encodeFormData';
import Parse from 'parse';
import axios from 'lib/axios';
import csv from 'csvtojson';
// import * as CSRFManager from 'lib/CSRFManager';
import deepmerge from 'deepmerge';
import { updatePreferences, getPreferences } from 'lib/ClassPreferences';

function setEnablePushSource(setting, enable) {
  const path = `/apps/${this.slug}/update_push_notifications`;
  const attr = `parse_app[${setting}]`;
  const body = {};
  body[attr] = enable ? 'true' : 'false';
  const promise = AJAX.put(path, body);
  promise.then(() => {
    this.settings.fields.fields[setting] = enable;
  });
  return promise;
}

export default class ParseApp {
  constructor({
    appName,
    parseOptions,
    created_at,
    clientKey,
    appId,
    appNameForURL,
    dashboardURL,
    javascriptKey,
    masterKey,
    restKey,
    windowsKey,
    webhookKey,
    apiKey,
    serverURL,
    serverInfo,
    production,
    iconName,
    primaryBackgroundColor,
    secondaryBackgroundColor,
    supportedPushLocales,
    feedbackEmail,
    custom,
    preventSchemaEdits,
    graphQLServerURL,
    columnPreference,
    databaseURL,
    scripts,
    classPreference,
    enableSecurityChecks,
    useLatestDashboardVersion,
    parseVersion,
    databaseType
  }) {
    this.name = appName;
    this.parseOptions = parseOptions;
    this.feedbackEmail = feedbackEmail;
    this.createdAt = created_at ? new Date(created_at) : new Date();
    this.applicationId = appId;
    this.slug = appNameForURL || appName;
    if (!this.slug && dashboardURL) {
      const pieces = dashboardURL.split('/');
      this.slug = pieces[pieces.length - 1];
    }
    this.clientKey = clientKey;
    this.javascriptKey = javascriptKey;
    this.masterKey = masterKey;
    this.restKey = restKey;
    this.windowsKey = windowsKey;
    this.webhookKey = webhookKey;
    this.fileKey = apiKey;
    this.production = production;
    this.serverURL = serverURL;
    this.serverInfo = serverInfo;
    this.icon = iconName;
    this.primaryBackgroundColor = primaryBackgroundColor;
    this.secondaryBackgroundColor = secondaryBackgroundColor;
    this.supportedPushLocales = supportedPushLocales ? supportedPushLocales : [];
    this.custom = custom;
    this.preventSchemaEdits = preventSchemaEdits || false;
    this.graphQLServerURL = graphQLServerURL;
    this.columnPreference = columnPreference;
    this.databaseURL = databaseURL;
    this.scripts = scripts;
    this.enableSecurityChecks = !!enableSecurityChecks;
    this.useLatestDashboardVersion = useLatestDashboardVersion !== false;
    this.parseVersion = parseVersion;
    this.databaseType = databaseType;

    if (!supportedPushLocales) {
      console.warn('Missing push locales for \'' + appName + '\', see this link for details on setting localizations up. https://github.com/parse-community/parse-dashboard#configuring-localized-push-notifications');
    }

    if (!supportedPushLocales) {
      console.warn(
        'Missing push locales for \'' +
          appName +
          '\', see this link for details on setting localizations up. https://github.com/parse-community/parse-dashboard#configuring-localized-push-notifications'
      );
    }

    this.settings = {
      fields: {},
      lastFetched: new Date(0),
    };

    this.latestRelease = {
      release: null,
      lastFetched: new Date(0),
    };

    this.jobStatus = {
      status: null,
      lastFetched: new Date(0),
    };

    this.classCounts = {
      counts: {},
      lastFetched: {},
    };

    this.hasCheckedForMigraton = false;

    if (classPreference) {
      for (const className in classPreference) {
        const preferences = getPreferences(appId, className) || { filters: [] };
        const { filters } = classPreference[className];
        for (const filter of filters) {
          if (Array.isArray(filter.filter)) {
            filter.filter = JSON.stringify(filter.filter);
          }
          if (preferences.filters.some(row => JSON.stringify(row) === JSON.stringify(filter))) {
            continue;
          }
          preferences.filters.push(filter);
        }
        updatePreferences(preferences, appId, className);
      }
    }
  }

  setParseKeys() {
    Parse.serverURL = this.serverURL;
    Parse._initialize(this.applicationId, this.javascriptKey, this.masterKey);
  }

  apiRequest(method, path, params, options) {
    this.setParseKeys();
    return Parse._request(method, path, params, options);
  }

  /**
   * Fetches scriptlogs from api.parse.com
   * lines - maximum number of lines to fetch
   * since - only fetch lines since this Date
   */
  getLogs(level, since) {
    const path =
      'scriptlog?level=' +
      encodeURIComponent(level.toLowerCase()) +
      '&n=100' +
      (since ? '&startDate=' + encodeURIComponent(since.getTime()) : '');
    return this.apiRequest('GET', path, {}, { useMasterKey: true });
  }

  /**
   * Fetches source of a Cloud Code hosted file from api.parse.com
   * fileName - the name of the file to be fetched
   */
  getSource(fileName) {
    return this.getLatestRelease()
      .then(release => {
        if (release.files === null) {
          // No release yet
          return Promise.resolve(null);
        }

        const fileMetaData = release.files[fileName];
        if (fileMetaData && fileMetaData.source) {
          return Promise.resolve(fileMetaData.source);
        }

        const params = {
          version: fileMetaData.version,
          checksum: fileMetaData.checksum,
        };
        return this.apiRequest('GET', `scripts/${fileName}`, params, {
          useMasterKey: true,
        });
      })
      .then(source => {
        if (this.latestRelease.files) {
          this.latestRelease.files[fileName].source = source;
        }

        return Promise.resolve(source);
      });
  }

  getLatestRelease() {
    // Cache it for a minute
    if (new Date() - this.latestRelease.lastFetched < 60000) {
      return Promise.resolve(this.latestRelease);
    }
    return this.apiRequest('GET', 'releases/latest', {}, { useMasterKey: true }).then(release => {
      this.latestRelease.lastFetched = new Date();
      this.latestRelease.files = null;

      if (release.length === 0) {
        this.latestRelease.release = null;
      } else {
        const latestRelease = release[0];

        this.latestRelease.release = {
          version: latestRelease.version,
          parseVersion: latestRelease.parseVersion,
          deployedAt: new Date(latestRelease.timestamp),
        };

        let checksums = JSON.parse(latestRelease.checksums);
        let versions = JSON.parse(latestRelease.userFiles);
        this.latestRelease.files = {};

        // The scripts can be in `/` or in `/cloud`. Let's check for both.
        if (checksums.cloud) {
          checksums = checksums.cloud;
        }
        if (versions.cloud) {
          versions = versions.cloud;
        }
        for (const c in checksums) {
          this.latestRelease.files[c] = {
            checksum: checksums[c],
            version: versions[c],
            source: null,
          };
        }
      }

      return Promise.resolve(this.latestRelease);
    });
  }

  getClassCount(className) {
    this.setParseKeys();
    if (this.classCounts.counts[className] !== undefined) {
      // Cache it for a minute
      if (new Date() - this.classCounts.lastFetched[className] < 60000) {
        return Promise.resolve(this.classCounts.counts[className]);
      }
    }
    const p = new Parse.Query(className).count({ useMasterKey: true });
    p.then(count => {
      this.classCounts.counts[className] = count;
      this.classCounts.lastFetched[className] = new Date();
    });
    return p;
  }

  getRelationCount(relation) {
    this.setParseKeys();
    const p = relation.query().count({ useMasterKey: true });
    return p;
  }

  getAnalyticsRetention(time) {
    time = Math.round(time.getTime() / 1000);
    return AJAX.abortableGet('/apps/' + this.slug + '/analytics_retention?at=' + time);
  }

  getAnalyticsOverview(time) {
    time = Math.round(time.getTime() / 1000);
    const audiencePromises = [
      'daily_users',
      'weekly_users',
      'monthly_users',
      'total_users',
      'daily_installations',
      'weekly_installations',
      'monthly_installations',
      'total_installations',
    ].map(activity => {
      const res = AJAX.abortableGet(
        '/apps/' +
          this.slug +
          '/analytics_content_audience?at=' +
          time +
          '&audienceType=' +
          activity
      );
      let promise = res.promise;
      const xhr = res.xhr;
      promise = promise.then(result =>
        result.total === undefined ? result.content : result.total
      );
      return { xhr, promise };
    });

    const billingPromises = [
      'billing_file_storage',
      'billing_database_storage',
      'billing_data_transfer',
    ].map(billing => AJAX.abortableGet('/apps/' + this.slug + '/' + billing));

    const allPromises = audiencePromises.concat(billingPromises);

    return {
      dailyActiveUsers: allPromises[0],
      weeklyActiveUsers: allPromises[1],
      monthlyActiveUsers: allPromises[2],
      totalUsers: allPromises[3],
      dailyActiveInstallations: allPromises[4],
      weeklyActiveInstallations: allPromises[5],
      monthlyActiveInstallations: allPromises[6],
      totalInstallations: allPromises[7],
      billingFileStorage: allPromises[8],
      billingDatabasetorage: allPromises[9],
      billingDataTransfer: allPromises[10],
    };
  }

  getAnalyticsTimeSeries(query) {
    const path = '/apps/' + this.slug + '/analytics?' + encodeFormData(null, query);
    let { promise } = AJAX.abortableGet(path);
    const { xhr } = AJAX.abortableGet(path);
    promise = promise.then((requested_data) => requested_data);
    return { promise, xhr };
  }

  getAnalyticsSlowQueries({path, method, respStatus, respTime, from, to, distinct}) {
    const appsPath = 'parse-app';
    // eslint-disable-next-line no-undef
    const urlPrefix = `${b4aSettings.BACK4APP_API_PATH}/${appsPath}/${this.slug}/slow_requests?`;

    const url = urlPrefix + encodeFormData(null, {
      path: path || '',
      method: method || '',
      status: respStatus || '',
      time: respTime || '',
      distinct: distinct || '',
      from: from.getTime() / 1000,
      to: to.getTime() / 1000
    });
    let { promise } = AJAX.abortableGet(url);
    const { xhr } = AJAX.abortableGet(url);
    promise = promise.then(({ result }) => result);

    return { promise, xhr };
  }

  getAppleCerts() {
    const path = '/apps/' + this.slug + '/apple_certificates';
    return AJAX.get(path).then(({ certs }) => certs);
  }

  uploadAppleCert(file) {
    const path = '/apps/' + this.slug + '/dashboard_ajax/push_certificate';
    const data = new FormData();
    data.append('new_apple_certificate', file);
    return AJAX.post(path, data).then(({ cert }) => cert);
  }

  deleteAppleCert(id) {
    const path = '/apps/' + this.slug + '/apple_certificates/' + id;
    return AJAX.del(path);
  }

  uploadSSLPublicCertificate(file) {
    const path = '/apps/' + this.slug + '/update_hosting_certificates';
    const data = new FormData();
    data.append('new_hosting_certificate[certificate_data]', file);
    return AJAX.put(path, data);
  }

  uploadSSLPrivateKey(file) {
    const path = '/apps/' + this.slug + '/update_hosting_certificates';
    const data = new FormData();
    data.append('new_hosting_certificate[key_data]', file);
    return AJAX.put(path, data);
  }

  saveSettingsFields(fields) {
    const path = '/apps/' + this.slug;
    const appFields = {};
    for (const f in fields) {
      appFields['parse_app[' + f + ']'] = fields[f];
    }
    const promise = AJAX.put(path, appFields);
    promise.then(({ successes }) => {
      for (const f in fields) {
        this.settings.fields[f] = successes[f];
      }
    });
    return promise;
  }

  async fetchSettingsFields() {
    // Cache it for a minute
    if (new Date() - this.settings.lastFetched < 60000) {
      return Promise.resolve(this.settings.fields);
    }
    const path = '/apps/' + this.slug + '/dashboard_ajax/settings';
    let fields = await axios.get(path);
    fields = fields.data;
    for (const f in fields) {
      this.settings.fields[f] = fields[f];
      this.settings.lastFetched = new Date();
    }
    return fields;
  }

  cleanUpFiles() {
    const path = '/apps/' + this.slug + '/orphan_files';
    return AJAX.post(path);
  }

  restartApp() {
    const path = `/parse-app/${this.slug}/restart`;
    return AJAX.post(path);
  }

  transferApp(newOwner) {
    const path = `/parse-app/${this.slug}/transfer`;
    return AJAX.post(path, { newOwner });
  }

  supportedParseServerVersions() {
    const path = '/parse-version';
    return AJAX.get(path);
  }

  checkStorage() {
    const path = `/parse-app/${this.slug}/check-storage`;
    return AJAX.post(path);
  }

  createApp(appName, parseVersion, originalAppId = null) {
    const path = '/parse-app';
    return AJAX.post(path, { appDescription: '', parseVersion, originalAppId: originalAppId, appId: null, appName, isPublic: false })
  }

  initializeDb(appId, parseVersion) {
    const path = `/parse-app/${appId}/database`;
    return AJAX.post(path, { parseVersion: parseVersion })
  }

  async cloneApp(appId, parseVersion, cloneType, cloneCloudCode = false, cloneConfigs = false) {
    const path = `/parse-app/${this.slug}/clone`;
    return AJAX.post(path, { appId, parseVersion, cloneType, cloneCloudCode, cloneConfigs })
  }

  async deleteApp(appId) {
    const path = `/parse-app/${appId || this.slug}`;
    return AJAX.del(path);
  }

  cleanUpSystemLog() {
    const path = '/parse-app/' + this.slug + '/purge-logs';
    return AJAX.post(path);
  }

  normalizePath(path) {
    path = path.replace(/([^:\s])\/+/g, '$1/');
    return path;
  }

  async transformCSVtoJSON(file, className) {
    let text;
    await (new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => {
        text = reader.result;
        resolve();
      };
      reader.readAsText(file);
    }));

    let fieldNames;
    let jsonArray;

    if (className) {
      const schema = await (new Parse.Schema(className)).get();

      const customParser = {};
      Object.keys(schema.fields).forEach(fieldName => {
        customParser[fieldName] = function (item) {
          if (schema.fields[fieldName].type === 'Number') {return Number(item);}
          if (schema.fields[fieldName].type === 'Boolean') {return item.toLowerCase() === 'false' ? false :  true;}
          if (schema.fields[fieldName].type === 'Array'){
            item = item.replaceAll('“', '"');
            item = item.replaceAll('”', '"');
            return JSON.parse(item);
          }
          if (schema.fields[fieldName].type === 'Object'){
            item = item.replaceAll('“', '"');
            item = item.replaceAll('”', '"');
            return JSON.parse(item);
          }
          return item;
        };
      });

      jsonArray = await csv({
        delimiter: 'auto',
        ignoreEmpty: true,
        nullObject: true,
        checkType: true,
        colParser: customParser
      })
        .on('header', header => (fieldNames = header))
        .fromString(text);

      const fields = fieldNames.filter(fieldName => fieldName.indexOf('.') < 0).reduce((fields, fieldName) => ({
        ...fields,
        [fieldName]: schema.fields[fieldName] || { type: undefined }
      }), {});

      jsonArray.forEach(json => {
        Object.keys(json).forEach(fieldName => {
          const fieldValue = json[fieldName];
          const field = fields[fieldName];
          if (fieldValue === null || fieldValue === undefined || !field) {
            return;
          }
          const fieldType = field.type;
          if (fieldType === 'String') {
            json[fieldName] = fieldValue.toString();
          } else if (fieldType === undefined) {
            const fieldDataType = field.dataType;
            if (fieldDataType === 'string') {
              json[fieldName] = fieldValue.toString();
            } else if (fieldDataType === undefined) {
              field.dataType = typeof fieldValue;
              field.parsedFieldNames = [fieldName];
            } else if (fieldDataType === typeof fieldValue) {
              field.parsedFieldNames.push(fieldName);
            } else {
              field.dataType = 'string';
              json[fieldName] = fieldValue.toString();
              field.parsedFieldNames.forEach(parsedFieldName => json[parsedFieldName] = json[parsedFieldName].toString());
              field.parsedFieldNames = undefined;
            }
          }
        });
      });
    } else{
      jsonArray = await csv({
        delimiter: 'auto',
        ignoreEmpty: true,
        nullObject: true,
        checkType: true
      })
        .on('header', header => (fieldNames = header))
        .fromString(text);
    }

    return new Blob([JSON.stringify({ results: jsonArray })], { type: 'text/plain' });
  }

  async importData(className, file) {
    if (file.name.endsWith('.csv')) {
      file = await this.transformCSVtoJSON(file, className);
    }

    const path = this.normalizePath(this.serverURL + '/import_data/' + className);
    const formData = new FormData();
    formData.append('importFile', file);
    if (this.feedbackEmail) {
      formData.append('feedbackEmail', this.feedbackEmail);
    }
    const options = {
      method: 'POST',
      headers: {
        'X-Parse-Application-Id': this.applicationId,
        'X-Parse-Master-Key': this.masterKey
      },
      body: formData
    }
    // if is GDPR
    if (this.custom && this.custom.isGDPR) {options.credentials = 'include'}
    return fetch(path, options);
  }

  async importRelationData(className, relationName,  file) {
    if (file.name.endsWith('.csv')) {
      file = await this.transformCSVtoJSON(file);
    }

    const path = this.normalizePath(this.serverURL + '/import_relation_data/' + className + '/' + relationName);
    const formData = new FormData();
    formData.append('importFile', file);
    if (this.feedbackEmail) {
      formData.append('feedbackEmail', this.feedbackEmail);
    }
    const options = {
      method: 'POST',
      headers: {
        'X-Parse-Application-Id': this.applicationId,
        'X-Parse-Master-Key': this.masterKey
      },
      body: formData
    }
    // if is GDPR
    if (this.custom && this.custom.isGDPR) {options.credentials = 'include'}
    return fetch(path, options);
  }

  exportData() {
    const path = '/apps/' + this.slug + '/export_data';
    return AJAX.put(path);
  }

  resetMasterKey(password) {
    const path = '/apps/' + this.slug + '/reset_master_key';
    return AJAX.post(path, {
      password_confirm_reset_master_key: password,
    }).then(({ new_key }) => {
      this.masterKey = new_key;
      return Promise.resolve();
    });
  }

  clearCollection(className) {
    if (this.serverInfo.parseServerVersion == 'Parse.com') {
      const path = `/apps/${this.slug}/collections/${className}/clear`;
      return AJAX.del(path);
    } else {
      const path = `purge/${className}`;
      return this.apiRequest('DELETE', path, {}, { useMasterKey: true });
    }
  }

  validateCollaborator(email) {
    const path =
      '/apps/' + this.slug + '/collaborations/validate?email=' + encodeURIComponent(email);
    return AJAX.get(path);
  }

  sendEmailToInviteCollaborator(email, featuresPermission, classesPermission, owner) {
    const path = '/apps/' + this.slug + '/collaborations/saveInvite';
    const promise = axios.post(path, {email: email, featuresPermission: featuresPermission, classesPermission: classesPermission, owner: owner});
    return promise;
  }

  editInvitePermissionCollaborator(email, featuresPermission, classesPermission, owner) {
    const path = '/apps/' + this.slug + '/collaborations/editInvite';
    const promise = axios.post(path, {email: email, featuresPermission: featuresPermission, classesPermission: classesPermission, owner: owner});
    return promise;
  }

  removeInviteCollaborator(email) {
    const path = '/apps/' + this.slug + '/collaborations/removeInvite/' + encodeURIComponent(email);
    const promise = AJAX.del(path)
    return promise;
  }

  fetchPushSubscriberCount(audienceId, query) {
    let promise;
    if (audienceId === 'everyone') {
      query = {};
    }
    if (!query) {
      promise = new Parse.Query('_Audience')
        .get(audienceId, { useMasterKey: true })
        .then(function (audience) {
          return Parse.Query.fromJSON('_Installation', {
            where: audience.get('query'),
          }).count({ useMasterKey: true });
        });
    } else {
      promise = Parse.Query.fromJSON('_Installation', { where: query }).count({
        useMasterKey: true,
      });
    }
    return {
      xhr: undefined,
      promise: promise.then(function (count) {
        return { count: count };
      }),
    };
  }

  fetchPushNotifications(type, page, limit) {
    const query = new Parse.Query('_PushStatus');
    if (type != 'all') {
      query.equalTo('source', type || 'rest');
    }
    query.skip(page * limit);
    query.limit(limit);
    query.descending('createdAt');
    return query.find({ useMasterKey: true });
  }

  fetchPushAudienceSizeSuggestion() {
    const path = '/apps/' + this.slug + '/push_notifications/audience_size_suggestion';
    return AJAX.get(path);
  }

  fetchPushDetails(objectId) {
    const query = new Parse.Query('_PushStatus');
    query.equalTo('objectId', objectId);
    return query.first({ useMasterKey: true });
  }

  isLocalizationAvailable() {
    return !!this.serverInfo.features.push.localization;
  }

  fetchPushLocales() {
    return this.supportedPushLocales;
  }

  fetchPushLocaleDeviceCount(audienceId, where, locales) {
    let path = '/apps/' + this.slug + '/push_subscriber_translation_count';
    let urlsSeparator = '?';
    path += `?where=${encodeURI(JSON.stringify(where || {}))}`;
    path += `&locales=${encodeURI(JSON.stringify(locales))}`;
    urlsSeparator = '&';
    return AJAX.abortableGet(audienceId ? `${path}${urlsSeparator}audienceId=${audienceId}` : path);
  }

  fetchAvailableDevices() {
    const path = '/apps/' + this.slug + '/dashboard_ajax/available_devices';
    return AJAX.get(path);
  }

  removeCollaboratorById(id) {
    const path = '/apps/' + this.slug + '/collaborations/' + id.toString();
    const promise = AJAX.del(path);
    promise.then(() => {
      //TODO: this currently works because everything that uses collaborators
      // happens to re-render after this call anyway, but really the collaborators
      // should be updated properly in a store or AppsManager or something
      this.settings.fields.fields.collaborators = this.settings.fields.fields.collaborators.filter(
        c => c.id != id
      );
    });
    return promise;
  }

  editCollaboratorById(id, featuresPermission, classesPermission) {
    const path = '/apps/' + this.slug + '/collaborations/edit/' + id.toString();
    const promise = axios.post(path, { featuresPermission, classesPermission })
    promise.then(() => {
      //TODO: this currently works because everything that uses collaborators
      // happens to re-render after this call anyway, but really the collaborators
      // should be updated properly in a store or AppsManager or something
      this.settings.fields.fields.collaborators = Array.isArray(this.settings.fields.fields.collaborators) && this.settings.fields.fields.collaborators.map(c => {
        if (c.id === id) {
          c.featuresPermission = featuresPermission
          c.classesPermission = classesPermission
        }
        return c
      }) || [];
    });
    return promise;
  }

  addCollaborator(email, featuresPermission, classesPermission) {
    const path = '/apps/' + this.slug + '/collaborations';
    const promise = axios.post(path, {'collaboration[email]': email, featuresPermission, classesPermission});
    promise.then(({ data }) => {
      //TODO: this currently works because everything that uses collaborators
      // happens to re-render after this call anyway, but really the collaborators
      // should be updated properly in a store or AppsManager or something
      this.settings.fields.fields.collaborators =
        Array.isArray(this.settings.fields.fields.collaborators) ?
          this.settings.fields.fields.collaborators : [];
      this.settings.fields.fields.collaborators = [ ...this.settings.fields.fields.collaborators, data.data ];
    });
    return promise;
  }

  setRequestLimit(limit) {
    const path = '/plans/' + this.slug + '?new_limit=' + limit.toString();
    const promise = AJAX.put(path);
    promise.then(() => {
      this.settings.fields.fields.pricing_plan.request_limit = limit;
    });
    return promise;
  }

  setAppConfig(name, parseOptions, appSettings, useLatestDashboardVersion) {
    let config = {};
    if (name) {config['appName'] = name;}
    if (parseOptions) {config['parseOptions'] = parseOptions;}
    if (appSettings) {config = { ...config, ...appSettings }}
    if (useLatestDashboardVersion !== undefined) {config['useLatestDashboardVersion'] = useLatestDashboardVersion;}
    // eslint-disable-next-line no-undef
    const path = `${b4aSettings.BACK4APP_API_PATH}/parse-app/${this.slug}`;
    const promise = axios.patch(path, config, { withCredentials: true });
    promise.then(() => {
      if (name)
      {this.name = name;}
      if (appSettings) {
        this.settings.fields.fields = { ...this.settings.fields.fields, ...appSettings }
      }
      if(parseOptions) {
        this.settings.fields.fields.parseOptions = deepmerge(this.settings.fields.fields.parseOptions, parseOptions);
      }
      if (useLatestDashboardVersion !== undefined) {
        this.useLatestDashboardVersion = useLatestDashboardVersion;
      }
      if (useLatestDashboardVersion === false) {
        window.location.replace(`${b4aSettings.PARSE_DASHBOARD_PATH}/apps/${this.slug}`);
      }
    });
    return promise;
  }

  setAppStoreURL(type, url) {
    const path = '/apps/' + this.slug;
    const promise = AJAX.put(path, {
      ['parse_app[parse_app_metadata][url][' + type + ']']: url,
    });
    promise.then(() => {
      this.settings.fields.fields.urls.unshift({ platform: type, url: url });
    });
    return promise;
  }

  setInProduction(inProduction) {
    const path = '/apps/' + this.slug;
    const promise = AJAX.put(path, {
      'parse_app[parse_app_metadata][production]': inProduction ? 'true' : 'false',
    });
    promise.then(() => {
      this.production = inProduction;
    });
    return promise;
  }

  launchExperiment(objectId, formData) {
    const path = `/apps/${this.slug}/push_notifications/${objectId}/launch_experiment`;
    return AJAX.post(path, formData);
  }

  exportClass(className, where) {
    if (!where) {
      where = {};
    }
    const path = '/apps/' + this.slug + '/export_data';
    return AJAX.put(path, { name: className, where: where, feedbackEmail: this.feedbackEmail });
  }

  getExportProgress() {
    const path = '/apps/' + this.slug + '/export_progress';
    return AJAX.get(path);
  }

  getAvailableJobs() {
    const path = 'cloud_code/jobs/data';
    return this.apiRequest('GET', path, {}, { useMasterKey: true });
  }

  getJobStatus() {
    const query = new Parse.Query('_JobStatus');
    query.descending('createdAt');
    return query.find({ useMasterKey: true }).then(status => {
      status = status.map(jobStatus => {
        return jobStatus.toJSON();
      });
      this.jobStatus = {
        status: status || null,
        lastFetched: new Date(),
      };
      return status;
    });
  }

  runJob(job) {
    return Parse._request(
      'POST',
      'jobs',
      {
        description: 'Executing from job schedule web console.',
        input: JSON.parse(job.params || '{}'),
        jobName: job.jobName,
        when: 0,
      },
      { useMasterKey: true }
    );
  }

  getMigrations() {
    const path = '/apps/' + this.slug + '/migrations';
    const obj = AJAX.abortableGet(path);
    this.hasCheckedForMigraton = true;
    obj.promise
      .then(({ migration }) => {
        this.migration = migration;
      })
      .catch(() => {}); // swallow errors
    return obj;
  }

  beginMigration(connectionString) {
    this.hasCheckedForMigraton = false;
    const path = '/apps/' + this.slug + '/migrations';
    return AJAX.post(path, { connection_string: connectionString });
  }

  changeConnectionString(newConnectionString) {
    const path = '/apps/' + this.slug + '/change_connection_string';
    const promise = AJAX.post(path, { connection_string: newConnectionString });
    promise.then(() => {
      this.settings.fields.fields.opendb_connection_string = newConnectionString;
    });
    return promise;
  }

  stopMigration() {
    //We will need to pass the real ID here if we decide to have migrations deletable by id. For now, from the users point of view, there is only one migration per app.
    const path = '/apps/' + this.slug + '/migrations/0';
    return AJAX.del(path);
  }

  commitMigration() {
    //Migration IDs are not to be exposed, so pass 0 as ID and let rails fetch the correct ID
    const path = '/apps/' + this.slug + '/migrations/0/commit';
    //No need to update anything, UI will autorefresh once request goes through and mowgli enters FINISH/DONE state
    return AJAX.post(path);
  }

  setRequireRevocableSessions(require) {
    const path = '/apps/' + this.slug;
    const promise = AJAX.put(path, {
      'parse_app[require_revocable_session]': require ? 'true' : 'false',
    });
    promise.then(() => {
      //TODO: this currently works because everything that uses this
      // happens to re-render after this call anyway, but really this
      // should be updated properly in a store or AppsManager or something
      this.settings.fields.fields.require_revocable_session = require;
    });
    return promise;
  }

  setExpireInactiveSessions(require) {
    const path = '/apps/' + this.slug;
    const promise = AJAX.put(path, {
      'parse_app[expire_revocable_session]': require ? 'true' : 'false',
    });
    promise.then(() => {
      //TODO: this currently works because everything that uses this
      // happens to re-render after this call anyway, but really this
      // should be updated properly in a store or AppsManager or something
      this.settings.fields.fields.expire_revocable_session = require;
    });
    return promise;
  }

  setRevokeSessionOnPasswordChange(require) {
    const path = '/apps/' + this.slug;
    const promise = AJAX.put(path, {
      'parse_app[revoke_on_password_reset]': require ? 'true' : 'false',
    });
    promise.then(() => {
      //TODO: this currently works because everything that uses this
      // happens to re-render after this call anyway, but really this
      // should be updated properly in a store or AppsManager or something
      this.settings.fields.fields.revoke_on_password_reset = require;
    });
    return promise;
  }

  setEnableNewMethodsByDefault(require) {
    const path = '/apps/' + this.slug;
    const promise = AJAX.put(path, {
      'parse_app[auth_options_attributes][_enable_by_default_as_bool]': require ? 'true' : 'false',
    });
    promise.then(() => {
      //TODO: this currently works because everything that uses this
      // happens to re-render after this call anyway, but really this
      // should be updated properly in a store or AppsManager or something
      this.settings.fields.fields.auth_options_attributes._enable_by_default = require;
    });
    return promise;
  }

  setAllowUsernameAndPassword(require) {
    const path = '/apps/' + this.slug;
    const promise = AJAX.put(path, {
      'parse_app[auth_options_attributes][username_attributes][enabled_as_bool]': require
        ? 'true'
        : 'false',
    });
    promise.then(() => {
      //TODO: this currently works because everything that uses this
      // happens to re-render after this call anyway, but really this
      // should be updated properly in a store or AppsManager or something
      this.settings.fields.fields.auth_options_attributes.username.enabled = require;
    });
    return promise;
  }

  setAllowAnonymousUsers(require) {
    const path = '/apps/' + this.slug;
    const promise = AJAX.put(path, {
      'parse_app[auth_options_attributes][anonymous_attributes][enabled_as_bool]': require
        ? 'true'
        : 'false',
    });
    promise.then(() => {
      //TODO: this currently works because everything that uses this
      // happens to re-render after this call anyway, but really this
      // should be updated properly in a store or AppsManager or something
      this.settings.fields.fields.auth_options_attributes.anonymous.enabled = require;
    });
    return promise;
  }

  setAllowCustomAuthentication(require) {
    const path = '/apps/' + this.slug;
    const promise = AJAX.put(path, {
      'parse_app[auth_options_attributes][custom_attributes][enabled_as_bool]': require
        ? 'true'
        : 'false',
    });
    promise.then(() => {
      //TODO: this currently works because everything that uses this
      // happens to re-render after this call anyway, but really this
      // should be updated properly in a store or AppsManager or something
      this.settings.fields.fields.auth_options_attributes.custom.enabled = require;
    });
    return promise;
  }

  setConnectedFacebookApps(idList, secretList) {
    const path = '/apps/' + this.slug;
    const promise = AJAX.put(path, {
      'parse_app[auth_options_attributes][facebook_attributes][app_ids_as_list]': idList.join(','),
      'parse_app[auth_options_attributes][facebook_attributes][app_secrets_as_list]':
        secretList.join(','),
    });
    promise.then(() => {
      this.settings.fields.fields.auth_options_attributes.facebook.app_ids = idList;
      this.settings.fields.fields.auth_options_attributes.facebook.app_secrets = secretList;
    });
    return promise;
  }

  addConnectedFacebookApp(newId, newSecret) {
    const allIds = (
      this.settings.fields.fields.auth_options_attributes.facebook.app_ids || []
    ).concat(newId);
    const allSecrets = (
      this.settings.fields.fields.auth_options_attributes.facebook.app_secrets || []
    ).concat(newSecret);
    return this.setConnectedFacebookApps(allIds, allSecrets);
  }

  setAllowFacebookAuth(enable) {
    const path = '/apps/' + this.slug;
    const promise = AJAX.put(path, {
      'parse_app[auth_options_attributes][facebook_attributes][enabled_as_bool]': enable
        ? 'true'
        : 'false',
    });
    promise.then(() => {
      this.settings.fields.fields.auth_options_attributes.facebook.enabled = !!enable;
    });
    return promise;
  }

  setConnectedTwitterApps(consumerKeyList) {
    const path = '/apps/' + this.slug;
    const promise = AJAX.put(path, {
      'parse_app[auth_options_attributes][twitter_attributes][consumer_keys_as_list]':
        consumerKeyList.join(','),
    });
    promise.then(() => {
      this.settings.fields.fields.auth_options_attributes.twitter.consumer_keys = consumerKeyList;
    });
    return promise;
  }

  addConnectedTwitterApp(newConsumerKey) {
    const allKeys = (
      this.settings.fields.fields.auth_options_attributes.twitter.consumer_keys || []
    ).concat(newConsumerKey);
    return this.setConnectedTwitterApps(allKeys);
  }

  setAllowTwitterAuth(allow) {
    const path = '/apps/' + this.slug;
    const promise = AJAX.put(path, {
      'parse_app[auth_options_attributes][twitter_attributes][enabled_as_bool]': allow
        ? 'true'
        : 'false',
    });
    promise.then(() => {
      this.settings.fields.fields.auth_options_attributes.twitter.enabled = !!allow;
    });
    return promise;
  }

  setEnableClientPush(enable) {
    return setEnablePushSource.call(this, 'client_push_enabled', enable);
  }

  setEnableRestPush(enable) {
    return setEnablePushSource.call(this, 'rest_push_enabled', enable);
  }

  addGCMCredentials(sender_id, api_key) {
    const path = '/apps/' + this.slug + '/update_push_notifications';
    const promise = AJAX.post(path, {
      gcm_sender_id: sender_id,
      gcm_api_key: api_key,
    });
    promise.then(() => {
      this.settings.fields.fields.gcm_credentials.push({ sender_id, api_key });
    });
    return promise;
  }

  deleteGCMPushCredentials(GCMSenderID) {
    const path = '/apps/' + this.slug + '/delete_gcm_push_credential?gcm_sender_id=' + GCMSenderID;
    const promise = AJAX.get(path);
    promise.then(() => {
      this.settings.fields.fields.gcm_credentials =
        this.settings.fields.fields.gcm_credentials.filter(cred => cred.sender_id != GCMSenderID);
    });
    return promise;
  }

  addAdminHost(adminHost) {
    const path = '/parse-app/' + this.slug + '/adminhost';
    return axios.post(path, { adminHost }).catch(err => {
      throw err.response && err.response.data && err.response.data.error ? err.response.data.error : err
    })
  }

  addAdminUser(userCredentials) {
    const path = '/parse-app/' + this.slug + '/adminuser';
    return axios.post(path, userCredentials).catch(err => {
      throw err.response && err.response.data && err.response.data.error ? err.response.data.error : err
    })
  }

  getAdminHost() {
    const path = '/parse-app/' + this.slug + '/adminhost';
    return axios.get(path).then(({ data }) => data.adminHost).catch(err => {
      throw err.response && err.response.data && err.response.data.error ? err.response.data.error : err
    })
  }

  getWebHost() {
    const path = '/parse-app/' + this.slug + '/webhost';
    return axios.get(path).then(({ data }) => data.hostSettings).catch(err => {
      throw err.response && err.response.data && err.response.data.error ? err.response.data.error : err
    })
  }

  setWebHost(hostSettings) {
    const path = '/parse-app/' + this.slug + '/webhost';
    return axios.post(path, { hostSettings }).catch(err => {
      throw err.response && err.response.data && err.response.data.error ? err.response.data.error : err
    })
  }

  setLiveQuery(params) {
    const path = '/parse-app/' + this.slug + '/live-query';
    return axios.post(path, params).then(({ data }) => data.webhost).catch(err => {
      throw err.response && err.response.data && err.response.data.error ? err.response.data.error : err
    })
  }

  createTextIndexes() {
    return axios.post(`/parse-app/${this.slug}/index`, { index: { '$**': 'text' } }).catch(err => {
      throw err.response && err.response.data && err.response.data.error ? err.response.data.error : err
    })
  }

  /**
   * @param {String!} className
   */
  getIndexes(className) {
    return axios.get(`/parse-app/${this.slug}/index/${className}`).then(res => {
      return Object.values(Object.values(res.data[className]))
    }).catch(err => {
      throw err.response && err.response.data && err.response.data.error ? err.response.data.error : err
    })
  }

  /**
   * @param {String!} className
   */
  getPendingIndexes(className) {
    return axios.get(`/parse-app/${this.slug}/index/${className}/pending`).then(res => {
      return Object.values(Object.values(res.data[className]))
    }).catch(err => {
      throw err.response && err.response.data && err.response.data.error ? err.response.data.error : err
    })
  }

  /**
   * @param {String!} className
   * @param {Object!} indexConfiguration.index
   * @param {Object!} indexConfiguration.indexOptions
   */
  createIndex(className, indexConfiguration) {
    return axios.post(`/parse-app/${this.slug}/index/${className}`, indexConfiguration).catch(err => {
      throw err.response && err.response.data && err.response.data.error ? err.response.data.error : err
    })
  }

  /**
   * @param {String!} className
   * @param {Array<String!>!} indexes
   */
  dropIndexes(className, indexes) {
    return axios.post(`/parse-app/${this.slug}/index/${className}/deleteAll`, { indexes }).catch(err => {
      throw err.response && err.response.data && err.response.data.error ? err.response.data.error : err
    })
  }

  async disconnectHubDatabase(databaseName) {
    try {
      await axios.post('/hub/disconnect', { appEntityId: this.slug, database: databaseName });
    } catch (err) {
      throw err.response && err.response.data && err.response.data.error ? err.response.data.error : err
    }
  }

  async fetchHubConnections() {
    try {
      return (await axios.get(`/hub/connections/${this.slug}`)).data;
    } catch (err) {
      throw err.response && err.response.data && err.response.data.error ? err.response.data.error : err
    }
  }

  async publishOnHub() {
    const hubEndpoint = this.serverURL === 'https://parseapi-homolog.back4app.com' ? this.serverURL : 'https://parseapi.back4app.com'
    const axiosConfig = {
      withCredentials: true,
      headers: {
        'X-Parse-Application-Id': this.serverURL === 'https://parseapi-homolog.back4app.com' ? 'laJwKNAPsuBKrj2B6u1jbE03cgKeFez8eZcTYlL7' : 'X4zHblrpTF5ZhOwoKXzm6PhPpUQCQLrmZoKPBAoS',
        'X-Parse-Client-Key': this.serverURL === 'https://parseapi-homolog.back4app.com' ? 'vNlgQDBx2NNo9VMp2XLMHHjPwITqALprXbjZMdDU' : 'k3xdRL0jnNB4qnfjsiYC3qLtKYdLEAvWA96ysIU4',
      }
    }

    let publishResult
    try {
      publishResult = await axios.post(`${hubEndpoint}/functions/publish`, { appEntityId: this.slug }, axiosConfig)
    } catch (err) {
      console.error(err.response && err.response.data && err.response.data.error ? err.response.data.error : err)
      throw new Error('Something wrong happened in our side. Please try again later.')
    }

    const jobStatusId = publishResult.data && publishResult.data.result && publishResult.data.result.jobStatusId

    if (!jobStatusId) {
      console.error(JSON.stringify(publishResult))
      throw new Error('Something wrong happened in our side. Please try again later.')
    }

    for (let i = 1; i <= 10; i++) {
      let jobStatusResult
      try {
        jobStatusResult = await axios.post(`${hubEndpoint}/functions/jobStatus`, { id: jobStatusId }, axiosConfig)
      } catch (err) {
        console.error(err.response && err.response.data && err.response.data.error ? err.response.data.error : err)
        throw new Error('Something wrong happened in our side. Please try again later.')
      }

      const jobStatus = jobStatusResult.data && jobStatusResult.data.result;

      if (!jobStatus) {
        console.error(JSON.stringify(jobStatusResult))
        throw new Error('Something wrong happened in our side. Please try again later.')
      }

      let messageObject = {}
      if (jobStatus.message) {
        try {
          messageObject = JSON.parse(jobStatus.message)
        } catch {
          console.error(jobStatus.message)
          throw new Error('Something wrong happened in our side. Please try again later.')
        }
      }

      if (jobStatus.status === 'succeeded') {
        this.custom.isDatabasePublic = true;
        return messageObject
      } else if (jobStatus.status === 'failed') {
        if (messageObject.code && messageObject.message) {
          throw messageObject
        } else {
          console.error(jobStatus.message)
          throw new Error('Something wrong happened in our side. Please try again later.')
        }
      }

      await new Promise(resolve => setTimeout(resolve, i * 2000))
    }

    throw new Error('Something wrong happened in our side. Please try again later.')
  }

  async getPublicDatabase() {
    const hubEndpoint = this.serverURL === 'https://parseapi-homolog.back4app.com' ? this.serverURL : 'https://parseapi.back4app.com'
    const axiosConfig = {
      headers: {
        'X-Parse-Application-Id': this.serverURL === 'https://parseapi-homolog.back4app.com' ? 'laJwKNAPsuBKrj2B6u1jbE03cgKeFez8eZcTYlL7' : 'X4zHblrpTF5ZhOwoKXzm6PhPpUQCQLrmZoKPBAoS',
        'X-Parse-Client-Key': this.serverURL === 'https://parseapi-homolog.back4app.com' ? 'vNlgQDBx2NNo9VMp2XLMHHjPwITqALprXbjZMdDU' : 'k3xdRL0jnNB4qnfjsiYC3qLtKYdLEAvWA96ysIU4',
      }
    }

    let getPublicDatabaseResult
    try {
      getPublicDatabaseResult = await axios.get(`${hubEndpoint}/classes/Database?where=${encodeURIComponent(JSON.stringify({ appEntityId: this.slug }))}&include=author`, axiosConfig)
    } catch (err) {
      console.error(err.response && err.response.data && err.response.data.error ? err.response.data.error : err)
      return null
    }

    const publicDatabase = getPublicDatabaseResult.data && getPublicDatabaseResult.data.results && getPublicDatabaseResult.data.results.length > 0 && getPublicDatabaseResult.data.results[0]

    if (!publicDatabase) {
      console.error(JSON.stringify(getPublicDatabaseResult))
      return null
    }

    return publicDatabase;
  }

  async unpublishFromHub() {
    const hubEndpoint = this.serverURL === 'https://parseapi-homolog.back4app.com' ? this.serverURL : 'https://parseapi.back4app.com'
    const axiosConfig = {
      withCredentials: true,
      headers: {
        'X-Parse-Application-Id': this.serverURL === 'https://parseapi-homolog.back4app.com' ? 'laJwKNAPsuBKrj2B6u1jbE03cgKeFez8eZcTYlL7' : 'X4zHblrpTF5ZhOwoKXzm6PhPpUQCQLrmZoKPBAoS',
        'X-Parse-Client-Key': this.serverURL === 'https://parseapi-homolog.back4app.com' ? 'vNlgQDBx2NNo9VMp2XLMHHjPwITqALprXbjZMdDU' : 'k3xdRL0jnNB4qnfjsiYC3qLtKYdLEAvWA96ysIU4',
      }
    }

    let unpublishResult
    try {
      unpublishResult = await axios.post(`${hubEndpoint}/functions/unpublish`, { appEntityId: this.slug }, axiosConfig)
    } catch (err) {
      console.error(err.response && err.response.data && err.response.data.error ? err.response.data.error : err)
      throw new Error('Something wrong happened in our side. Please try again later.')
    }

    if (unpublishResult.status !== 200) {
      if (unpublishResult.data && unpublishResult.data.code && unpublishResult.message) {
        throw unpublishResult.data
      } else {
        console.error(JSON.stringify(unpublishResult))
        throw new Error('Something wrong happened in our side. Please try again later.')
      }
    }

    this.custom.isDatabasePublic = false;
  }

  async fetchServerLogs() {
    try {
      return (
        await axios.get(
          // eslint-disable-next-line no-undef
          `${b4aSettings.BACK4APP_API_PATH}/parse-app/${this.slug}/logs`,
          { withCredentials: true }
        )
      ).data;
    } catch (err) {
      throw err.response && err.response.data && err.response.data.error ? err.response.data.error : err
    }
  }

  async getSecurityReport() {
    try {
      return (
        await axios.get(
          // eslint-disable-next-line no-undef
          `${b4aSettings.BACK4APP_API_PATH}/security-report/${this.slug}?fromdashboard=true`,
          { withCredentials: true }
        )
      ).data;
    } catch (err) {
      throw err.response && err.response.data && err.response.data.error ? err.response.data.error : err
    }
  }

  async getAppPlanData() {
    try {
      const headers = {
        'X-Application-ID': this.applicationId,
        'X-Application-Type': 'parse',
        'Content-Type': 'application/json'
      };
      const config = { withCredentials: true, headers };
      // eslint-disable-next-line no-undef
      return (await axios.get(`${b4aSettings.BACK4APP_API_PATH}/getPlanData`, config)).data;
    } catch (err) {
      throw err.response && err.response.data && err.response.data.error ? err.response.data.error : err
    }
  }

  async fetchAvgResponseTime(limit = 60) {
    try {
      return (
        await axios.get(
          // eslint-disable-next-line no-undef
          `${b4aSettings.BACK4APP_API_PATH}/parse-app/${this.slug}/avg-response?limit=${limit}`,
          { withCredentials: true }
        )
      ).data;
    } catch (err) {
      throw err.response && err.response.data && err.response.data.error ? err.response.data.error : err
    }
  }

  async fetchRequestStatus(limit = 60) {
    try {
      return (
        await axios.get(
          // eslint-disable-next-line no-undef
          `${b4aSettings.BACK4APP_API_PATH}/parse-app/${this.slug}/request-status?limit=${limit}`,
          { withCredentials: true }
        )
      ).data;
    } catch (err) {
      throw err.response && err.response.data && err.response.data.error ? err.response.data.error : err
    }
  }

  async fetchAppHealthStatus(limit = 60) {
    try {
      return (
        await axios.get(
          // eslint-disable-next-line no-undef
          `${b4aSettings.BACK4APP_API_PATH}/parse-app/${this.slug}/health-status?limit=${limit}`,
          { withCredentials: true }
        )
      ).data;
    } catch (err) {
      throw err.response && err.response.data && err.response.data.error ? err.response.data.error : err
    }
  }

  async getAppBalance() {
    try {
      return (
        await axios.get(
          // eslint-disable-next-line no-undef
          `${b4aSettings.BACK4APP_API_PATH}/blockchain/balance/${this.applicationId}`,
          { withCredentials: true }
        )
      ).data;
    } catch (err) {
      throw err.response && err.response.data && err.response.data.error ? err.response.data.error : err
    }
  }

  async getBlockchainClassNames() {
    try {
      return (
        await axios.get(
          // eslint-disable-next-line no-undef
          `${b4aSettings.BACK4APP_API_PATH}/blockchain/class-names/${this.applicationId}`,
          { withCredentials: true }
        )
      ).data;
    } catch (err) {
      throw err.response && err.response.data && err.response.data.error ? err.response.data.error : err
    }
  }

  async moveClassToBlockchain(className) {
    try {
      return (
        await axios.post(
          // eslint-disable-next-line no-undef
          `${b4aSettings.BACK4APP_API_PATH}/blockchain/class-names/${this.applicationId}/${className}`,
          {},
          { withCredentials: true }
        )
      ).data;
    } catch (err) {
      throw err.response && err.response.data && err.response.data.error ? err.response.data.error : err
    }
  }

  async removeFromBlockchain(className) {
    try {
      return (
        await axios.delete(
          // eslint-disable-next-line no-undef
          `${b4aSettings.BACK4APP_API_PATH}/blockchain/class-names/${this.applicationId}/${className}`,
          { withCredentials: true }
        )
      ).data;
    } catch (err) {
      throw err.response && err.response.data && err.response.data.error ? err.response.data.error : err
    }
  }

}
