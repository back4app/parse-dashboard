/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import React from 'react';
import DashboardView from 'dashboard/DashboardView.react';
import Toolbar from 'components/Toolbar/Toolbar.react';
import Markdown from 'components/Markdown/Markdown.react';
import B4aEmptyState from 'components/B4aEmptyState/B4aEmptyState.react';
import B4aModal from 'components/B4aModal/B4aModal.react';
import Icon from 'components/Icon/Icon.react';
import AppOverviewCodeEditorBlock from 'dashboard/Data/AppOverview/AppOverviewCodeEditorBlock.react';
import { CurrentApp } from 'context/currentApp';
import { withRouter } from 'lib/withRouter';
import AgentKeyDialog from './AgentKeyDialog.react';
import { getBack4app2, AGENT_FLAVOR } from 'lib/back4app2Client';
import { ChatMessageStatus } from '@back4app2/sdk';
import styles from './Agent.scss';

// Turn a raw agent failure (often a full Python traceback / container-startup
// dump) into a single human-facing line: the final "SomeError: message" from the
// traceback, else the first line stripped of the "Last container logs:" noise.
function cleanErrorMessage(raw) {
  const text = String(raw || '').trim();
  if (!text) { return 'The agent failed to respond.'; }
  const matches = [...text.matchAll(/(?:[A-Za-z_][\w.]*)?(?:Error|Exception):\s*([^\n]+)/g)];
  if (matches.length) { return matches[matches.length - 1][1].trim(); }
  return text.split('\n')[0].replace(/\s*Last container logs:.*$/i, '').trim() || 'The agent failed to respond.';
}

// Agent-container states where the runtime is still coming up — sending a
// message now yields "agent has not initialized". Gate the chat until the agent
// leaves this set (i.e. reaches READY).
const AGENT_STARTING_STATES = ['INITIALIZING', 'INITIALIZED', 'LAUNCHING'];
function isAgentStarting(agent) {
  return !!agent && AGENT_STARTING_STATES.indexOf(agent.status) !== -1;
}

// Starter prompts shown in the empty state — clicking one submits it. Ported
// from the upstream agent chat.
const EXAMPLE_PROMPTS = [
  'How many users do I have?',
  'What classes do I have in my database?',
  'Can you fill a class with test data?',
];

// One-time caution pinned at the top of the conversation: the agent operates on
// this app's data with elevated (master-key) access. Ported from the upstream
// agent chat.
const AGENT_WARNING =
  'The Backend Agent has full access to this app\'s database using the master key. ' +
  'It can read, modify, and delete any data. This is highly recommended for ' +
  'development environments only. Always back up important data before using the ' +
  'agent.';

