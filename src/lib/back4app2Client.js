/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

// Singleton client for the back4app2 GraphQL API (`@back4app2/sdk`), used by the
// AI Agent V3 chat. Authentication is implicit: the SDK reads the shared
// `connect.sid` session cookie set by the back4app2 navbar — the same session
// the rest of the environment uses. No token is passed here.
import { Back4app2 } from '@back4app2/sdk';

// back4app2 GraphQL endpoint (http + ws). Homolog for now; lift into b4aSettings
// when we point at other environments.
const HTTP_URL = 'https://api.containers-homolog.back4app.com';
const WS_URL = 'wss://api.containers-homolog.back4app.com';

let instance = null;

export function getBack4app2() {
  if (!instance) {
    instance = new Back4app2({ httpUrl: HTTP_URL, wsUrl: WS_URL });
  }
  return instance;
}

export default getBack4app2;
