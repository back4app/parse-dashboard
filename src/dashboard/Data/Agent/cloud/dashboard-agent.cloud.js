// @back4app-dashboard-agent generated file — do not edit by hand.
// Managed by the Parse Dashboard "AI Agent" configuration. Editing or deleting
// this file will be overwritten the next time the agent config is saved.
/* eslint-disable */
'use strict';

/**
 * AI Agent — runs INSIDE this app's Cloud Code container.
 *
 * The dashboard invokes the `dashboardAgent` Cloud Function (with the master
 * key). All heavy work (OpenAI calls + database operations) happens here, in the
 * app's own container, using the app's own resources — NOT on the shared
 * back4app API. The OpenAI key is read from this app's environment variable
 * (OPENAI_API_KEY) and never leaves the container.
 */

var OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
var OPENAI_TIMEOUT_MS = 60000;
var WRITE_OPERATIONS = ['deleteObject', 'deleteClass', 'updateObject', 'createObject', 'createClass'];
var REMOVABLE_PARAMS = ['reasoning_effort', 'temperature', 'top_p', 'frequency_penalty', 'presence_penalty', 'max_tokens', 'max_completion_tokens'];

var databaseTools = [
  { type: 'function', function: { name: 'queryClass', description: 'Query a Parse class/table to retrieve objects. Use this to fetch data from the database.', parameters: { type: 'object', properties: {
    className: { type: 'string', description: 'The name of the Parse class to query' },
    where: { type: 'object', description: 'Query constraints as a JSON object (e.g., {"name": "John", "age": {"$gte": 18}})' },
    limit: { type: 'number', description: 'Maximum number of results to return (default 100, max 1000)' },
    skip: { type: 'number', description: 'Number of results to skip for pagination' },
    order: { type: 'string', description: "Field to order by (prefix with '-' for descending, e.g., '-createdAt')" },
    include: { type: 'array', items: { type: 'string' }, description: 'Array of pointer fields to include/populate' },
    select: { type: 'array', items: { type: 'string' }, description: 'Array of fields to select' }
  }, required: ['className'] } } },
  { type: 'function', function: { name: 'createObject', description: 'Create a new object in a Parse class/table. Write operation — requires explicit user confirmation. You MUST provide objectData with the field values.', parameters: { type: 'object', properties: {
    className: { type: 'string', description: 'The name of the Parse class to create an object in' },
    objectData: { type: 'object', description: 'REQUIRED: the object fields/values as a JSON object.', additionalProperties: true },
    confirmed: { type: 'boolean', description: 'Must be true to confirm this write', default: false }
  }, required: ['className', 'objectData', 'confirmed'] } } },
  { type: 'function', function: { name: 'updateObject', description: 'Update an existing object. Write operation — requires explicit user confirmation.', parameters: { type: 'object', properties: {
    className: { type: 'string', description: 'The Parse class containing the object' },
    objectId: { type: 'string', description: 'The objectId of the object to update' },
    objectData: { type: 'object', description: 'The fields to update as a JSON object' },
    confirmed: { type: 'boolean', description: 'Must be true to confirm this write', default: false }
  }, required: ['className', 'objectId', 'objectData', 'confirmed'] } } },
  { type: 'function', function: { name: 'deleteObject', description: 'Delete a SINGLE object/row by objectId. Destructive — requires explicit user confirmation.', parameters: { type: 'object', properties: {
    className: { type: 'string', description: 'The Parse class containing the object' },
    objectId: { type: 'string', description: 'The objectId of the object to delete' },
    confirmed: { type: 'boolean', description: 'Must be true to confirm this destructive operation', default: false }
  }, required: ['className', 'objectId', 'confirmed'] } } },
  { type: 'function', function: { name: 'getSchema', description: 'Get schema information for Parse classes (read-only).', parameters: { type: 'object', properties: {
    className: { type: 'string', description: 'The Parse class to get schema for (optional; omit for all)' }
  } } } },
  { type: 'function', function: { name: 'countObjects', description: 'Count objects in a Parse class/table that match given constraints.', parameters: { type: 'object', properties: {
    className: { type: 'string', description: 'The Parse class to count objects in' },
    where: { type: 'object', description: 'Query constraints as a JSON object (optional)' }
  }, required: ['className'] } } },
  { type: 'function', function: { name: 'createClass', description: 'Create a new Parse class/table with specified fields. Requires explicit user confirmation.', parameters: { type: 'object', properties: {
    className: { type: 'string', description: 'The Parse class to create' },
    fields: { type: 'object', description: 'Fields as {name: type} (e.g. {"name":"String","age":"Number"})' },
    confirmed: { type: 'boolean', description: 'Must be true to confirm', default: false }
  }, required: ['className', 'confirmed'] } } },
  { type: 'function', function: { name: 'deleteClass', description: 'Delete an ENTIRE Parse class/table and ALL its data. Highly destructive — requires explicit user confirmation.', parameters: { type: 'object', properties: {
    className: { type: 'string', description: 'The Parse class/table to completely delete' },
    confirmed: { type: 'boolean', description: 'Must be true to confirm this highly destructive operation', default: false }
  }, required: ['className', 'confirmed'] } } }
];

