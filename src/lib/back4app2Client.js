/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

// Singleton client for the back4app2 GraphQL API (`@back4app2/sdk`), used by the
// AI Agent V4 chat. Authentication is implicit: the SDK reads the shared
// `connect.sid` session cookie set by the back4app2 navbar — the same session
// the rest of the environment uses. No token is passed here.
import { Back4app2 } from '@back4app2/sdk';

// back4app2 GraphQL endpoint (http + ws), driven by b4aSettings so each
// environment hits its own API: dev.json -> http://localhost:4040, homolog and
// production -> their respective hosts. Previously hardcoded to homolog, which
// made the local dashboard talk to the remote API (and fail auth, since the
// `connect.sid` cookie is scoped to localhost).
const HTTP_URL = b4aSettings.CONTAINERS_API_PATH;
// No separate WS entry in b4aSettings — derive it from the HTTP URL so the two
// can never drift apart: http -> ws, https -> wss.
const WS_URL = HTTP_URL.replace(/^http/, 'ws');

// Backend agent flavor this differentiated ("v4") dashboard agent talks to.
// v4 is the reduced, app-scoped agent for parse-dashboard — segregated from the
// full v3/v5 flavors (its own AgentFlavor in back4app2 + tools/v4 + base_v4 in
// the Python agent). Requires the v4 backend to be deployed.
export const AGENT_FLAVOR = 'V4';

let instance = null;

export function getBack4app2() {
  if (!instance) {
    instance = new Back4app2({ httpUrl: HTTP_URL, wsUrl: WS_URL });
  }
  return instance;
}

export default getBack4app2;
