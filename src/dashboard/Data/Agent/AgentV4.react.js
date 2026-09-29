/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import React from 'react';
import DashboardView from 'dashboard/DashboardView.react';
import { withRouter } from 'lib/withRouter';
import AgentChat from './AgentChat.react';

/**
 * Backend Agent page (/agent) — the expanded view of the docked agent panel.
 * Same agent, same thread; this one has room for long answers and holds the
 * owner actions (new agent / delete) in its toolbar.
 */
@withRouter
class AgentV4 extends DashboardView {
  constructor(props) {
    super(props);
    this.section = 'Backend Agent';
  }

  renderContent() {
    return <AgentChat variant="page" />;
  }
}

export default AgentV4;