var SYSTEM_PROMPT = [
  'You are an AI assistant integrated into Parse Dashboard, a data management interface for Parse Server applications.',
  '',
  'You can query and modify the database via the provided function tools:',
  '- Query classes/tables, get schema, and count objects (read-only, no confirmation needed)',
  '- Create/update objects, delete individual objects, create classes, delete entire classes (ALL require explicit user confirmation)',
  '',
  'CRITICAL SECURITY RULE FOR WRITE OPERATIONS:',
  '- Any write (create, update, delete) MUST have explicit user confirmation in the conversation.',
  '- Explain what you will do and ask for confirmation; only call the function with confirmed=true after the user agrees.',
  '- Read operations (query, getSchema, count) can be performed immediately.',
  '',
  'When creating/updating objects you MUST provide the objectData parameter with the actual field values.',
  'If a database function returns an error, include the full error message in your response.',
  '',
  'DATABASE ACCESS & MASTER KEY:',
  '- You already have FULL database access through the tools; the master key is applied for you server-side.',
  '- NEVER tell the user you lack the master key, and NEVER ask them for it. If a request needs data, just call the appropriate tool.',
  '- To answer questions about the app\'s structure or data, CALL the tools (getSchema, queryClass, countObjects) — do not guess.',
  '- Never fabricate app IDs, server URLs, class names, or field names. Only state values you got from the app context below or from a tool result.',
  '',
  'CLOUD CODE & DEPLOYMENT:',
  '- You CAN write example code (Cloud Functions, triggers, jobs, snippets) and explain it. Do this freely whenever asked — never suggest another tool just to write or explain code.',
  '- You CANNOT read this app\'s actual deployed Cloud Code, and you CANNOT write to or deploy Cloud Code.',
  '- ONLY suggest the Back4App MCP (installable in the user\'s IDE — Cursor, VS Code, Windsurf, Claude) in these specific cases: the user wants to (a) DEPLOY Cloud Code, (b) READ/inspect their actual deployed Cloud Code, or (c) APPLY changes to their app\'s Cloud Code. In those cases, briefly say you can\'t do that from the dashboard and point them to the MCP for it.',
  '- Do NOT mention the MCP in any other situation. Writing an example, answering a question, or discussing code is NOT a reason to bring it up.',
  '',
  'Format responses using Markdown (bold, code, lists, tables, headers) for readability.'
].join('\n');

function normalizeFieldType(type) {
  switch (String(type).toLowerCase()) {
    case 'string': return 'String';
    case 'number': return 'Number';
    case 'boolean': return 'Boolean';
    case 'date': return 'Date';
    case 'array': return 'Array';
    case 'object': return 'Object';
    case 'geopoint': return 'GeoPoint';
    case 'file': return 'File';
    default: return 'String';
  }
}