// Strip the agent's technical chatter from a response and pull out the progress
// events, mirroring back4app2's AgentMessage parsing. The agent streams
// ```agent-progress\n{json}\n``` fences (current tool/stage), plus tool-call /
// tool-result / app-info fences and some legacy lines — none of which should be
// shown as raw text. Returns the clean human-facing text + the latest event.
function parseAgentContent(content) {
  const text = String(content || '');
  const events = [];
  const progressRe = /`{3,}agent-progress\s*\n([\s\S]*?)\n`{3,}/g;
  let match;
  while ((match = progressRe.exec(text)) !== null) {
    try { events.push(JSON.parse(match[1].trim())); } catch (e) { /* ignore */ }
  }
  const cleaned = text
    .replace(/`{3,}agent-progress\s*\n[\s\S]*?\n`{3,}/g, '')
    .replace(/`{3,}(?:tool-call|tool-result|app-info)\s*\n[\s\S]*?\n`{3,}/g, '')
    // Drop the agent's standalone "Done." marker. Two things matter here:
    //   - It stays anchored to its own line. The previous /\s*Done\.\s*/ ate
    //     the blank lines around it too, welding the paragraph before a tool
    //     call onto the one after it — every tool call collapsed the reply into
    //     one dense block.
    //   - It runs BEFORE the "Using tool:" strip, which swallows the newline
    //     that keeps "Done." at the start of its own line. Reversed, the marker
    //     survives glued to the previous sentence.
    .replace(/^[ \t]*Done\.[ \t]*$/gm, '')
    .replace(/(?:\n\n)?Using tool:\s*`[^`]+`[^\n]*\n?/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  const lastEvent = events.length ? events[events.length - 1] : null;
  return { cleaned, lastEvent };
}

/**
 * Backend Agent (flavor V4) chat, scoped to the current Parse app.
 *
 * Consumes the back4app2 SDK directly (GraphQL + graphql-ws), authenticated via
 * the shared `connect.sid` session cookie from the navbar. Resolves the V4 agent
 * bound to this app (agent.currentAppId === app.appId), then streams its chat.
 * Only the chat is used here — no preview/sandbox/hosting.
 */
@withRouter
class AgentV4 extends DashboardView {
  static contextType = CurrentApp;

  constructor(props) {
    super(props);
    this.section = 'Backend Agent';
    this.state = {
      agent: null,
      chatId: null,
      messages: [],
      inputValue: '',
      isLoading: true,
      isSending: false,
      isCreating: false,
      showKeyDialog: false,
      keyDialogMode: 'create', // 'create' (no agent yet) | 'new' (replace)
      modal: null, // confirmation modal (B4aModal), like the Cloud Code section
      error: null,
    };
    this.chatWindowRef = React.createRef();
    this.chatInputRef = React.createRef();
    this.subscription = null;
    this.statusPoll = null;
    this._loadedAppId = null;
  }

  componentDidMount() {
    this._loadedAppId = this.context ? this.context.applicationId : null;
    this.init();
  }

  componentDidUpdate() {
    // The view is reused across apps — reload when the app changes.
    const appId = this.context ? this.context.applicationId : null;
    if (appId !== this._loadedAppId) {
      this._loadedAppId = appId;
      this.teardown();
      this.setState({ agent: null, chatId: null, messages: [], error: null, isLoading: true }, () => this.init());
    }
  }

  componentWillUnmount() {
    this.teardown();
  }

  teardown() {
    if (this.subscription) {
      try { this.subscription.unsubscribe(); } catch (e) { /* noop */ }
      this.subscription = null;
    }
    if (this.statusPoll) { clearTimeout(this.statusPoll); this.statusPoll = null; }
  }

  // Poll the agent's status until it leaves the "starting" states (reaches READY
  // or FAILED), so the chat input can un-gate. Stops itself when the view moves
  // to another agent/app or unmounts (teardown clears the timer).
  pollStatusUntilReady(agent) {
    if (this.statusPoll) { clearTimeout(this.statusPoll); this.statusPoll = null; }
    if (!isAgentStarting(agent)) { return; }
    const agentId = agent.id;
    const tick = async () => {
      if (!this.state.agent || this.state.agent.id !== agentId) { return; }
      try {
        const fresh = await getBack4app2().getAgent(agentId);
        if (!this.state.agent || this.state.agent.id !== agentId) { return; }
        this.setState(prev => ({ agent: { ...prev.agent, status: fresh.status } }));
        this.statusPoll = isAgentStarting(fresh) ? setTimeout(tick, 2500) : null;
      } catch (e) {
        this.statusPoll = setTimeout(tick, 3000); // transient — retry
      }
    };
    this.statusPoll = setTimeout(tick, 2000);
  }

  async init() {
    const appId = this.context ? this.context.applicationId : null;
    if (!appId) {
      this.setState({ isLoading: false, error: 'App context not available' });
      return;
    }
    try {
      const sdk = getBack4app2();
      const agents = await sdk.findAgents(AGENT_FLAVOR);
      const agent = (agents || []).find(a => a.currentAppId === appId) || null;
      if (!agent || !agent.mainChat) {
        this.setState({ isLoading: false, agent: null, chatId: null });
        return;
      }
      const chatId = agent.mainChat.id;
      const history = await sdk.findChatMessages(chatId);
      this.setState({ agent, chatId, messages: history || [], isLoading: false }, () => this.scrollToBottom());
      this.subscribe(chatId);
      this.pollStatusUntilReady(agent);
    } catch (error) {
      this.setState({ isLoading: false, error: error.message || String(error) });
    }
  }

  // The key is set at creation and is FIXED for the agent's life: an agent is
  // 1:1 with its app and its LLM provider/key can't be reconfigured in place
  // (switching OpenAI↔Anthropic means a new container = a new agent). So the
  // only ways to change it are "New agent" (destructive) and "Clear key".
  openCreateDialog = () => this.setState({ showKeyDialog: true, keyDialogMode: 'create' });
  openNewAgentDialog = () => this.setState({ showKeyDialog: true, keyDialogMode: 'new' });

  // 'create' = no agent yet; 'new' = replace the current one (delete + create).
  handleKeyDialogConfirm = creds =>
    this.state.keyDialogMode === 'new' ? this.replaceAgent(creds) : this.createAgent(creds);

  createAgent = async (creds = {}) => {
    if (this.state.isCreating) { return; }
    this.setState({ isCreating: true, showKeyDialog: false, error: null });
    await this._provisionAgent(creds);
  };

  // "New agent": permanently delete the current agent + conversation, then
  // provision a fresh one (optionally with a new key). This is the ONLY path to
  // switch the LLM key/provider.
  replaceAgent = async (creds = {}) => {
    if (this.state.isCreating) { return; }
    const { agent } = this.state;
    this.setState({ isCreating: true, showKeyDialog: false, error: null });
    try {
      if (agent) {
        await getBack4app2().deleteAgent(agent.id);
        this.teardown();
        this.setState({ agent: null, chatId: null, messages: [] });
      }
    } catch (error) {
      this.setState({ isCreating: false, error: error.message || String(error) });
      return;
    }
    await this._provisionAgent(creds);
  };

  // Shared creation core. Assumes isCreating is already true. Creates a V4 agent,
  // binds it to this app, optionally sets its own LLM key, then loads its chat.
  _provisionAgent = async ({ openaiApiKey, anthropicApiKey, model } = {}) => {
    const appId = this.context ? this.context.applicationId : null;
    if (!appId) {
      this.setState({ isCreating: false, error: 'App context not available' });
      return;
    }
    try {
      const sdk = getBack4app2();
      const name = (this.context && this.context.name) || 'App agent';
      const agent = await sdk.createAgent(name, AGENT_FLAVOR);
      await sdk.setAgentCurrentApp(agent.id, appId);
      const creds = {};
      if (openaiApiKey) { creds.openaiApiKey = openaiApiKey; }
      if (anthropicApiKey) { creds.anthropicApiKey = anthropicApiKey; }
      if (model) { creds.model = model; }
      if (Object.keys(creds).length > 0) {
        await sdk.setAgentLLMCredentials(agent.id, creds);
      }
      this.setState({ isCreating: false }, () => this.init());
    } catch (error) {
      this.setState({ isCreating: false, error: error.message || String(error) });
    }
  };

  // Delete the agent (and its chat) for this app. Confirm with a B4aModal, the
  // same danger dialog the Cloud Code section uses — not a browser alert.
  deleteAgent = () => {
    if (!this.state.agent) { return; }
    this.setState({
      modal: (
        <B4aModal
          type={B4aModal.Types.DANGER}
          icon="b4a-warn-fill-icon"
          iconFill="#cccccc"
          title="Delete agent?"
          buttonsInCenter={true}
          confirmText="Delete agent"
          onConfirm={this.confirmDeleteAgent}
          onCancel={() => this.setState({ modal: null })}
        >
          <span className={styles.subtitleModal}>
            This permanently deletes this agent and its entire conversation. This cannot be undone.
          </span>
        </B4aModal>
      ),
    });
  };

  confirmDeleteAgent = async () => {
    const { agent } = this.state;
    this.setState({ modal: null, error: null });
    if (!agent) { return; }
    try {
      await getBack4app2().deleteAgent(agent.id);
      this.teardown();
      this.setState({ agent: null, chatId: null, messages: [] });
    } catch (error) {
      this.setState({ error: error.message || String(error) });
    }
  };

  subscribe(chatId) {
    const sdk = getBack4app2();
    this.subscription = sdk.subscribeToChatMessageEvents(chatId, (error, event) => {
      if (error) {
        this.setState({ error: error.message || 'Connection error' });
        return;
      }
      if (!event || !event.object) { return; }
      this.upsertMessage(event.object);
    });
  }

  upsertMessage(msg) {
    this.setState(prev => {
      const idx = prev.messages.findIndex(m => m.id === msg.id);
      let messages;
      if (idx >= 0) {
        messages = prev.messages.slice();
        messages[idx] = msg;
      } else {
        messages = prev.messages.concat([msg]);
      }
      return { messages };
    }, () => this.scrollToBottom());
  }

  handleInputChange = event => this.setState({ inputValue: event.target.value });

  // Click on a starter prompt: drop it into the input and submit right away.
  handleExampleClick = text => {
    const { agent, isSending } = this.state;
    if (!agent || isSending || isAgentStarting(agent)) { return; }
    this.setState({ inputValue: text }, () => this.handleSubmit());
  };

  handleKeyDown = event => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.handleSubmit(event);
    }
  };

  handleSubmit = async event => {
    if (event) { event.preventDefault(); }
    const { inputValue, agent, isSending } = this.state;
    const question = inputValue.trim();
    if (!question || !agent || isSending || isAgentStarting(agent)) { return; }
    this.setState({ inputValue: '', isSending: true, error: null });
    try {
      // Optimistically show the question; the subscription streams the response.
      const created = await getBack4app2().askQuestionToAgent(agent.id, question);
      this.upsertMessage(created);
    } catch (error) {
      this.setState({ error: error.message || String(error) });
    } finally {
      // Keep the cursor in the input so the user can keep typing without
      // clicking back into it after every send.
      this.setState({ isSending: false }, () => {
        if (this.chatInputRef.current) { this.chatInputRef.current.focus(); }
      });
    }
  };

  scrollToBottom() {
    requestAnimationFrame(() => {
      const el = this.chatWindowRef.current;
      if (el) { el.scrollTop = el.scrollHeight; }
    });
  }

  // Render fenced code blocks with the read-only Monaco editor; prose via Markdown.
  formatMessageContent(content) {
    const text = String(content || '');
    const fence = /```([\w-]*)[ \t]*\r?\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    let key = 0;
    while ((match = fence.exec(text)) !== null) {
      const before = text.slice(lastIndex, match.index);
      if (before.trim()) { parts.push(<Markdown key={`t${key++}`} content={before} />); }
      const lang = match[1] || 'plaintext';
      const code = match[2].replace(/\n$/, '');
      parts.push(<AppOverviewCodeEditorBlock key={`c${key++}`} language={lang} value={code} />);
      lastIndex = fence.lastIndex;
    }
    const rest = text.slice(lastIndex);
    if (rest.trim()) {
      // The loop above consumed every CLOSED fence, so a ``` still sitting in
      // the tail is one the agent has not finished streaming. Handing it to
      // Markdown would render the code as a paragraph — and marked runs with
      // breaks:false, so every newline collapses and the block shows up as a
      // single line until the closing fence finally arrives.
      const unterminated = /```([\w-]*)[ \t]*\r?\n([\s\S]*)$/.exec(rest);
      if (unterminated) {
        const before = rest.slice(0, unterminated.index);
        if (before.trim()) { parts.push(<Markdown key={`t${key++}`} content={before} />); }
        parts.push(
          <AppOverviewCodeEditorBlock
            key={`c${key++}`}
            language={unterminated[1] || 'plaintext'}
            value={unterminated[2]}
          />
        );
      } else {
        parts.push(<Markdown key={`t${key++}`} content={rest} />);
      }
    }
    if (parts.length === 0) { return <Markdown content={text} />; }
    return <>{parts}</>;
  }

  renderToolbar() {
    const { agent } = this.state;
    return (
      <Toolbar section="Backend Agent">
        {agent ? (
          <a
            className={styles.toolbarIconBtn}
            title="New agent — start fresh (switches the LLM key/provider; the conversation is lost)"
            onClick={this.openNewAgentDialog}
          >
            <Icon name="b4a-refresh-icon" fill="#ffffff" width={18} height={18} />
          </a>
        ) : null}
        {agent ? (
          <a
            className={styles.toolbarIconBtn}
            title="Delete this agent and its conversation"
            onClick={this.deleteAgent}
          >
            <Icon name="b4a-delete-icon" fill="#E85C3E" width={22} height={18} />
          </a>
        ) : null}
      </Toolbar>
    );
  }

  // Compact "current task" indicator while the agent is working. `hasContent`
  // says the answer text has already streamed in, which changes what the
  // indicator should claim — see the !lastEvent branch below.
  renderProgress(lastEvent, status, hasContent) {
    // Cold start: the container is being provisioned for this message. Surface
    // it explicitly — it can take a while, and with no signal it looks like
    // nothing happened (until it suddenly becomes available).
    if (status === ChatMessageStatus.INITIALIZING) {
      return (
        <div className={styles.progressRow}>
          <div className={styles.typing}><span></span><span></span><span></span></div>
          <span className={styles.progressText}>
            Starting the agent… this can take a moment on the first message
          </span>
        </div>
      );
    }
    if (!lastEvent) {
      // The answer already streamed in full and no tool is running: what is
      // left is the agent's post-turn housekeeping (memory extraction +
      // session save) before it sends FINISHED, which is what flips the
      // message to RESPONDED. Animated dots here read as "still writing your
      // answer", so say what is actually happening instead.
      if (hasContent) {
        return (
          <div className={styles.progressRow}>
            <span className={styles.progressText}>Wrapping up…</span>
          </div>
        );
      }
      // Container is up; waiting for the first tokens.
      return (
        <div className={styles.progressRow}>
          <div className={styles.typing}><span></span><span></span><span></span></div>
          {status === ChatMessageStatus.INITIALIZED ? (
            <span className={styles.progressText}>Agent ready — thinking…</span>
          ) : null}
        </div>
      );
    }
    const label = lastEvent.stage || 'Working…';
    const detail = [lastEvent.tool, lastEvent.filePath].filter(Boolean).join(' · ');
    return (
      <div className={styles.progressRow}>
        <div className={styles.typing}><span></span><span></span><span></span></div>
        <span className={styles.progressText}>
          {label}{detail ? ` — ${detail}` : ''}
        </span>
      </div>
    );
  }

  renderMessages() {
    const { messages } = this.state;
    return (
      <div className={styles.messagesContainer}>
        <div className={styles.warningMessage}>
          <Icon name="b4a-warn-fill-icon" width={16} height={16} fill="#ffd97a" className={styles.warningIcon} />
          <div className={styles.warningContent}>{AGENT_WARNING}</div>
        </div>
        {messages.map(m => {
          const failed = m.status === ChatMessageStatus.FAILED || !!m.error;
          const done = m.status === ChatMessageStatus.RESPONDED;
          const inProgress = !failed && !done;
          const { cleaned, lastEvent } = failed ? { cleaned: '', lastEvent: null } : parseAgentContent(m.aiResponse);
          return (
            <React.Fragment key={m.id}>
              {m.question ? (
                <div className={`${styles.message} ${styles.user}`}>
                  <div className={styles.messageContent}>{m.question}</div>
                </div>
              ) : null}
              <div className={`${styles.message} ${styles.agent} ${failed ? styles.error : ''}`}>
                <div className={styles.messageContent}>
                  {failed
                    ? `Error: ${cleanErrorMessage(m.error && m.error.message)}`
                    : (
                      <>
                        {cleaned ? this.formatMessageContent(cleaned) : null}
                        {inProgress ? this.renderProgress(lastEvent, m.status, !!cleaned) : null}
                      </>
                    )}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  renderChatInput() {
    const { inputValue, isSending, agent } = this.state;
    const starting = isAgentStarting(agent);
    // Keep the textarea enabled while a send is in flight so it never loses
    // focus (only gate it before the agent is ready). Only the Send button is
    // disabled mid-send.
    const inputDisabled = !agent || starting;
    return (
      <form className={styles.chatForm} onSubmit={this.handleSubmit}>
        <div className={styles.inputContainer}>
          <textarea
            ref={this.chatInputRef}
            className={styles.chatInput}
            placeholder={starting
              ? 'Preparing your agent… you can chat once it is ready'
              : 'Type your message here…  (Shift+Enter for a new line)'}
            value={inputValue}
            onChange={this.handleInputChange}
            onKeyDown={this.handleKeyDown}
            disabled={inputDisabled}
            rows={1}
            autoFocus
          />
          <button
            type="submit"
            className={styles.sendButton}
            disabled={inputDisabled || isSending || inputValue.trim() === ''}
          >
            Send
          </button>
        </div>
      </form>
    );
  }

  renderContent() {
    const { messages, isLoading, agent, error, isCreating } = this.state;
    const hasAgent = !!agent;

    return (
      <div className={styles.agentContainer}>
        {this.renderToolbar()}
        <div className={styles.chatContainer}>
          <div ref={this.chatWindowRef} className={styles.chatWindow}>
            {hasAgent && messages.length > 0 ? this.renderMessages() : null}
            {hasAgent && messages.length === 0 ? (
              <div className={styles.inlineEmpty}>
                <B4aEmptyState
                  title="Backend Agent"
                  description={isAgentStarting(agent)
                    ? 'Preparing your agent… this can take a moment. You can chat once it is ready.'
                    : 'Ask the Backend Agent anything about this app to get started.'}
                />
                {!isAgentStarting(agent) ? (
                  <div className={styles.exampleQueries}>
                    <h4>Try asking:</h4>
                    <div className={styles.queryExamples}>
                      {EXAMPLE_PROMPTS.map(prompt => (
                        <button
                          key={prompt}
                          className={styles.exampleButton}
                          onClick={() => this.handleExampleClick(prompt)}
                        >
                          &ldquo;{prompt}&rdquo;
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
          {/* Input is always available once an agent exists. */}
          {hasAgent ? this.renderChatInput() : null}
        </div>

        {/* Full-screen overlay only when there is NO agent (create/loading). */}
        {!hasAgent && (
          <div className={styles.emptyStateOverlay}>
            <B4aEmptyState
              title="Backend Agent"
              description={
                isLoading
                  ? 'Loading…'
                  : isCreating
                    ? 'Creating your agent…'
                    : error
                      ? `Couldn't load the agent: ${error}`
                      : 'No Backend Agent is set up for this app yet. Create one to start chatting.'
              }
              cta={!isLoading && !isCreating ? 'Create agent' : undefined}
              action={!isLoading && !isCreating ? this.openCreateDialog : undefined}
            />
          </div>
        )}

        <AgentKeyDialog
          open={this.state.showKeyDialog}
          mode={this.state.keyDialogMode}
          onConfirm={this.handleKeyDialogConfirm}
          onClose={() => this.setState({ showKeyDialog: false })}
        />

        {this.state.modal}
      </div>
    );
  }
}

export default AgentV4;
