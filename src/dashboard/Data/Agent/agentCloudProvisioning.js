/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

// Raw source of the Cloud Function that runs inside the app's container.
import AGENT_SOURCE from './cloud/dashboard-agent.cloud.js?raw';

// Marker embedded in the generated file, used to tell "our file" apart from a
// same-named file the customer may already have.
export const AGENT_MARKER = '@back4app-dashboard-agent';

const AGENT_DIR = 'dashboard-agent';
const AGENT_FILE = 'index.js';
const REQUIRE_SNIPPET = "require('./" + AGENT_DIR + "/" + AGENT_FILE + "');";
const REQUIRE_MATCH = './' + AGENT_DIR + '/' + AGENT_FILE;

export class CloudCollisionError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CloudCollisionError';
    this.code = 'CLOUD_COLLISION';
  }
}

// Cloud Code file contents are stored as base64 data URIs (data:...;base64,<b64>),
// matching how the dashboard's Cloud Code editor and the deploy endpoint encode
// them. These helpers convert to/from that form. UTF-8 safe: a customer's
// main.js may contain accented characters that plain btoa/atob would corrupt.
const DATA_URI_PREFIX = 'data:plain/text;base64,';

function toBase64Utf8(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) { bin += String.fromCharCode(bytes[i]); }
  return window.btoa(bin);
}

function fromBase64Utf8(b64) {
  try {
    const bin = window.atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) { bytes[i] = bin.charCodeAt(i); }
    return new TextDecoder().decode(bytes);
  } catch (e) {
    return '';
  }
}

function encodeCode(text) {
  return DATA_URI_PREFIX + toBase64Utf8(text);
}

function decodeCode(code) {
  if (typeof code !== 'string' || !code) { return ''; }
  const idx = code.indexOf(';base64,');
  const b64 = idx !== -1 ? code.slice(idx + ';base64,'.length) : code;
  return fromBase64Utf8(b64);
}

function findCloudFolder(tree) {
  return (tree || []).find(node => node && node.text === 'cloud' && (node.type === 'folder' || Array.isArray(node.children)));
}

// Returns the DECODED source text of a file node.
function fileCode(node) {
  return decodeCode(node && node.data ? node.data.code : '');
}

// True if the app already has our agent file installed (marker present).
export function isAgentInstalled(tree) {
  const cloud = findCloudFolder(tree);
  if (!cloud || !Array.isArray(cloud.children)) { return false; }
  const dir = cloud.children.find(n => n && n.text === AGENT_DIR);
  if (!dir || !Array.isArray(dir.children)) { return false; }
  const file = dir.children.find(n => n && n.text === AGENT_FILE);
  return !!file && fileCode(file).indexOf(AGENT_MARKER) !== -1;
}

// Ensure main.js contains the require() that loads our agent file (append only).
function ensureRequire(cloud) {
  const main = cloud.children.find(n => n && n.text === 'main.js');
  if (!main) {
    cloud.children.push({ text: 'main.js', data: { code: encodeCode(REQUIRE_SNIPPET + '\n') } });
    return;
  }
  const code = fileCode(main);
  if (code.indexOf(REQUIRE_MATCH) === -1) {
    const sep = code.length && !code.endsWith('\n') ? '\n' : '';
    main.data = main.data || {};
    main.data.code = encodeCode(code + sep + REQUIRE_SNIPPET + '\n');
  }
}

/**
 * Return a modified copy of the cloud tree with the agent file+folder installed
 * (or updated to the latest source) and a require() ensured in main.js.
 *
 * Throws CloudCollisionError if a file/folder at cloud/dashboard-agent already
 * exists WITHOUT our marker (i.e. it belongs to the customer) — we never
 * overwrite code that isn't ours.
 */
export function injectAgent(tree) {
  // Work on a deep copy so callers can decide whether to persist.
  const next = JSON.parse(JSON.stringify(tree || []));
  let cloud = findCloudFolder(next);
  if (!cloud) {
    cloud = { text: 'cloud', type: 'folder', state: { opened: true }, children: [] };
    next.unshift(cloud);
  }
  if (!Array.isArray(cloud.children)) { cloud.children = []; }

  const existing = cloud.children.find(n => n && n.text === AGENT_DIR);
  if (existing) {
    // A non-folder node with our name → collision.
    if (existing.type && existing.type !== 'folder') {
      throw new CloudCollisionError('A file named "' + AGENT_DIR + '" already exists in your Cloud Code. Rename or remove it before configuring the AI Agent.');
    }
    if (!Array.isArray(existing.children)) { existing.children = []; }
    const file = existing.children.find(n => n && n.text === AGENT_FILE);
    if (file && fileCode(file).indexOf(AGENT_MARKER) === -1) {
      // Same-named file the customer created — do not clobber.
      throw new CloudCollisionError('A file "' + AGENT_DIR + '/' + AGENT_FILE + '" already exists in your Cloud Code and is not managed by the dashboard. Rename or remove it before configuring the AI Agent.');
    }
    if (file) {
      file.data = { code: encodeCode(AGENT_SOURCE) };
    } else {
      existing.children.push({ text: AGENT_FILE, data: { code: encodeCode(AGENT_SOURCE) } });
    }
  } else {
    cloud.children.push({
      text: AGENT_DIR,
      type: 'folder',
      state: { opened: false },
      children: [{ text: AGENT_FILE, data: { code: encodeCode(AGENT_SOURCE) } }]
    });
  }

  ensureRequire(cloud);

  // Strip helper flags the GET endpoint may have added.
  next.forEach(node => { if (node) { delete node.mainJsNotExists; delete node.indexHtmlNotExists; } });
  return next;
}

/**
 * Return a modified copy of the tree with our agent file/folder removed and the
 * require() line stripped from main.js. Only removes OUR file (marker-guarded).
 */
export function removeAgent(tree) {
  const next = JSON.parse(JSON.stringify(tree || []));
  const cloud = findCloudFolder(next);
  if (!cloud || !Array.isArray(cloud.children)) { return next; }

  const dir = cloud.children.find(n => n && n.text === AGENT_DIR);
  if (dir && Array.isArray(dir.children)) {
    const file = dir.children.find(n => n && n.text === AGENT_FILE);
    // Only remove if it is our managed file.
    if (file && fileCode(file).indexOf(AGENT_MARKER) !== -1) {
      dir.children = dir.children.filter(n => n !== file);
      if (dir.children.length === 0) {
        cloud.children = cloud.children.filter(n => n !== dir);
      }
    }
  }

  const main = cloud.children.find(n => n && n.text === 'main.js');
  if (main) {
    const lines = fileCode(main).split('\n').filter(line => line.indexOf(REQUIRE_MATCH) === -1);
    main.data = main.data || {};
    main.data.code = encodeCode(lines.join('\n'));
  }

  next.forEach(node => { if (node) { delete node.mainJsNotExists; delete node.indexHtmlNotExists; } });
  return next;
}