function applyConstraints(query, where) {
  Object.keys(where || {}).forEach(function (key) {
    var value = where[key];
    if (typeof value === 'object' && value !== null) {
      Object.keys(value).forEach(function (op) {
        switch (op) {
          case '$gt': query.greaterThan(key, value[op]); break;
          case '$gte': query.greaterThanOrEqualTo(key, value[op]); break;
          case '$lt': query.lessThan(key, value[op]); break;
          case '$lte': query.lessThanOrEqualTo(key, value[op]); break;
          case '$ne': query.notEqualTo(key, value[op]); break;
          case '$in': query.containedIn(key, value[op]); break;
          case '$nin': query.notContainedIn(key, value[op]); break;
          case '$exists': if (value[op]) { query.exists(key); } else { query.doesNotExist(key); } break;
          case '$regex': query.matches(key, new RegExp(value[op], value.$options || '')); break;
        }
      });
    } else {
      query.equalTo(key, value);
    }
  });
}

async function executeDatabaseFunction(functionName, args, operationLog, permissions) {
  if (WRITE_OPERATIONS.indexOf(functionName) !== -1) {
    var v = permissions && permissions[functionName];
    if (!(v === true || v === 'true')) {
      throw new Error('Permission denied: the "' + functionName + '" operation is disabled in the permissions settings. Enable it in the Parse Dashboard Permissions menu to allow it.');
    }
  }

  try {
    switch (functionName) {
      case 'queryClass': {
        var className = args.className;
        var query = new Parse.Query(className);
        applyConstraints(query, args.where || {});
        query.limit(Math.min(args.limit || 100, 1000));
        if (args.skip) { query.skip(args.skip); }
        if (args.order) { args.order.charAt(0) === '-' ? query.descending(args.order.substring(1)) : query.ascending(args.order); }
        if (args.include && args.include.length) { query.include(args.include); }
        if (args.select && args.select.length) { query.select(args.select); }
        var results = await query.find({ useMasterKey: true });
        operationLog.push({ operation: 'queryClass', className: className, resultCount: results.length });
        return results.map(function (o) { return o.toJSON(); });
      }
      case 'countObjects': {
        var q = new Parse.Query(args.className);
        applyConstraints(q, args.where || {});
        var count = await q.count({ useMasterKey: true });
        return { count: count };
      }
      case 'createObject': {
        if (!args.objectData || typeof args.objectData !== 'object' || Object.keys(args.objectData).length === 0) {
          throw new Error("Missing or empty 'objectData'. Provide the fields/values as a JSON object.");
        }
        if (!args.confirmed) { throw new Error('Creating objects requires user confirmation.'); }
        var Klass = Parse.Object.extend(args.className);
        var obj = new Klass();
        Object.keys(args.objectData).forEach(function (k) { obj.set(k, args.objectData[k]); });
        var saved = await obj.save(null, { useMasterKey: true });
        operationLog.push({ operation: 'createObject', className: args.className });
        return saved.toJSON();
      }
      case 'updateObject': {
        if (!args.confirmed) { throw new Error('Updating objects requires user confirmation.'); }
        var uq = new Parse.Query(args.className);
        var uobj = await uq.get(args.objectId, { useMasterKey: true });
        Object.keys(args.objectData || {}).forEach(function (k) { uobj.set(k, args.objectData[k]); });
        var usaved = await uobj.save(null, { useMasterKey: true });
        operationLog.push({ operation: 'updateObject', className: args.className, objectId: args.objectId });
        return usaved.toJSON();
      }
      case 'deleteObject': {
        if (!args.confirmed) { throw new Error('Deleting objects requires user confirmation.'); }
        var dq = new Parse.Query(args.className);
        var dobj = await dq.get(args.objectId, { useMasterKey: true });
        await dobj.destroy({ useMasterKey: true });
        operationLog.push({ operation: 'deleteObject', className: args.className, objectId: args.objectId });
        return { success: true, objectId: args.objectId };
      }
      case 'getSchema': {
        if (args.className) { return await new Parse.Schema(args.className).get({ useMasterKey: true }); }
        return await Parse.Schema.all({ useMasterKey: true });
      }
      case 'createClass': {
        if (!args.confirmed) { throw new Error('Creating classes requires user confirmation.'); }
        var schema = new Parse.Schema(args.className);
        var fields = args.fields || {};
        Object.keys(fields).forEach(function (name) {
          var t = normalizeFieldType(fields[name]);
          if (t === 'String') { schema.addString(name); }
          else if (t === 'Number') { schema.addNumber(name); }
          else if (t === 'Boolean') { schema.addBoolean(name); }
          else if (t === 'Date') { schema.addDate(name); }
          else if (t === 'Array') { schema.addArray(name); }
          else if (t === 'Object') { schema.addObject(name); }
          else if (t === 'GeoPoint') { schema.addGeoPoint(name); }
          else if (t === 'File') { schema.addFile(name); }
          else { schema.addString(name); }
        });
        var savedSchema = await schema.save({ useMasterKey: true });
        operationLog.push({ operation: 'createClass', className: args.className });
        return { success: true, className: args.className, schema: savedSchema };
      }
      case 'deleteClass': {
        if (!args.confirmed) { throw new Error('Deleting classes requires user confirmation.'); }
        try { await new Parse.Schema(args.className).get({ useMasterKey: true }); }
        catch (e) { if (e.code === 103) { throw new Error('Class "' + args.className + '" does not exist.'); } throw e; }
        var s = new Parse.Schema(args.className);
        await s.purge({ useMasterKey: true });
        await s.delete({ useMasterKey: true });
        operationLog.push({ operation: 'deleteClass', className: args.className });
        return { success: true, className: args.className, message: 'Class "' + args.className + '" and all its data have been permanently deleted.' };
      }
      default:
        throw new Error('Unknown function: ' + functionName);
    }
  } catch (error) {
    throw new Error('Database operation failed: ' + (error.message || String(error)));
  }
}

