/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import * as AJAX      from 'lib/AJAX';
import encodeFormData from 'lib/encodeFormData';
import Parse          from 'parse';
import axios          from 'lib/axios';
import csv            from 'csvtojson';
import * as CSRFManager from 'lib/CSRFManager';

function setEnablePushSource(setting, enable) {
  let path = `/apps/${this.slug}/update_push_notifications`;
  let attr = `parse_app[${setting}]`;
  let body = {};
  body[attr] = enable ? 'true' : 'false';
  let promise = AJAX.put(path, body);
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
    columnPreference
  }) {
    this.name = appName;
    this.parseOptions = parseOptions;
    this.feedbackEmail = feedbackEmail;
    this.createdAt = created_at ? new Date(created_at) : new Date();
    this.applicationId = appId;
    this.slug = appNameForURL || appName;
    if (!this.slug && dashboardURL) {
      let pieces = dashboardURL.split('/');
      this.slug = pieces[pieces.length - 1];
    }
    this.clientKey = clientKey;
    this.javascriptKey = javascriptKey;
    this.masterKey = masterKey;
    this.restKey = restKey;
    this.windowsKey = windowsKey;
    this.webhookKey = webhookKey;
    this.fileKey =  apiKey;
    this.production = production;
    this.serverURL = serverURL;
    this.serverInfo = serverInfo;
    this.icon = iconName;
    this.primaryBackgroundColor=primaryBackgroundColor;
    this.secondaryBackgroundColor=secondaryBackgroundColor;
    this.supportedPushLocales = supportedPushLocales ? supportedPushLocales : [];
    this.custom = custom;
    this.preventSchemaEdits = preventSchemaEdits || false;
    this.graphQLServerURL = graphQLServerURL;
    this.columnPreference = columnPreference;

    if(!supportedPushLocales) {
      console.warn('Missing push locales for \'' + appName + '\', see this link for details on setting localizations up. https://github.com/parse-community/parse-dashboard#configuring-localized-push-notifications');
    }

    this.settings = {
      fields: {},
      lastFetched: new Date(0)
    };

    this.latestRelease = {
      release: null,
      lastFetched: new Date(0)
    };

    this.jobStatus = {
      status: null,
      lastFetched: new Date(0)
    };

    this.classCounts = {
      counts: {},
      lastFetched: {},
    }

    this.hasCheckedForMigraton = false;
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
    let path = 'scriptlog?level=' + encodeURIComponent(level.toLowerCase()) + '&n=100' + (since?'&startDate=' + encodeURIComponent(since.getTime()):'');
    return this.apiRequest('GET', path, {}, { useMasterKey: true });
  }

  /**
   * Fetches source of a Cloud Code hosted file from api.parse.com
   * fileName - the name of the file to be fetched
   */
  getSource(fileName) {
    return this.getLatestRelease().then((release) => {
      if (release.files === null) {
        // No release yet
        return Promise.resolve(null);
      }

      let fileMetaData = release.files[fileName];
      if (fileMetaData && fileMetaData.source) {
        return Promise.resolve(fileMetaData.source);
      }

      let params = {
        version: fileMetaData.version,
        checksum: fileMetaData.checksum
      }
      return this.apiRequest('GET', `scripts/${fileName}`, params, { useMasterKey: true });
    }).then((source) => {
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
    return this.apiRequest(
      'GET',
      'releases/latest',
      {},
      { useMasterKey: true }
    ).then((release) => {
      this.latestRelease.lastFetched = new Date();
      this.latestRelease.files = null;

      if (release.length === 0) {
        this.latestRelease.release = null;
      } else {
        let latestRelease = release[0];

        this.latestRelease.release = {
          version: latestRelease.version,
          parseVersion: latestRelease.parseVersion,
          deployedAt: new Date(latestRelease.timestamp)
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
        for (let c in checksums) {
          this.latestRelease.files[c] = {
            checksum: checksums[c],
            version: versions[c],
            source: null
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
    let p = new Parse.Query(className).count({ useMasterKey: true });
    p.then(count => {
      this.classCounts.counts[className] = count;
      this.classCounts.lastFetched[className] = new Date();
    })
    return p;
  }

  getRelationCount(relation) {
    this.setParseKeys();
    let p = relation.query().count({ useMasterKey: true });
    return p;
  }

  getAnalyticsRetention(time) {
    time = Math.round(time.getTime() / 1000);
    return AJAX.abortableGet('/apps/' + this.slug + '/analytics_retention?at=' + time);
  }

  getAnalyticsOverview(time) {
    time = Math.round(time.getTime() / 1000);
    let audiencePromises = [
      'daily_users',
      'weekly_users',
      'monthly_users',
      'total_users',
      'daily_installations',
      'weekly_installations',
      'monthly_installations',
      'total_installations'
    ].map((activity) => {
      let { xhr, promise } = AJAX.abortableGet('/apps/' + this.slug + '/analytics_content_audience?at=' + time + '&audienceType=' + activity);
      promise = promise.then((result) => (
        result.total === undefined ? result.content : result.total
      ));
      return { xhr, promise }
    });

    let billingPromises = [
      'billing_file_storage',
      'billing_database_storage',
      'billing_data_transfer'
    ].map((billing) => (
      AJAX.abortableGet('/apps/' + this.slug + '/' + billing)
    ));

    let allPromises = audiencePromises.concat(billingPromises);

    return {
      'dailyActiveUsers': allPromises[0],
      'weeklyActiveUsers': allPromises[1],
      'monthlyActiveUsers': allPromises[2],
      'totalUsers': allPromises[3],
      'dailyActiveInstallations': allPromises[4],
      'weeklyActiveInstallations': allPromises[5],
      'monthlyActiveInstallations': allPromises[6],
      'totalInstallations': allPromises[7],
      'billingFileStorage': allPromises[8],
      'billingDatabasetorage': allPromises[9],
      'billingDataTransfer': allPromises[10]
    };
  }

  getAnalyticsTimeSeries(query) {
    let path = '/apps/' + this.slug + '/analytics?' + encodeFormData(null, query);
    let { promise, xhr } = AJAX.abortableGet(path);
    promise = promise.then(( requested_data ) => requested_data);
    return { promise, xhr };
  }

  getAnalyticsSlowQueries({path, method, respStatus, respTime, from, to, distinct}) {
    let appsPath = 'parse-app';
    let urlPrefix = `${b4aSettings.BACK4APP_API_PATH}/${appsPath}/${this.slug}/slow_requests?`;

    let url = urlPrefix + encodeFormData(null, {
      path: path || '',
      method: method || '',
      status: respStatus || '',
      time: respTime || '',
      distinct: distinct || '',
      from: from.getTime() / 1000,
      to: to.getTime() / 1000
    });
    let { promise, xhr } = AJAX.abortableGet(url);
    promise = promise.then(({ result }) => result);

    return { promise, xhr };
  }

  getAppleCerts() {
    let path = '/apps/' + this.slug + '/apple_certificates';
    return AJAX.get(path).then(({ certs }) => certs);
  }

  uploadAppleCert(file) {
    let path = '/apps/' + this.slug + '/dashboard_ajax/push_certificate';
    let data = new FormData();
    data.append('new_apple_certificate', file);
    return AJAX.post(path, data).then(({ cert }) => cert);
  }

  deleteAppleCert(id) {
    let path = '/apps/' + this.slug + '/apple_certificates/' + id;
    return AJAX.del(path);
  }

  uploadSSLPublicCertificate(file) {
    let path = '/apps/' + this.slug + '/update_hosting_certificates';
    let data= new FormData();
    data.append('new_hosting_certificate[certificate_data]', file);
    return AJAX.put(path, data);
  }

  uploadSSLPrivateKey(file) {
    let path = '/apps/' + this.slug + '/update_hosting_certificates';
    let data= new FormData();
    data.append('new_hosting_certificate[key_data]', file);
    return AJAX.put(path, data);
  }

  saveSettingsFields(fields) {
    let path = '/apps/' + this.slug;
    let appFields = {};
    for (let f in fields) {
      appFields['parse_app[' + f + ']'] = fields[f];
    }
    let promise = AJAX.put(path, appFields);
    promise.then(({ successes }) => {
      for (let f in fields) {
        this.settings.fields[f] = successes[f];
      }
    });
    return promise;
  }

  async fetchSettingsFields() {
    // Cache it for a minute
    // if (new Date() - this.settings.lastFetched < 60000) {
    //   return Promise.resolve(this.settings.fields);
    // }
    let path = '/apps/' + this.slug + '/dashboard_ajax/settings';
    let fields = await axios.get(path);

    fields = fields.data;
    for (let f in fields) {
      this.settings.fields[f] = fields[f];
      this.settings.lastFetched = new Date();
    }
    return fields;
  }

  cleanUpFiles() {
    let path = '/apps/' + this.slug + '/orphan_files';
    return AJAX.post(path);
  }

  restartApp() {
    let path = `${b4aSettings.BACK4APP_API_PATH}/parse-app/${this.slug}/restart`;
    return AJAX.post(path);
  }

  transferApp(newOwner) {
    let path = `${b4aSettings.BACK4APP_API_PATH}/parse-app/${this.slug}/transfer`;
    return AJAX.post(path, { newOwner });
  }

  supportedParseServerVersions() {
    let path = `${b4aSettings.BACK4APP_API_PATH}/parse-version`;
    return AJAX.get(path);
  }

  checkStorage() {
    let path = `${b4aSettings.BACK4APP_API_PATH}/parse-app/${this.slug}/check-storage`;
    return fetch(path, { method: 'POST', headers: {'X-CSRF-Token': CSRFManager.getToken()} }).then((response) => {
      if (response.ok) {
        return response;
      } else {
        throw new Error({error: 'An error occurred'});
      }
    })
  }

  createApp(appName) {
    let path = `${b4aSettings.BACK4APP_API_PATH}/parse-app`;
    return AJAX.post(path, { appDescription: "", appId: null, appName, isPublic: false })
  }

  initializeDb(appId, body) {
    let path = `${b4aSettings.BACK4APP_API_PATH}/parse-app/${appId}/database`;
    return fetch(path, { method: 'POST', body , headers: {'X-CSRF-Token': CSRFManager.getToken()} }).then((response) => {
      if (response.ok) {
        return response;
      } else {
        throw new Error({error: 'An error occurred'});
      }
    })
  }

  async cloneApp(appId, parseVersion) {
    let path = `${b4aSettings.BACK4APP_API_PATH}/parse-app/${this.slug}/clone-app`;
    return AJAX.post(path, {
      appId,
      parseVersion,
    });
  }

  async deleteApp(appId) {
    let path = `${b4aSettings.BACK4APP_API_PATH}/parse-app/${appId || this.slug}`;
    return fetch(path, { method: 'DELETE', headers: {'X-CSRF-Token': CSRFManager.getToken()} }).then((response) => {
      if (response.ok) {
        return response;
      } else {
        throw new Error({error: 'An error occurred'});
      }
    })
  }

  cleanUpSystemLog() {
    let path = '/parse-app/' + this.slug + '/purge-logs';
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
          if (schema.fields[fieldName].type === 'Number') return Number(item);
          if (schema.fields[fieldName].type === 'Boolean') return item.toLowerCase() === 'false' ? false :  true;
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
        delimiter: "auto",
        ignoreEmpty: true,
        nullObject: true,
        checkType: true,
        colParser: customParser
      })
        .on("header", header => (fieldNames = header))
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
        delimiter: "auto",
        ignoreEmpty: true,
        nullObject: true,
        checkType: true
      })
        .on("header", header => (fieldNames = header))
        .fromString(text);
    }

    return new Blob([JSON.stringify({ results: jsonArray })], { type: 'text/plain' });
  }

  async importData(className, file) {
    if (file.name.endsWith('.csv')) {
      file = await this.transformCSVtoJSON(file, className);
    }

    let path = this.normalizePath(this.serverURL + '/import_data/' + className);
    var formData = new FormData();
    formData.append('importFile', file);
    if (this.feedbackEmail) {
      formData.append('feedbackEmail', this.feedbackEmail);
    }
    let options = {
      method: 'POST',
      headers: {
        'X-Parse-Application-Id': this.applicationId,
        'X-Parse-Master-Key': this.masterKey
      },
      body: formData
    }
    // if is GDPR
    if (this.custom && this.custom.isGDPR) options.credentials = 'include'
    return fetch(path, options);
  }

  async importRelationData(className, relationName,  file) {
    if (file.name.endsWith('.csv')) {
      file = await this.transformCSVtoJSON(file);
    }

    let path = this.normalizePath(this.serverURL + '/import_relation_data/' + className + '/' + relationName);
    var formData = new FormData();
    formData.append('importFile', file);
    if (this.feedbackEmail) {
      formData.append('feedbackEmail', this.feedbackEmail);
    }
    let options = {
      method: 'POST',
      headers: {
        'X-Parse-Application-Id': this.applicationId,
        'X-Parse-Master-Key': this.masterKey
      },
      body: formData
    }
    // if is GDPR
    if (this.custom && this.custom.isGDPR) options.credentials = 'include'
    return fetch(path, options);
  }

  exportData() {
    let path = '/apps/' + this.slug + '/export_data';
    return AJAX.put(path);
  }

  resetMasterKey(password) {
    let path = '/apps/' + this.slug + '/reset_master_key';
    return AJAX.post(
      path,
      { password_confirm_reset_master_key: password }
    ).then(({ new_key }) => {
      this.masterKey = new_key;
      return Promise.resolve();
    });
  }

  clearCollection(className) {
    if (this.serverInfo.parseServerVersion == 'Parse.com') {
      let path = `/apps/${this.slug}/collections/${className}/clear`;
      return AJAX.del(path);
    } else {
      let path = `purge/${className}`;
      return this.apiRequest('DELETE', path, {}, { useMasterKey: true });
    }
  }

  validateCollaborator(email) {
    let path = '/apps/' + this.slug + '/collaborations/validate?email=' + encodeURIComponent(email);
    return AJAX.get(path);
  }

  sendEmailToInviteCollaborator(email, featuresPermission, classesPermission, owner) {
    let path = '/apps/' + this.slug + '/collaborations/saveInvite';
    let promise = axios.post(path, {email: email, featuresPermission: featuresPermission, classesPermission: classesPermission, owner: owner});
    return promise;
  }

  editInvitePermissionCollaborator(email, featuresPermission, classesPermission, owner) {
    let path = '/apps/' + this.slug + '/collaborations/editInvite';
    let promise = axios.post(path, {email: email, featuresPermission: featuresPermission, classesPermission: classesPermission, owner: owner});
    return promise;
  }

  removeInviteCollaborator(email) {
    let path = '/apps/' + this.slug + '/collaborations/removeInvite/'+ encodeURIComponent(email);
    let promise = AJAX.del(path)
    return promise;
  }

  fetchPushSubscriberCount(audienceId, query) {
    let promise;
    if (audienceId === 'everyone') {
      query = {};
    }
    if (!query) {
      promise = new Parse.Query('_Audience').get(audienceId, { useMasterKey: true }).then(function(audience) {
        return Parse.Query.fromJSON('_Installation', { where: audience.get('query') }).count({ useMasterKey: true })
      });
    } else {
      promise = Parse.Query.fromJSON('_Installation', { where: query }).count({ useMasterKey: true })
    }
    return { xhr: undefined, promise: promise.then(function (count) {
      return { count: count };
    }) };
  }

  fetchPushNotifications(type, page, limit) {
    let query = new Parse.Query('_PushStatus');
    if (type != 'all') {
      query.equalTo('source', type || 'rest');
    }
    query.skip(page*limit);
    query.limit(limit);
    query.descending('createdAt');
    return query.find({ useMasterKey: true });
  }

  fetchPushAudienceSizeSuggestion() {
    let path = '/apps/' + this.slug + '/push_notifications/audience_size_suggestion';
    return AJAX.get(path);
  }

  fetchPushDetails(objectId) {
    let query = new Parse.Query('_PushStatus');
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
    path += `&locales=${encodeURI(JSON.stringify(locales))}`
    urlsSeparator = '&';
    return AJAX.abortableGet(audienceId ? `${path}${urlsSeparator}audienceId=${audienceId}` : path);
  }

  fetchAvailableDevices() {
    let path = '/apps/' + this.slug + '/dashboard_ajax/available_devices';
    return AJAX.get(path);
  }

  removeCollaboratorById(id) {
    let path = '/apps/' + this.slug + '/collaborations/' + id.toString();
    let promise = AJAX.del(path)
    promise.then(() => {
      //TODO: this currently works because everything that uses collaborators
      // happens to re-render after this call anyway, but really the collaborators
      // should be updated properly in a store or AppsManager or something
      this.settings.fields.fields.collaborators = this.settings.fields.fields.collaborators.filter(c => c.id != id);
    });
    return promise;
  }

  editCollaboratorById(id, featuresPermission, classesPermission) {
    let path = '/apps/' + this.slug + '/collaborations/edit/' + id.toString();
    let promise = axios.post(path, { featuresPermission, classesPermission })
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
    let path = '/apps/' + this.slug + '/collaborations';
    let promise = axios.post(path, {'collaboration[email]': email, featuresPermission, classesPermission});
    promise.then(({ data }) => {
      //TODO: this currently works because everything that uses collaborators
      // happens to re-render after this call anyway, but really the collaborators
      // should be updated properly in a store or AppsManager or something
      this.settings.fields.fields.collaborators =
        Array.isArray(this.settings.fields.fields.collaborators) ?
          this.settings.fields.fields.collaborators : [];
      this.settings.fields.fields.collaborators.unshift(data.data);
    });
    return promise;
  }

  setRequestLimit(limit) {
    let path = '/plans/' + this.slug + '?new_limit=' + limit.toString();
    let promise = AJAX.put(path);
    promise.then(() => {
      this.settings.fields.fields.pricing_plan.request_limit = limit;
    });
    return promise;
  }

  setAppConfig(name, parseOptions) {
    let config = {};
    if ( name ) config['appName'] = name;
    if ( parseOptions ) config['parseOptions'] = parseOptions;
    let path = `${b4aSettings.BACK4APP_API_PATH}/parse-app/${this.slug}`;
    let promise = axios.patch(path, config, { withCredentials: true });
    promise.then(() => {
      if (name)
        this.name = name;
      if(parseOptions)
        this.parseOptions = parseOptions;
    });
    return promise;
  }

  setAppStoreURL(type, url) {
    let path = '/apps/' + this.slug;
    let promise = AJAX.put(path, {['parse_app[parse_app_metadata][url][' + type + ']']: url});
    promise.then(() => {
      this.settings.fields.fields.urls.unshift({platform: type, url: url});
    });
    return promise;
  }

  setInProduction(inProduction) {
    let path = '/apps/' + this.slug;
    let promise = AJAX.put(path, {'parse_app[parse_app_metadata][production]': inProduction ? 'true' : 'false'});
    promise.then(() => {
      this.production = inProduction;
    });
    return promise;
  }

  launchExperiment(objectId, formData) {
    let path = `/apps/${this.slug}/push_notifications/${objectId}/launch_experiment`;
    return AJAX.post(path, formData);
  }

  exportClass(className, where) {
    if (!where) {
      where = {};
    }
    let path = 'export_data';
    return this.apiRequest('PUT', path, {
      name: className,
      where: where,
      feedbackEmail: this.feedbackEmail
    }, {useMasterKey:true});
  }

  getExportProgress() {
    let path = 'export_progress';
    return this.apiRequest('GET', path, {}, {useMasterKey:true});
  }

  getAvailableJobs() {
    let path = 'cloud_code/jobs/data';
    return this.apiRequest('GET', path, {}, { useMasterKey: true });
  }

  getJobStatus() {
    // Cache it for a 30s
    if (new Date() - this.jobStatus.lastFetched < 30000) {
      return Promise.resolve(this.jobStatus.status);
    }
    let query = new Parse.Query('_JobStatus');
    query.descending('createdAt');
    return query.find({ useMasterKey: true }).then((status) => {
      status = status.map((jobStatus) => {
        return jobStatus.toJSON();
      });
      this.jobStatus = {
        status: status || null,
        lastFetched: new Date()
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
        when: 0
      },
      { useMasterKey: true }
    );
  }

  getMigrations() {
    let path = '/apps/' + this.slug + '/migrations';
    let obj = AJAX.abortableGet(path);
    this.hasCheckedForMigraton = true
    obj.promise.then(({ migration }) => {
      this.migration = migration;
    }).catch(() => {}); // swallow errors
    return obj;
  }

  beginMigration(connectionString) {
    this.hasCheckedForMigraton = false;
    let path = '/apps/' + this.slug + '/migrations';
    return AJAX.post(path, {connection_string: connectionString});
  }

  changeConnectionString(newConnectionString) {
    let path = '/apps/' + this.slug + '/change_connection_string';
    let promise = AJAX.post(path, {connection_string: newConnectionString});
    promise.then(() => {
      this.settings.fields.fields.opendb_connection_string = newConnectionString;
    });
    return promise;
  }

  stopMigration() {
    //We will need to pass the real ID here if we decide to have migrations deletable by id. For now, from the users point of view, there is only one migration per app.
    let path = '/apps/' + this.slug + '/migrations/0';
    return AJAX.del(path);
  }

  commitMigration() {
    //Migration IDs are not to be exposed, so pass 0 as ID and let rails fetch the correct ID
    let path = '/apps/' + this.slug + '/migrations/0/commit';
    //No need to update anything, UI will autorefresh once request goes through and mowgli enters FINISH/DONE state
    return AJAX.post(path);
  }

  setRequireRevocableSessions(require) {
    let path = '/apps/' + this.slug;
    let promise = AJAX.put(path, {'parse_app[require_revocable_session]': require ? 'true' : 'false'});
    promise.then(() => {
      //TODO: this currently works because everything that uses this
      // happens to re-render after this call anyway, but really this
      // should be updated properly in a store or AppsManager or something
      this.settings.fields.fields.require_revocable_session = require;
    });
    return promise;
  }

  setExpireInactiveSessions(require) {
    let path = '/apps/' + this.slug;
    let promise = AJAX.put(path, {'parse_app[expire_revocable_session]': require ? 'true' : 'false'});
    promise.then(() => {
      //TODO: this currently works because everything that uses this
      // happens to re-render after this call anyway, but really this
      // should be updated properly in a store or AppsManager or something
      this.settings.fields.fields.expire_revocable_session = require;
    });
    return promise;
  }

  setRevokeSessionOnPasswordChange(require) {
    let path = '/apps/' + this.slug;
    let promise = AJAX.put(path, {'parse_app[revoke_on_password_reset]': require ? 'true' : 'false'});
    promise.then(() => {
      //TODO: this currently works because everything that uses this
      // happens to re-render after this call anyway, but really this
      // should be updated properly in a store or AppsManager or something
      this.settings.fields.fields.revoke_on_password_reset = require;
    });
    return promise;
  }

  setEnableNewMethodsByDefault(require) {
    let path = '/apps/' + this.slug;
    let promise = AJAX.put(path, {'parse_app[auth_options_attributes][_enable_by_default_as_bool]': require ? 'true' : 'false'});
    promise.then(() => {
      //TODO: this currently works because everything that uses this
      // happens to re-render after this call anyway, but really this
      // should be updated properly in a store or AppsManager or something
      this.settings.fields.fields.auth_options_attributes._enable_by_default = require;
    });
    return promise;
  }

  setAllowUsernameAndPassword(require) {
    let path = '/apps/' + this.slug;
    let promise = AJAX.put(path, {'parse_app[auth_options_attributes][username_attributes][enabled_as_bool]': require ? 'true' : 'false'});
    promise.then(() => {
      //TODO: this currently works because everything that uses this
      // happens to re-render after this call anyway, but really this
      // should be updated properly in a store or AppsManager or something
      this.settings.fields.fields.auth_options_attributes.username.enabled = require;
    });
    return promise;
  }

  setAllowAnonymousUsers(require) {
    let path = '/apps/' + this.slug;
    let promise = AJAX.put(path, {'parse_app[auth_options_attributes][anonymous_attributes][enabled_as_bool]': require ? 'true' : 'false'});
    promise.then(() => {
      //TODO: this currently works because everything that uses this
      // happens to re-render after this call anyway, but really this
      // should be updated properly in a store or AppsManager or something
      this.settings.fields.fields.auth_options_attributes.anonymous.enabled = require;
    });
    return promise;
  }

  setAllowCustomAuthentication(require) {
    let path = '/apps/' + this.slug;
    let promise = AJAX.put(path, {'parse_app[auth_options_attributes][custom_attributes][enabled_as_bool]': require ? 'true' : 'false'});
    promise.then(() => {
      //TODO: this currently works because everything that uses this
      // happens to re-render after this call anyway, but really this
      // should be updated properly in a store or AppsManager or something
      this.settings.fields.fields.auth_options_attributes.custom.enabled = require;
    });
    return promise;
  }

  setConnectedFacebookApps(idList, secretList) {
    let path = '/apps/' + this.slug;
    let promise = AJAX.put(path, {
      'parse_app[auth_options_attributes][facebook_attributes][app_ids_as_list]': idList.join(','),
      'parse_app[auth_options_attributes][facebook_attributes][app_secrets_as_list]': secretList.join(','),
    });
    promise.then(() => {
      this.settings.fields.fields.auth_options_attributes.facebook.app_ids = idList;
      this.settings.fields.fields.auth_options_attributes.facebook.app_secrets = secretList;
    });
    return promise;
  }

  addConnectedFacebookApp(newId, newSecret) {
    let allIds = (this.settings.fields.fields.auth_options_attributes.facebook.app_ids || []).concat(newId);
    let allSecrets = (this.settings.fields.fields.auth_options_attributes.facebook.app_secrets || []).concat(newSecret);
    return this.setConnectedFacebookApps(allIds, allSecrets);
  }

  setAllowFacebookAuth(enable) {
    let path = '/apps/' + this.slug;
    let promise = AJAX.put(path, {
      'parse_app[auth_options_attributes][facebook_attributes][enabled_as_bool]': enable ? 'true' : 'false',
    });
    promise.then(() => {
      this.settings.fields.fields.auth_options_attributes.facebook.enabled = !!enable;
    });
    return promise;
  }

  setConnectedTwitterApps(consumerKeyList) {
    let path = '/apps/' + this.slug;
    let promise = AJAX.put(path, {
      'parse_app[auth_options_attributes][twitter_attributes][consumer_keys_as_list]': consumerKeyList.join(','),
    });
    promise.then(() => {
      this.settings.fields.fields.auth_options_attributes.twitter.consumer_keys = consumerKeyList;
    });
    return promise;
  }

  addConnectedTwitterApp(newConsumerKey) {
    let allKeys = (this.settings.fields.fields.auth_options_attributes.twitter.consumer_keys || []).concat(newConsumerKey);
    return this.setConnectedTwitterApps(allKeys);
  }

  setAllowTwitterAuth(allow) {
    let path = '/apps/' + this.slug;
    let promise = AJAX.put(path, {
      'parse_app[auth_options_attributes][twitter_attributes][enabled_as_bool]': allow ? 'true' : 'false',
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
    let path = '/apps/' + this.slug + '/update_push_notifications'
    let promise = AJAX.post(path, {
      gcm_sender_id: sender_id,
      gcm_api_key: api_key
    });
    promise.then(() => {
      this.settings.fields.fields.gcm_credentials.push({ sender_id, api_key });
    });
    return promise;
  }

  deleteGCMPushCredentials(GCMSenderID) {
    let path = '/apps/' + this.slug + '/delete_gcm_push_credential?gcm_sender_id='+GCMSenderID;
    let promise = AJAX.get(path);
    promise.then(() => {
      this.settings.fields.fields.gcm_credentials = this.settings.fields.fields.gcm_credentials.filter(cred =>
        cred.sender_id != GCMSenderID
      );
    });
    return promise;
  }

  addAdminHost(adminHost) {
    let path = '/parse-app/' + this.slug + '/adminhost';
    return axios.post(path, { adminHost }).catch(err => {
      throw err.response && err.response.data && err.response.data.error ? err.response.data.error : err
    })
  }

  addAdminUser(userCredentials) {
    let path = '/parse-app/' + this.slug + '/adminuser';
    return axios.post(path, userCredentials).catch(err => {
      throw err.response && err.response.data && err.response.data.error ? err.response.data.error : err
    })
  }

  getAdminHost() {
    let path = '/parse-app/' + this.slug + '/adminhost';
    return axios.get(path).then(({ data }) => data.adminHost).catch(err => {
      throw err.response && err.response.data && err.response.data.error ? err.response.data.error : err
    })
  }

  getWebHost() {
    let path = '/parse-app/' + this.slug + '/webhost';
    return axios.get(path).then(({ data }) => data.hostSettings).catch(err => {
      throw err.response && err.response.data && err.response.data.error ? err.response.data.error : err
    })
  }

  setWebHost(hostSettings) {
    let path = '/parse-app/' + this.slug + '/webhost';
    return axios.post(path, { hostSettings }).catch(err => {
      throw err.response && err.response.data && err.response.data.error ? err.response.data.error : err
    })
  }

  setLiveQuery(params) {
    let path = '/parse-app/' + this.slug + '/live-query';
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
          `${b4aSettings.BACK4APP_API_PATH}/parse-app/${this.slug}/logs`,
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
          `${b4aSettings.BACK4APP_API_PATH}/blockchain/class-names/${this.applicationId}/${className}`,
          { withCredentials: true }
        )
      ).data;
    } catch (err) {
      throw err.response && err.response.data && err.response.data.error ? err.response.data.error : err
    }
  }

}