// POST JSON via Node's built-in https module (no deprecated APIs, zero deps).
function httpsPostJson(targetUrl, headers, bodyObj, timeoutMs) {
  return new Promise(function (resolve) {
    var https = require('https');
    var u = new URL(targetUrl);
    var payload = JSON.stringify(bodyObj);
    var options = {
      method: 'POST',
      hostname: u.hostname,
      port: u.port || 443,
      path: u.pathname + u.search,
      headers: Object.assign({}, headers, { 'Content-Length': Buffer.byteLength(payload) })
    };
    var req = https.request(options, function (res) {
      var chunks = '';
      res.on('data', function (c) { chunks += c; });
      res.on('end', function () {
        var data = null;
        try { data = JSON.parse(chunks); } catch (e) { data = null; }
        resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, data: data });
      });
    });
    req.on('error', function (err) { resolve({ ok: false, status: 0, data: { error: { message: err.message } } }); });
    req.setTimeout(timeoutMs, function () { req.destroy(); resolve({ ok: false, status: 0, data: { error: { message: 'Request timed out' } } }); });
    req.write(payload);
    req.end();
  });
}

// HTTP helper: prefer global fetch (Node 18+), fall back to the https module.
async function httpPostJson(url, headers, bodyObj, timeoutMs) {
  if (typeof fetch === 'function') {
    var controller = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, timeoutMs) : null;
    try {
      var resp = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(bodyObj),
        signal: controller ? controller.signal : undefined
      });
      var text = await resp.text();
      var data = null;
      try { data = JSON.parse(text); } catch (e) { data = null; }
      return { ok: resp.ok, status: resp.status, data: data };
    } catch (err) {
      var aborted = err && (err.name === 'AbortError' || /abort/i.test(err.message || ''));
      return { ok: false, status: 0, data: { error: { message: aborted ? 'Request timed out' : (err.message || 'Network error') } } };
    } finally { if (timer) { clearTimeout(timer); } }
  }
  return httpsPostJson(url, headers, bodyObj, timeoutMs);
}

function adjustUnsupportedParam(body, errorObj, message) {
  var next = Object.assign({}, body);
  var msg = message || '';

  if (/reasoning_effort/i.test(msg) && /none/i.test(msg) && next.reasoning_effort !== 'none') {
    next.reasoning_effort = 'none';
    return next;
  }
  if (/max_tokens/.test(msg) && /max_completion_tokens/.test(msg)) {
    if (('max_tokens' in next) && !('max_completion_tokens' in next)) { next.max_completion_tokens = next.max_tokens; delete next.max_tokens; return next; }
    if (('max_completion_tokens' in next) && !('max_tokens' in next)) { next.max_tokens = next.max_completion_tokens; delete next.max_completion_tokens; return next; }
  }
  var param = errorObj && errorObj.param;
  if (!param) { var quoted = msg.match(/'([a-zA-Z_][a-zA-Z0-9_.]*)'/); if (quoted) { param = quoted[1]; } }
  if (!param) { var supplied = msg.match(/argument supplied:\s*([a-zA-Z_][a-zA-Z0-9_.]*)/i); if (supplied) { param = supplied[1]; } }
  if (!param) { param = REMOVABLE_PARAMS.filter(function (p) { return (p in next) && msg.indexOf(p) !== -1; })[0]; }
  if (param && (param in next)) { delete next[param]; return next; }
  if (/temperature/i.test(msg) && ('temperature' in next)) { delete next.temperature; return next; }
  return null;
}

async function callOpenAI(apiKey, body) {
  var payload = Object.assign({}, body);
  var headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey };
  for (var attempt = 0; attempt < 4; attempt++) {
    var res = await httpPostJson(OPENAI_URL, headers, payload, OPENAI_TIMEOUT_MS);
    if (res.ok && res.data) { return res.data; }
    var errorObj = res.data && res.data.error;
    var apiMessage = errorObj && errorObj.message;
    if (res.status === 400 && apiMessage) {
      var adjusted = adjustUnsupportedParam(payload, errorObj, apiMessage);
      if (adjusted) { payload = adjusted; continue; }
    }
    if (res.status === 0) { throw new Error('OpenAI request failed: ' + (apiMessage || 'network error') + '. Try a faster model (e.g. gpt-4o) or a shorter prompt.'); }
    if (res.status === 401) { throw new Error('Invalid API key. Please check your OpenAI API key configuration.'); }
    if (res.status === 429) { throw new Error('Rate limit exceeded. Please try again in a moment.'); }
    if (res.status === 403) { throw new Error('Access forbidden. Please check your API key permissions.'); }
    if (res.status >= 500) { throw new Error('OpenAI service is temporarily unavailable. Please try again later.'); }
    throw new Error('OpenAI API error: ' + (apiMessage || ('HTTP ' + res.status)));
  }
  throw new Error('OpenAI API error: request rejected after adjusting unsupported parameters.');
}

async function runAgent(userMessage, model, apiKey, history, operationLog, permissions, appContext) {
  var ctx = appContext || {};
  var appName = ctx.appName || Parse.applicationId || 'this app';
  var contextLines = [
    '',
    'APP CONTEXT (authoritative — use these exact values, do not invent others):',
    '- App name: ' + appName,
    '- App ID: ' + (ctx.appId || Parse.applicationId || 'unknown'),
    '- Parse Server URL: ' + (ctx.serverURL || 'unknown')
  ].join('\n');
  var messages = [{ role: 'system', content: SYSTEM_PROMPT + '\n' + contextLines }];
  if (Array.isArray(history)) {
    history.forEach(function (m) {
      if (m && m.role && m.content !== null && m.content !== undefined && m.content !== '') {
        messages.push({ role: m.role === 'agent' ? 'assistant' : m.role, content: String(m.content) });
      }
    });
  }
  messages.push({ role: 'user', content: userMessage });

  var body = { model: model, messages: messages, max_completion_tokens: 2000, tools: databaseTools, tool_choice: 'auto', stream: false };
  var data = await callOpenAI(apiKey, body);
  if (!data || !Array.isArray(data.choices) || data.choices.length === 0) { throw new Error('No response received from OpenAI API'); }
  var responseMessage = data.choices[0].message;

  if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
    var toolResponses = [];
    for (var i = 0; i < responseMessage.tool_calls.length; i++) {
      var toolCall = responseMessage.tool_calls[i];
      if (toolCall.type !== 'function') { continue; }
      try {
        var fnArgs = JSON.parse(toolCall.function.arguments || '{}');
        var result = await executeDatabaseFunction(toolCall.function.name, fnArgs, operationLog, permissions);
        toolResponses.push({ tool_call_id: toolCall.id, role: 'tool', content: result ? JSON.stringify(result) : JSON.stringify({ success: true }) });
      } catch (err) {
        toolResponses.push({ tool_call_id: toolCall.id, role: 'tool', content: JSON.stringify({ error: err.message || 'Unknown error' }) });
      }
    }
    var followUp = { model: model, messages: messages.concat([responseMessage]).concat(toolResponses), max_completion_tokens: 2000, tools: databaseTools, tool_choice: 'auto', stream: false };
    var followUpData = await callOpenAI(apiKey, followUp);
    if (!followUpData || !Array.isArray(followUpData.choices) || followUpData.choices.length === 0) { throw new Error('No follow-up response received from OpenAI API'); }
    return followUpData.choices[0].message.content || 'Done.';
  }
  return responseMessage.content || 'Done.';
}

// Parse the AGENT_MODELS env var. Prefer base64(JSON); fall back to plain JSON.
function parseAgentModels(raw) {
  if (!raw) { return []; }
  try { var p = JSON.parse(raw); if (Array.isArray(p)) { return p; } } catch (e) { /* not plain JSON */ }
  try {
    var json = Buffer.from(raw, 'base64').toString('utf8');
    var p2 = JSON.parse(json);
    if (Array.isArray(p2)) { return p2; }
  } catch (e) { /* not base64 JSON */ }
  return [];
}

Parse.Cloud.define('dashboardAgent', async function (request) {
  // Only the dashboard (calling with the master key) may run the agent.
  if (!request.master) {
    throw new Parse.Error(Parse.Error.OPERATION_FORBIDDEN, 'The dashboardAgent function requires the master key.');
  }

  var params = request.params || {};
  var message = params.message;
  var modelName = params.modelName;
  var permissions = params.permissions || {};
  var history = params.history || [];
  var appContext = params.appContext || {};

  if (!message || typeof message !== 'string' || message.trim() === '') {
    throw new Parse.Error(Parse.Error.VALIDATION_ERROR, 'Message is required');
  }

  var apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Parse.Error(Parse.Error.VALIDATION_ERROR, 'No OpenAI API key configured (set the OPENAI_API_KEY environment variable).');
  }

  // AGENT_MODELS is stored base64-encoded (JSON with quotes/braces gets mangled
  // by container env-var injection). Accept both base64 and legacy plain JSON.
  var models = parseAgentModels(process.env.AGENT_MODELS);
  if (models.length === 0) {
    throw new Parse.Error(Parse.Error.VALIDATION_ERROR, 'No models configured (set the AGENT_MODELS environment variable).');
  }

  var modelConfig = models.filter(function (m) { return m.name === modelName; })[0] || models[0];
  if (!modelConfig || !modelConfig.model) {
    throw new Parse.Error(Parse.Error.VALIDATION_ERROR, 'Model "' + modelName + '" not found in configuration');
  }
  var provider = (modelConfig.provider || 'openai').toLowerCase();
  if (provider !== 'openai') {
    throw new Parse.Error(Parse.Error.VALIDATION_ERROR, 'Provider "' + provider + '" is not supported yet');
  }

  var operationLog = [];
  var response = await runAgent(message.trim(), modelConfig.model, apiKey, history, operationLog, permissions, appContext);
  return { response: response, debug: { modelUsed: modelConfig.model, operations: operationLog } };
});
